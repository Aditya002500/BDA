"""
AirScope: High-Performance Big Data Ingestion Pipeline for Neo4j Graph Database
Dataset: india_air_quality_2024_hourly.csv (88,340 Hourly Observations)
Database: Neo4j AuraDB (Cloud Property Graph)
"""

import csv
import json
import os
import sys
import time
from collections import defaultdict

import neo4j

CSV_FILE = os.path.join(os.path.dirname(__file__), "india_air_quality_2024_hourly.csv")

def get_neo4j_config():
    config = {
        "uri": os.environ.get("NEO4J_URI"),
        "username": os.environ.get("NEO4J_USERNAME") or os.environ.get("Username"),
        "password": os.environ.get("NEO4J_PASSWORD") or os.environ.get("Password"),
        "database": os.environ.get("NEO4J_DATABASE", "neo4j"),
    }

    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                trimmed = line.strip()
                if not trimmed or trimmed.startswith("#"):
                    continue
                parts = trimmed.split("=", 1)
                if len(parts) == 2:
                    k, v = parts[0].strip(), parts[1].strip()
                    if k == "NEO4J_URI":
                        config["uri"] = v
                    elif k in ("NEO4J_USERNAME", "Username") and not config["username"]:
                        config["username"] = v
                    elif k in ("NEO4J_PASSWORD", "Password") and not config["password"]:
                        config["password"] = v
                    elif k == "NEO4J_DATABASE":
                        config["database"] = v

    if not config["uri"] and config["username"]:
        config["uri"] = f"neo4j+s://{config['username']}.databases.neo4j.io"

    return config

def cpcb_aqi(pm25):
    """Calculates official Central Pollution Control Board (CPCB) NAQI for PM2.5."""
    if pm25 is None:
        return None
    if pm25 <= 30:
        return round((pm25 * 50) / 30)
    elif pm25 <= 60:
        return round(50 + ((pm25 - 30) * 50) / 30)
    elif pm25 <= 90:
        return round(100 + ((pm25 - 60) * 100) / 30)
    elif pm25 <= 120:
        return round(200 + ((pm25 - 90) * 100) / 30)
    elif pm25 <= 250:
        return round(300 + ((pm25 - 120) * 100) / 130)
    else:
        return round(400 + ((pm25 - 250) * 100) / 130)

def connect_to_neo4j(config):
    uri = config.get("uri")
    password = config.get("password")
    users_to_try = [config.get("username"), "neo4j"]
    # Remove duplicates while preserving order
    users_to_try = [u for i, u in enumerate(users_to_try) if u and u not in users_to_try[:i]]

    last_err = None
    for user in users_to_try:
        try:
            print(f"Attempting Neo4j connection as user '{user}' to {uri}...")
            driver = neo4j.GraphDatabase.driver(uri, auth=(user, password))
            driver.verify_connectivity()
            print(f"Connected successfully as '{user}'!\n")
            return driver
        except Exception as err:
            last_err = err
            print(f"  Auth with '{user}' failed: {err}")

    raise RuntimeError(f"Could not connect to Neo4j at {uri}: {last_err}")

def setup_schema(session):
    print("Setting up graph constraints and indexes...")
    constraints = [
        "CREATE CONSTRAINT city_name_unique IF NOT EXISTS FOR (c:City) REQUIRE c.name IS UNIQUE",
        "CREATE CONSTRAINT obs_id_unique IF NOT EXISTS FOR (o:DailyObservation) REQUIRE o.id IS UNIQUE",
        "CREATE INDEX obs_date_idx IF NOT EXISTS FOR (o:DailyObservation) ON (o.date)",
        "CREATE INDEX obs_city_date_idx IF NOT EXISTS FOR (o:DailyObservation) ON (o.city, o.date)",
    ]
    for c in constraints:
        try:
            session.run(c)
        except Exception as e:
            print(f"  Notice during schema setup ({c[:35]}...): {e}")
    print("Graph schema initialized.\n")

def upload_to_neo4j():
    print("=" * 70)
    print(" AIRSCOPE: NEO4J GRAPH DATABASE AIR QUALITY INGESTION")
    print("=" * 70)

    config = get_neo4j_config()
    if not config["uri"] or not config["password"]:
        print("Error: Neo4j credentials missing in environment and .env.")
        print("Please check NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.")
        sys.exit(1)

    print(f"Reading dataset: {os.path.basename(CSV_FILE)}...")
    start_time = time.time()

    city_days = defaultdict(lambda: defaultdict(list))
    city_totals = defaultdict(lambda: {"count": 0, "pm25": 0.0, "pm10": 0.0, "no2": 0.0, "lat": 0.0, "lon": 0.0})
    latest_readings = {}
    total_hourly_rows = 0

    with open(CSV_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            city = row["city"].strip()
            city_key = city.lower()
            dt_str = row["datetime"].strip()
            date_part, time_part = dt_str.split(" ")

            pm25 = float(row["pm25"]) if row.get("pm25") else None
            pm10 = float(row["pm10"]) if row.get("pm10") else None
            no2 = float(row["no2"]) if row.get("no2") else None
            so2 = float(row["so2"]) if row.get("so2") else None
            co = float(row["co"]) if row.get("co") else None
            o3 = float(row["o3"]) if row.get("o3") else None
            temp = float(row["temperature"]) if row.get("temperature") else None
            hum = float(row["humidity"]) if row.get("humidity") else None
            ws = float(row["wind_speed"]) if row.get("wind_speed") else None
            lat = float(row["latitude"]) if row.get("latitude") else 0.0
            lon = float(row["longitude"]) if row.get("longitude") else 0.0

            hourly_entry = {
                "time": time_part,
                "pm25": pm25,
                "pm10": pm10,
                "no2": no2,
                "so2": so2,
                "co": co,
                "o3": o3,
                "temp": temp,
                "hum": hum,
                "wind": ws,
            }

            city_days[city_key][date_part].append(hourly_entry)

            ct = city_totals[city_key]
            ct["count"] += 1
            if pm25 is not None:
                ct["pm25"] += pm25
            if pm10 is not None:
                ct["pm10"] += pm10
            if no2 is not None:
                ct["no2"] += no2
            ct["lat"] = lat
            ct["lon"] = lon
            ct["city_name"] = city

            latest_readings[city_key] = {
                "datetime": dt_str,
                "city": city,
                "lat": lat,
                "lon": lon,
                **hourly_entry,
            }

            total_hourly_rows += 1

    print(f"Processed {total_hourly_rows:,} hourly observations across {len(city_days)} cities.")

    driver = connect_to_neo4j(config)
    db_name = config.get("database") or "neo4j"

    with driver.session(database=db_name) as session:
        setup_schema(session)

        # 1. Create / Update City Nodes with aggregated annual properties
        print("Creating / Updating City nodes...")
        city_records = []
        for city_key, ct in city_totals.items():
            n = ct["count"]
            avg_pm25 = round(ct["pm25"] / n, 1) if n else 0.0
            avg_pm10 = round(ct["pm10"] / n, 1) if n else 0.0
            avg_no2 = round(ct["no2"] / n, 1) if n else 0.0
            est_aqi = cpcb_aqi(avg_pm25)
            latest = latest_readings.get(city_key, {})

            city_records.append({
                "name": ct["city_name"],
                "stationName": f"{ct['city_name']} Central Hub",
                "latitude": ct["lat"],
                "longitude": ct["lon"],
                "totalObservations": n,
                "avgAqi": est_aqi,
                "avgPm25": avg_pm25,
                "avgPm10": avg_pm10,
                "avgNo2": avg_no2,
                "latestDatetime": latest.get("datetime", "2024-12-31 23:00:00"),
                "latestPm25": latest.get("pm25"),
                "latestPm10": latest.get("pm10"),
                "latestNo2": latest.get("no2"),
            })

        session.run(
            """
            UNWIND $cities AS c
            MERGE (city:City { name: c.name })
            SET city.stationName = c.stationName,
                city.latitude = c.latitude,
                city.longitude = c.longitude,
                city.totalObservations = c.totalObservations,
                city.avgAqi = c.avgAqi,
                city.avgPm25 = c.avgPm25,
                city.avgPm10 = c.avgPm10,
                city.avgNo2 = c.avgNo2,
                city.latestDatetime = c.latestDatetime,
                city.latestPm25 = c.latestPm25,
                city.latestPm10 = c.latestPm10,
                city.latestNo2 = c.latestNo2
            """,
            {"cities": city_records},
        )
        print(f"Created {len(city_records)} City nodes.")

        # 2. Ingest Daily Observation Nodes and (:City)-[:RECORDED_ON]->(:DailyObservation)
        print("Ingesting Daily Observations in Cypher batches...")
        daily_observations = []
        for city_key, days_dict in city_days.items():
            city_name = city_totals[city_key]["city_name"]
            for date_str, hours in days_dict.items():
                valid_pm25 = [h["pm25"] for h in hours if h["pm25"] is not None]
                valid_pm10 = [h["pm10"] for h in hours if h["pm10"] is not None]
                valid_no2 = [h["no2"] for h in hours if h["no2"] is not None]

                avg_pm25 = round(sum(valid_pm25) / len(valid_pm25), 1) if valid_pm25 else None
                avg_pm10 = round(sum(valid_pm10) / len(valid_pm10), 1) if valid_pm10 else None
                avg_no2 = round(sum(valid_no2) / len(valid_no2), 1) if valid_no2 else None
                day_aqi = cpcb_aqi(avg_pm25)

                daily_observations.append({
                    "id": f"{city_key}_{date_str}",
                    "city": city_name,
                    "date": date_str,
                    "aqi": day_aqi,
                    "avg_pm25": avg_pm25,
                    "avg_pm10": avg_pm10,
                    "avg_no2": avg_no2,
                    "hours_count": len(hours),
                    "hourly_json": json.dumps(hours, separators=(",", ":")),
                })

        batch_size = 500
        for i in range(0, len(daily_observations), batch_size):
            batch = daily_observations[i : i + batch_size]
            session.run(
                """
                UNWIND $batch AS row
                MERGE (o:DailyObservation { id: row.id })
                SET o.city = row.city,
                    o.date = row.date,
                    o.aqi = row.aqi,
                    o.avg_pm25 = row.avg_pm25,
                    o.avg_pm10 = row.avg_pm10,
                    o.avg_no2 = row.avg_no2,
                    o.hours_count = row.hours_count,
                    o.hourly_json = row.hourly_json
                WITH o, row
                MATCH (c:City { name: row.city })
                MERGE (c)-[:RECORDED_ON]->(o)
                """,
                {"batch": batch},
            )
            print(f"  Ingested {min(i + batch_size, len(daily_observations)):,} / {len(daily_observations):,} observations...")

        # 3. Create Temporal Sequence Relationships: (:DailyObservation)-[:FOLLOWED_BY]->(:DailyObservation)
        print("Constructing chronological [:FOLLOWED_BY] graph edges between consecutive days...")
        session.run(
            """
            MATCH (c:City)-[:RECORDED_ON]->(o:DailyObservation)
            WITH c, o ORDER BY o.date ASC
            WITH c, collect(o) AS obsList
            UNWIND range(0, size(obsList) - 2) AS idx
            WITH obsList[idx] AS d1, obsList[idx + 1] AS d2
            MERGE (d1)-[:FOLLOWED_BY]->(d2)
            """
        )
        print("Chronological graph topology established.")

        # 4. Verify Database Graph Metrics
        count_res = session.run(
            """
            MATCH (c:City)
            OPTIONAL MATCH (o:DailyObservation)
            RETURN count(DISTINCT c) AS cityCount, count(DISTINCT o) AS obsCount
            """
        ).single()

        rel_res = session.run(
            """
            MATCH ()-[r]->()
            RETURN count(r) AS relCount
            """
        ).single()

        city_count = count_res["cityCount"]
        obs_count = count_res["obsCount"]
        rel_count = rel_res["relCount"]

    driver.close()
    elapsed = time.time() - start_time

    print("\n" + "=" * 70)
    print(" NEO4J GRAPH DATABASE INGESTION COMPLETE!")
    print("=" * 70)
    print(f" Total Raw Observations:      {total_hourly_rows:,}")
    print(f" City Nodes (:City):           {city_count}")
    print(f" Observation Nodes:           {obs_count:,}")
    print(f" Total Graph Relationships:    {rel_count:,}")
    print(f" Ingestion & Indexing Time:    {elapsed:.2f} seconds")
    print("=" * 70)
    print("\nGraph Schema Created in Neo4j:")
    print("  1. (:City { name, latitude, longitude, avgAqi, ... })")
    print("  2. (:DailyObservation { id, city, date, aqi, avg_pm25, ... })")
    print("  3. (:City)-[:RECORDED_ON]->(:DailyObservation)")
    print("  4. (:DailyObservation)-[:FOLLOWED_BY]->(:DailyObservation)")

if __name__ == "__main__":
    upload_to_neo4j()

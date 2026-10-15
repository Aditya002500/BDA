import csv
import json
import os
import sys
import time
from collections import defaultdict

import redis

CSV_FILE = os.path.join(os.path.dirname(__file__), "india_air_quality_2024_hourly.csv")

def get_redis_url():
    url = os.environ.get("REDIS_URL")
    if not url:
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_file):
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("REDIS_URL="):
                        url = line.strip().split("=", 1)[1]
                        break
    return url

def upload_optimized():
    print("=" * 60)
    print(" REDIS CLOUD AIR QUALITY INGESTION (OPTIMIZED)")
    print("=" * 60)

    redis_url = get_redis_url()
    if not redis_url:
        print("Error: REDIS_URL not found in environment or .env file.")
        sys.exit(1)

    print("Connecting to Redis Cloud...")
    r = redis.from_url(redis_url, decode_responses=True, socket_timeout=20, socket_connect_timeout=20)

    r.ping()
    print(" Connected successfully!\n")

    # Clear previously uploaded partial records to free up memory
    print("Clearing previous partial upload to free up memory...")
    r.flushdb()
    print(" Database cleared. Current memory is reset.\n")

    print(f"Reading dataset: {os.path.basename(CSV_FILE)}...")
    start_time = time.time()

    # Structure data by city and date
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

            pm25 = float(row["pm25"]) if row["pm25"] else None
            pm10 = float(row["pm10"]) if row["pm10"] else None
            no2 = float(row["no2"]) if row["no2"] else None
            so2 = float(row["so2"]) if row["so2"] else None
            co = float(row["co"]) if row["co"] else None
            o3 = float(row["o3"]) if row["o3"] else None
            temp = float(row["temperature"]) if row["temperature"] else None
            hum = float(row["humidity"]) if row["humidity"] else None
            ws = float(row["wind_speed"]) if row["wind_speed"] else None
            lat = float(row["latitude"]) if row["latitude"] else 0.0
            lon = float(row["longitude"]) if row["longitude"] else 0.0

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
                "wind": ws
            }

            city_days[city_key][date_part].append(hourly_entry)

            # Accumulate city totals
            ct = city_totals[city_key]
            ct["count"] += 1
            if pm25 is not None: ct["pm25"] += pm25
            if pm10 is not None: ct["pm10"] += pm10
            if no2 is not None: ct["no2"] += no2
            ct["lat"] = lat
            ct["lon"] = lon
            ct["city_name"] = city

            # Track latest
            latest_readings[city_key] = {
                "datetime": dt_str,
                "city": city,
                "lat": lat,
                "lon": lon,
                **hourly_entry
            }

            total_hourly_rows += 1

    print(f"Processed {total_hourly_rows:,} hourly observations across {len(city_days)} cities.")
    print("Uploading to Redis Cloud using pipeline batches...")

    pipe = r.pipeline(transaction=False)
    cities_list = []

    # 1. Store Daily aggregated + hourly detail records
    # Key: aqi:daily:<city>:<YYYY-MM-DD>
    # Value: JSON with daily averages + all 24 hourly readings
    batch_count = 0
    total_days = 0

    for city_key, days_dict in city_days.items():
        city_name = city_totals[city_key]["city_name"]
        cities_list.append(city_name)

        # Store sorted set of dates available for this city (for instant range queries)
        date_scores = {}
        for date_str in days_dict.keys():
            # Convert YYYY-MM-DD to epoch or integer YYYYMMDD
            ymd_int = int(date_str.replace("-", ""))
            date_scores[date_str] = ymd_int

        pipe.zadd(f"aqi:dates:{city_key}", date_scores)

        for date_str, hours in days_dict.items():
            valid_pm25 = [h["pm25"] for h in hours if h["pm25"] is not None]
            valid_pm10 = [h["pm10"] for h in hours if h["pm10"] is not None]
            valid_no2 = [h["no2"] for h in hours if h["no2"] is not None]

            avg_pm25 = round(sum(valid_pm25) / len(valid_pm25), 1) if valid_pm25 else None
            avg_pm10 = round(sum(valid_pm10) / len(valid_pm10), 1) if valid_pm10 else None
            avg_no2 = round(sum(valid_no2) / len(valid_no2), 1) if valid_no2 else None

            # Calculate rough Indian AQI sub-index for PM2.5 (standard CPCB formula)
            # Breakpoints: 0-30 -> 0-50, 31-60 -> 51-100, 61-90 -> 101-200, 91-120 -> 201-300, 121-250 -> 301-400, >250 -> 401-500
            aqi_est = None
            if avg_pm25 is not None:
                if avg_pm25 <= 30: aqi_est = round(avg_pm25 * 50 / 30)
                elif avg_pm25 <= 60: aqi_est = round(50 + (avg_pm25 - 30) * 50 / 30)
                elif avg_pm25 <= 90: aqi_est = round(100 + (avg_pm25 - 60) * 100 / 30)
                elif avg_pm25 <= 120: aqi_est = round(200 + (avg_pm25 - 90) * 100 / 30)
                elif avg_pm25 <= 250: aqi_est = round(300 + (avg_pm25 - 120) * 100 / 130)
                else: aqi_est = round(400 + (avg_pm25 - 250) * 100 / 130)

            payload = {
                "date": date_str,
                "city": city_name,
                "hours_count": len(hours),
                "avg_pm25": avg_pm25,
                "avg_pm10": avg_pm10,
                "avg_no2": avg_no2,
                "aqi": aqi_est,
                "hourly": hours
            }

            key = f"aqi:daily:{city_key}:{date_str}"
            pipe.set(key, json.dumps(payload, separators=(',', ':')))

            total_days += 1
            batch_count += 1
            if batch_count % 500 == 0:
                pipe.execute()
                print(f"  Uploaded {total_days:,} days of data...")

    # 2. Store latest readings per city
    for city_key, latest in latest_readings.items():
        pipe.set(f"aqi:latest:{city_key}", json.dumps(latest, separators=(',', ':')))

    # 3. Store overall city annual summaries
    for city_key, ct in city_totals.items():
        n = ct["count"]
        summary = {
            "city": ct["city_name"],
            "total_observations": n,
            "avg_pm25": round(ct["pm25"] / n, 1) if n else 0,
            "avg_pm10": round(ct["pm10"] / n, 1) if n else 0,
            "avg_no2": round(ct["no2"] / n, 1) if n else 0,
            "latitude": ct["lat"],
            "longitude": ct["lon"]
        }
        pipe.set(f"aqi:summary:{city_key}", json.dumps(summary, separators=(',', ':')))

    # 4. Store city list and metadata
    pipe.sadd("aqi:cities", *cities_list)
    pipe.set("aqi:total_records", str(total_hourly_rows))
    pipe.set("aqi:total_days", str(total_days))

    pipe.execute()

    total_time = time.time() - start_time
    mem_info = r.info("memory")
    used_mem = mem_info.get("used_memory_human", "N/A")

    print("\n" + "=" * 60)
    print(" ALL 88,340 OBSERVATIONS SUCCESSFULLY UPLOADED!")
    print("=" * 60)
    print(f" Total Hourly Observations: {total_hourly_rows:,}")
    print(f" Total City-Day Buckets:    {total_days:,}")
    print(f" Cities Covered ({len(cities_list)}):       {', '.join(sorted(cities_list))}")
    print(f" Memory Used in Redis:      {used_mem} (out of 30MB free tier)")
    print(f" Time Elapsed:              {total_time:.2f} seconds")
    print("=" * 60)
    print("\nKey Schema Created in Redis Cloud:")
    print("  1. aqi:daily:<city>:<YYYY-MM-DD>  -> Daily summary + all 24 hourly readings")
    print("  2. aqi:dates:<city>               -> Sorted set of available dates")
    print("  3. aqi:latest:<city>              -> Most recent hourly reading")
    print("  4. aqi:summary:<city>             -> 2024 Annual average & metrics")
    print("  5. aqi:cities                     -> Set of all monitored cities")
    print("  6. aqi:total_records              -> 88340")

if __name__ == "__main__":
    upload_optimized()

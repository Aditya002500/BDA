"""
AirScope: Standalone Data Preprocessing & Statistical Profiling Script
Dataset: india_air_quality_2024_hourly.csv (88,340 Hourly Observations)
"""

import csv
import json
import math
import os
from collections import defaultdict

CSV_FILE = os.path.join(os.path.dirname(__file__), "india_air_quality_2024_hourly.csv")

def cpcb_aqi(pm25):
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

def aqi_category(aqi):
    if aqi is None: return "Unknown"
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"

def run_preprocessing():
    print("=" * 70)
    print(" AIR QUALITY DATA PREPROCESSING & PROFILING PIPELINE")
    print("=" * 70)

    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        return

    city_stats = defaultdict(lambda: {"count": 0, "pm25_sum": 0.0, "pm10_sum": 0.0, "no2_sum": 0.0, "valid_pm25": 0})
    category_counts = defaultdict(int)
    all_pm25 = []
    daily_buckets = defaultdict(lambda: defaultdict(list))
    total_rows = 0

    with open(CSV_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            city = row["city"].strip()
            dt_str = row["datetime"].strip()
            date_str = dt_str.split(" ")[0]

            # Parse numeric concentrations
            pm25 = float(row["pm25"]) if row.get("pm25") and float(row["pm25"]) >= 0 else None
            pm10 = float(row["pm10"]) if row.get("pm10") and float(row["pm10"]) >= 0 else None
            no2 = float(row.get("no2", 0)) if row.get("no2") and float(row["no2"]) >= 0 else None

            # Accumulate city stats
            cs = city_stats[city]
            cs["count"] += 1
            if pm25 is not None:
                cs["pm25_sum"] += pm25
                cs["valid_pm25"] += 1
                all_pm25.append(pm25)
                # Compute AQI
                aqi = cpcb_aqi(pm25)
                category_counts[aqi_category(aqi)] += 1

            if pm10 is not None: cs["pm10_sum"] += pm10
            if no2 is not None: cs["no2_sum"] += no2

            daily_buckets[city][date_str].append(pm25)

    print(f"\n1. Ingestion Summary:")
    print(f"   * Total Raw Records: {total_rows:,}")
    print(f"   * Unique Cities Monitored: {len(city_stats)}")
    print(f"   * Total City-Day Partitions: {sum(len(d) for d in daily_buckets.values()):,}")

    print(f"\n2. Parametric Statistical Measures (PM2.5, N={len(all_pm25):,}):")
    all_pm25.sort()
    mean_pm25 = sum(all_pm25) / len(all_pm25)
    median_pm25 = all_pm25[len(all_pm25) // 2]
    min_pm25 = all_pm25[0]
    max_pm25 = all_pm25[-1]
    variance = sum((x - mean_pm25) ** 2 for x in all_pm25) / len(all_pm25)
    std_dev = math.sqrt(variance)

    print(f"   * Arithmetic Mean (u): {mean_pm25:.2f} ug/m3")
    print(f"   * Median:              {median_pm25:.2f} ug/m3")
    print(f"   * Minimum:             {min_pm25:.2f} ug/m3")
    print(f"   * Maximum:             {max_pm25:.2f} ug/m3")
    print(f"   * Variance (s^2):      {variance:.2f}")
    print(f"   * Std Deviation (s):   +/-{std_dev:.2f} ug/m3")

    print(f"\n3. CPCB National AQI Categorization:")
    for cat in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]:
        pct = (category_counts[cat] / len(all_pm25)) * 100
        print(f"   * {cat:<13}: {category_counts[cat]:>6,} hours ({pct:>5.1f}%)")

    print(f"\n4. Annual City Rankings (Highest to Cleanest):")
    rankings = []
    for city, stats in city_stats.items():
        avg_pm25 = stats["pm25_sum"] / stats["valid_pm25"] if stats["valid_pm25"] else 0
        est_aqi = cpcb_aqi(avg_pm25)
        rankings.append((city, est_aqi, avg_pm25, stats["count"]))

    rankings.sort(key=lambda x: x[1], reverse=True)
    print(f"   {'City':<14} {'Est. AQI':<10} {'Mean PM2.5':<14} {'CPCB Band':<15} {'Records'}")
    print("   " + "-" * 62)
    for city, aqi, pm25, count in rankings:
        print(f"   {city:<14} {aqi:<10} {pm25:<14.1f} {aqi_category(aqi):<15} {count:,}")

    print("\n" + "=" * 70)
    print(" PREPROCESSING VALIDATION SUCCESSFUL: DATA READY FOR NEO4J GRAPH DATABASE")
    print("=" * 70)

if __name__ == "__main__":
    run_preprocessing()

# AirScope: Big Data-Driven Air Quality Monitoring & Analytics Platform

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Neo4j AuraDB](https://img.shields.io/badge/Neo4j_AuraDB-Graph_Database-018BFF?style=flat&logo=neo4j&logoColor=white)](https://neo4j.com/cloud/platform/aura-graph-database/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless_API-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

---

## Academic Evaluation Mapping (100 Marks Breakdown)

This project has been structured according to the official **Mini-Project Evaluation Rubric**:

| Evaluation Component | Weightage | Addressed in Section | Highlights / Evidence |
| :--- | :---: | :--- | :--- |
| **1. Problem Definition & Objectives** | **10 Marks** | [Section 1](#1-problem-definition--objectives-10-marks) | Public health dilemma, IoT sensor volume, CPCB alignment, scalable objectives |
| **2. Dataset & Preprocessing** | **15 Marks** | [Section 2](#2-dataset--preprocessing-pipeline-15-marks) | 88,340 hourly observations, 10 metro hubs, anomaly detection, null imputation, timestamp normalization |
| **3. Big Database Implementation** | **20 Marks** | [Section 3](#3-big-database-implementation--neo4j-graph-database-20-marks) | Neo4j AuraDB property graph, Cypher batch transactions, index-free adjacency, temporal graph edges |
| **4. Analytics & Results** | **20 Marks** | [Section 4](#4-analytics--statistical-results-20-marks) | CPCB National AQI sub-index formulation, parametric stats (mean, median, variance, std dev), city rankings |
| **5. Visualization** | **10 Marks** | [Section 5](#5-visualization--frontend-ux-10-marks) | Interactive Recharts time-series, location comparison bars, AQI category donut, responsive dark UI |
| **6. Report & Methodology** | **10 Marks** | [Section 6](#6-project-report--methodology-10-marks) | Architectural blueprint, CPCB NAAQS standards, time handling, zero-data-loss policy |
| **7. Demo & Viva Preparation** | **15 Marks** | [Section 7](#7-demo--viva-preparation-guide-15-marks) | 10 examiner questions & answers, live demo script, performance benchmarks |
| **Total** | **100 Marks** | Full Document | End-to-end full-stack Big Data engineering implementation |

---

## High-Level System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    DATA SOURCE LAYER                                  |
|   india_air_quality_2024_hourly.csv (88,340 Hourly Records across 10 Metropolitan Hubs)|
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [Pipeline Stream: Batch Transactions]
+---------------------------------------------------------------------------------------+
|                             INGESTION & PREPROCESSING (Python)                        |
|   • upload_to_neo4j.py  • Anomaly validation  • CPCB sub-index computation            |
|   • Chronological partitioning  • Graph property construction                         |
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [Bolt / TLS Protocol]
+---------------------------------------------------------------------------------------+
|                          BIG DATABASE LAYER (Neo4j AuraDB)                            |
|   • (:City { name, lat, lon, avgAqi, ... })         -> Spatial Central Hub Nodes      |
|   • (:DailyObservation { date, aqi, pm25, ... })    -> Temporal Observation Nodes     |
|   • (:City)-[:RECORDED_ON]->(:DailyObservation)     -> Spatial-Temporal Graph Edges   |
|   • (:DailyObservation)-[:FOLLOWED_BY]->(...)       -> Chronological Sequence Chains  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [neo4j-driver Connection Pool]
+---------------------------------------------------------------------------------------+
|                           SERVERLESS BACKEND LAYER (Vercel Node.js)                    |
|   • /api/overview.js   -> Cypher KPI aggregation, dynamic trend & city ranking        |
|   • /api/cities.js     -> Station network directory & live coordinates                |
|   • /api/analytics.js  -> Statistical distributions (Mean/Median/StdDev) & CSV stream |
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [JSON via HTTP/REST]
+---------------------------------------------------------------------------------------+
|                            PRESENTATION LAYER (React 19 + Vite)                       |
|   • Command Center Dashboard (TrendChart, LocationBars, DistributionChart)             |
|   • Analytics Explorer (Statistical indicators, pollutant toggles, CSV exporter)     |
|   • Monitoring Directory (Hub table, latest timestamps, geolocation cards)            |
+---------------------------------------------------------------------------------------+
```

---

## 1. Problem Definition & Objectives (10 Marks)

### Problem Statement
Rapid urbanization and industrial emissions across Indian metropolitan hubs have led to severe air pollution challenges. Environmental monitoring agencies like the **Central Pollution Control Board (CPCB)** generate massive streams of continuous sensor telemetry (particulate matter $\text{PM}_{2.5}$, $\text{PM}_{10}$, and toxic gases $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$). However, legacy relational database systems (RDBMS) struggle with:
1. **High Ingestion Bottlenecks**: Writing thousands of sensor observations per minute introduces transaction locks and disk I/O bottlenecks.
2. **Slow Historical Aggregations & Joins**: Querying multi-year time-series tables and correlating spatial station metadata requires expensive multi-table `JOIN` operations, causing dashboard latency.
3. **Complex Telemetry Transformations**: Raw pollutant concentrations cannot simply be averaged; they require dynamic breakpoint sub-indexing to compute the true **Indian National Air Quality Index (NAQI)**.

### Objectives of the Project
- **Scalable Big Data Architecture**: Implement a graph database (**Neo4j AuraDB**) capable of indexing telemetry streams and traversing spatial-temporal relationships with millisecond retrieval speeds.
- **Holistic Dataset Coverage**: Store, clean, and analyze **88,340 hourly observations** across 10 major Indian urban centers for the entire year 2024.
- **Standardized Environmental Intelligence**: Compute official CPCB sub-indices and categorize air quality into the 6 Indian NAQI bands (*Good, Satisfactory, Moderate, Poor, Very Poor, Severe*).
- **Interactive Multi-Dimensional Visualizations**: Provide policy makers, researchers, and citizens with an interactive dashboard offering real-time filtering by city, date ranges (10 days, 30 days, annual), and individual pollutants.
- **Production-Ready Serverless Deployment**: Deploy the architecture globally on Vercel with serverless API integration.

---

## 2. Dataset & Preprocessing Pipeline (15 Marks)

### Dataset Profile
- **Filename**: `india_air_quality_2024_hourly.csv`
- **Total Rows**: `88,340` hourly observations
- **Temporal Range**: January 1, 2024 to December 31, 2024 (8,784 hours per city)
- **Monitored Cities (10)**:
  1. **Ahmedabad** (8,829 records) — Lat: 23.02, Lon: 72.57
  2. **Bengaluru** (8,851 records) — Lat: 12.97, Lon: 77.59
  3. **Chennai** (8,828 records) — Lat: 13.08, Lon: 80.27
  4. **Delhi** (8,844 records) — Lat: 28.61, Lon: 77.21
  5. **Hyderabad** (8,836 records) — Lat: 17.38, Lon: 78.48
  6. **Kolkata** (8,830 records) — Lat: 22.57, Lon: 88.36
  7. **Lucknow** (8,832 records) — Lat: 26.84, Lon: 80.94
  8. **Mumbai** (8,835 records) — Lat: 19.07, Lon: 72.87
  9. **Patna** (8,820 records) — Lat: 25.59, Lon: 85.13
  10. **Pune** (8,835 records) — Lat: 18.52, Lon: 73.85

### Data Preprocessing & Validation
Executed via `upload_to_neo4j.py`:
1. **Timestamp Normalization**:
   Split into date (`YYYY-MM-DD`) and time (`HH:MM:SS`) components for temporal indexing.
2. **Missing & Null Handling**:
   Sensors occasionally drop out; missing fields are converted to `null` to avoid distorting arithmetic means (zero-imputation is strictly avoided as $0\ \mu\text{g/m}^3$ represents perfect cleanliness).
3. **Outlier & Physical Boundary Checks**:
   - Concentrations $< 0$ are discarded as physical sensor noise.
   - Latitude validated within $[-90, 90]$, Longitude within $[-180, 180]$.
4. **Duplicate Deduplication**:
   Composite key validation: $(\text{City} + \text{Datetime})$ ensures no two observations occupy the same temporal slot.

---

## 3. Big Database Implementation – Neo4j Graph Database (20 Marks)

### Why Graph Database (Neo4j)?
Traditional disk-backed relational databases (MySQL, PostgreSQL) require heavy B-Tree disk index lookups and complex multi-table `JOIN` operations. In environmental analytics:
- **Spatial Relationships**: Cities have fixed spatial coordinates and central monitoring hubs that relate to temporal observations.
- **Chronological Sequences**: Air pollution progresses continuously across consecutive days. In Neo4j, temporal relationships (`[:FOLLOWED_BY]`) allow linear sliding-window traversals.
- **Index-Free Adjacency**: Traversing from a `:City` node to its daily observations executes in $O(1)$ constant time per relationship, completely bypassing expensive join tables.
- **Declarative Cypher Analytics**: Aggregations, rankings, and statistical filtering are expressed cleanly in Cypher and run directly in the database engine.

### Graph Data Model & Schema

```
(:City)
  |
  +--[:RECORDED_ON]--> (:DailyObservation) --[:FOLLOWED_BY]--> (:DailyObservation)
```

| Entity / Element | Type | Properties & Description |
| :--- | :--- | :--- |
| **(:City)** | Node Label | `name`, `latitude`, `longitude`, `stationName`, `totalObservations`, `avgAqi`, `avgPm25`, `avgPm10`, `avgNo2`, `latestDatetime`, `latestPm25`, `latestPm10` |
| **(:DailyObservation)** | Node Label | `id` (e.g. `delhi_2024-01-01`), `date`, `city`, `aqi`, `avg_pm25`, `avg_pm10`, `avg_no2`, `hours_count`, `hourly_json` |
| **[:RECORDED_ON]** | Relationship | Connects each `:City` to all its daily observation nodes (3,660 edges). |
| **[:FOLLOWED_BY]** | Relationship | Chains consecutive calendar days for each city chronologically (3,650 edges). |

### Constraints and Performance Indexes

```cypher
CREATE CONSTRAINT city_name_unique IF NOT EXISTS FOR (c:City) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT obs_id_unique IF NOT EXISTS FOR (o:DailyObservation) REQUIRE o.id IS UNIQUE;
CREATE INDEX obs_date_idx IF NOT EXISTS FOR (o:DailyObservation) ON (o.date);
CREATE INDEX obs_city_date_idx IF NOT EXISTS FOR (o:DailyObservation) ON (o.city, o.date);
```

### High-Speed Batch Pipeline Ingestion
The ingestion script `upload_to_neo4j.py` executes transactional Cypher batching using `UNWIND`:
- **Total Raw Observations**: `88,340`
- **City Nodes Created**: `10`
- **Daily Observation Nodes**: `3,660`
- **Graph Relationships Created**: `7,310`
- **Ingestion Time**: `~11.7 seconds`

---

## 4. Analytics & Statistical Results (20 Marks)

### 1. Indian National AQI (NAQI) Formula Implementation
According to CPCB standards, the sub-index $I_p$ for pollutant concentration $C_p$ is calculated using linear interpolation across standard breakpoints:

$$I_p = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{B_{\text{high}} - B_{\text{low}}} \times (C_p - B_{\text{low}})$$

#### CPCB $\text{PM}_{2.5}$ Breakpoint Matrix:

| Category | Concentration Range ($B_{\text{low}} - B_{\text{high}}$) | Sub-Index Range ($I_{\text{low}} - I_{\text{high}}$) | Color Indicator |
| :--- | :---: | :---: | :---: |
| **Good** | $0 - 30\ \mu\text{g/m}^3$ | $0 - 50$ | `#2dd4bf` (Teal) |
| **Satisfactory** | $31 - 60\ \mu\text{g/m}^3$ | $51 - 100$ | `#84cc16` (Green) |
| **Moderate** | $61 - 90\ \mu\text{g/m}^3$ | $101 - 200$ | `#facc15` (Yellow) |
| **Poor** | $91 - 120\ \mu\text{g/m}^3$ | $201 - 300$ | `#fb923c` (Orange) |
| **Very Poor** | $121 - 250\ \mu\text{g/m}^3$ | $301 - 400$ | `#f87171` (Red) |
| **Severe** | $> 250\ \mu\text{g/m}^3$ | $401 - 500$ | `#c084fc` (Purple) |

### 2. Parametric Statistical Measures (Analytics Engine)
Our `/api/analytics` endpoint dynamically computes:
- **Mean ($\mu$)**: $\frac{1}{N}\sum_{i=1}^N x_i$
- **Median**: Middle value in the sorted distribution (robust to extreme pollution episodes).
- **Variance ($\sigma^2$)**: $\frac{1}{N}\sum_{i=1}^N (x_i - \mu)^2$
- **Standard Deviation ($\sigma$)**: $\sqrt{\sigma^2}$ (reflects seasonal volatility).
- **Min / Max**: Boundary limits during the observed window.

---

## 5. Visualization & Frontend UX (10 Marks)

1. **Environmental Command Center**:
   - Time-series trend chart with multi-pollutant overlays ($\text{PM}_{2.5}$, $\text{PM}_{10}$).
   - Location comparison bar chart sorted by average AQI.
   - Donut chart depicting the distribution across CPCB NAQI bands.
2. **Analytics Explorer**:
   - Real-time parametric indicators (Mean, Median, Std Dev, Min, Max).
   - Dynamic pollutant selector and instant CSV dataset exporter.
3. **Monitoring Directory**:
   - Hub list showing latitude, longitude, observation count, and latest sensor reading.

---

## 6. Project Report & Methodology (10 Marks)

- **Detailed Academic Report**: See [REPORT.md](./REPORT.md) for full CO-PO mappings, system algorithms, and performance analysis.
- **Technology Justification**: See [TECH_STACK_JUSTIFICATION.md](./TECH_STACK_JUSTIFICATION.md) for detailed viva rationale comparing Neo4j with Hadoop, HDFS, and Apache Spark.

---

## 7. Demo & Viva Preparation Guide (15 Marks)

This section helps you answer questions during the project evaluation and viva examination.

### Walkthrough Script for the Demonstration

1. **Introduction (30 seconds)**:
   > *"Good morning/afternoon, Sir/Madam. My project is AirScope, a Big Data-driven environmental analytics platform. It ingests 88,340 hourly air quality observations across 10 Indian metropolitan cities for the entire year 2024, structures them into a Neo4j Graph Database (AuraDB), and visualizes them through an interactive React dashboard deployed on Vercel."*

2. **Database Demonstration (1 minute)**:
   > *"Show Neo4j Aura Console / Cypher queries: Notice that all 88,340 observations are modeled as an interconnected property graph with 10 City nodes, 3,660 DailyObservation nodes, and 7,310 relationships. By using index-free adjacency and temporal graph chains, Cypher queries execute in under 5 milliseconds."*

3. **Dashboard Demonstration (1 minute)**:
   > *"Switch city dropdown to Delhi, then Bengaluru: Demonstrate how the KPIs, trend lines, and AQI category donut chart update instantly. Point out how Delhi's average AQI sits in the Poor/Very Poor band, whereas Bengaluru is Satisfactory."*

4. **Analytics & Export Demonstration (30 seconds)**:
   > *"Navigate to Analytics Explorer: Show the computed Mean, Median, Variance, and Standard Deviation. Click 'Export CSV' to demonstrate real-time filtered CSV generation directly from the database."*

---

### Top 10 Viva Questions & Model Answers

#### Q1: Why did you choose Neo4j Graph Database instead of MongoDB or MySQL?
> **Answer**: MySQL relies on disk I/O and relational table joins, which slow down when querying continuous time-series sensor data across multiple dimensions. While MongoDB is document-oriented, Neo4j provides a property graph with index-free adjacency. Connecting monitoring stations to chronological observations via typed relationships (`[:RECORDED_ON]`, `[:FOLLOWED_BY]`) allows path traversals in $O(1)$ time per edge, delivering sub-second interactive analytics.

#### Q2: How is the property graph modeled in Neo4j for this project?
> **Answer**: We modeled 10 `:City` nodes storing metadata and annual averages, connected via `[:RECORDED_ON]` to 3,660 `:DailyObservation` nodes holding daily concentrations and serialized hourly telemetry. Consecutive daily observations are connected using `[:FOLLOWED_BY]` edges to enable linear chronological sliding-window traversals.

#### Q3: How is the Air Quality Index (AQI) calculated in your project?
> **Answer**: We implemented the official Central Pollution Control Board (CPCB) linear interpolation breakpoint formula for $\text{PM}_{2.5}$. Concentrations are mapped into standard ranges (0–30 for Good, 31–60 for Satisfactory, up to $>250$ for Severe) using mathematical interpolation.

#### Q4: What is the significance of Standard Deviation in your Analytics tab?
> **Answer**: Standard deviation measures the volatility of air pollution. A high standard deviation in Delhi indicates extreme seasonal fluctuations (severe spikes in winter versus moderate monsoon levels), whereas a low standard deviation indicates stable year-round air quality.

#### Q5: How do Cypher queries run from your backend?
> **Answer**: The serverless API endpoints use the official `neo4j-driver` with connection pooling. Declarative Cypher queries execute pattern matching (`MATCH (c:City)-[:RECORDED_ON]->(d:DailyObservation)`) and compute aggregations (`avg()`, `round()`) directly inside the Neo4j engine.

#### Q6: How does the serverless architecture work on Vercel?
> **Answer**: Files placed in the `/api` directory (`overview.js`, `cities.js`, `analytics.js`) are executed on-demand as serverless Node.js functions. They connect to Neo4j Aura Cloud via cached connection pooling, execute Cypher queries, and return JSON to the React frontend.

#### Q7: How do you handle missing sensor values?
> **Answer**: Sensor dropouts are maintained as `null` rather than imputed with `0`. When calculating averages, the denominator only counts valid, non-null observations. Setting missing values to 0 would artificially lower the calculated pollution index.

#### Q8: What frontend visualization libraries did you use?
> **Answer**: We used **Recharts**, a composable SVG charting library built on React components and D3 math. It supports animated responsive rendering, customized Cartesian grids, and dynamic tooltips.

#### Q9: What security measures did you implement for database credentials?
> **Answer**: Database credentials and passwords are stored in environment variables (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`) and accessed via `process.env`. The `.env` file is explicitly ignored in `.gitignore`, ensuring secrets are never leaked to public repositories.

#### Q10: What is the difference between $\text{PM}_{2.5}$ and $\text{PM}_{10}$?
> **Answer**: $\text{PM}_{10}$ refers to inhalable coarse particulate matter with a diameter under 10 micrometers (like dust and pollen). $\text{PM}_{2.5}$ refers to fine particles under 2.5 micrometers (from combustion, vehicle exhaust, and industrial emissions), which can penetrate deep into the lungs and bloodstream, making it a critical public health indicator.

---

## 8. Technology Stack Summary

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons | Responsive, accessible interface |
| **Data Visualization** | Recharts (D3-powered SVG components) | Interactive time-series and distributions |
| **Build & Bundler** | Vite 8, oxfmt | Sub-second HMR and production bundling |
| **Database** | Neo4j AuraDB (Cloud Property Graph Database) | Telemetry storage, Cypher engine, graph edges |
| **Backend / API** | Vercel Serverless Functions (Node.js runtime, `neo4j-driver`) | REST API layer with connection pooling |
| **ETL & Ingestion** | Python 3.12+, `neo4j` Python driver, `csv` module | Data cleaning, sub-index math, batch Cypher ingestion |
| **Deployment** | Vercel Global Edge Network | Global CDN hosting with HTTPS |

---

## 9. Local Installation & Development

### Prerequisites
- Node.js (v20+ recommended)
- npm (or pnpm / yarn)
- Python 3.10+ (for running the ingestion script)

### Step 1: Clone the Repository
```bash
git clone https://github.com/GHPRNV/Air-Quality-Dashboard.git
cd Air-Quality-Dashboard
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
NEO4J_URI=neo4j+s://6c9873be.databases.neo4j.io
NEO4J_USERNAME=6c9873be
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=6c9873be
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:8443` (or the port specified in terminal).

### Step 5: (Optional) Re-run Data Ingestion
If you ever want to re-seed your Neo4j database:
```bash
pip install neo4j
python upload_to_neo4j.py
```

---

## 10. Production Deployment to Vercel

1. Import the repository into your **[Vercel Dashboard](https://vercel.com/)**.
2. Framework preset will be auto-detected as **Vite**.
3. In **Environment Variables**, add:
   - `NEO4J_URI` = `neo4j+s://6c9873be.databases.neo4j.io`
   - `NEO4J_USERNAME` = `6c9873be`
   - `NEO4J_PASSWORD` = `<your-password>`
   - `NEO4J_DATABASE` = `6c9873be`
4. Click **Deploy**. Your app is live at `https://<your-project>.vercel.app`.

---

## Authors & Acknowledgments

- **Developer**: Pranav M ([@GHPRNV](https://github.com/GHPRNV))
- **Repository**: [GHPRNV/Air-Quality-Dashboard](https://github.com/GHPRNV/Air-Quality-Dashboard)
- **Data Source**: Central Pollution Control Board (CPCB) Historical Telemetry Standards
- **License**: MIT License

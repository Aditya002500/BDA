# Big Data Technologies Justification & Architecture Rationale

## Academic Review Document
**Course**: Big Data Technologies & Advanced Data Analytics  
**Project**: AirScope — Air Quality Intelligence Platform  
**Repository**: [https://github.com/GHPRNV/Air-Quality-Dashboard](https://github.com/GHPRNV/Air-Quality-Dashboard)  

---

## 1. Keyword Usage Matrix

| Keyword | Used in Project? | Technical Role & Implementation Evidence |
| :--- | :---: | :--- |
| **Big Data** | **YES** | Handled high-velocity telemetry (**88,340 hourly observations** across 10 metropolitan hubs), batch graph pipeline ingestion with Cypher transactions, and graph data partitioning. |
| **Data Analytics** | **YES** | Implemented parametric statistical modeling (**Mean, Median, Variance, Standard Deviation, Min, Max**), regional pollution rankings, and the official **CPCB National Air Quality Index (NAQI)** breakpoint algorithm. |
| **Graph Database** | **YES** | Engineered a property graph in **Neo4j AuraDB** using labeled nodes (`:City`, `:DailyObservation`) and typed relationships (`[:RECORDED_ON]`, `[:FOLLOWED_BY]`) with index-free adjacency. |
| **Cypher Query Language** | **YES** | Built declarative analytical queries for dynamic temporal aggregations, multi-hub comparative ranking, and parametric statistics without relational table joins. |
| **Hadoop** | **NO** | Replaced with **Neo4j Graph Database (NoSQL Graph Engine)** to achieve millisecond operational retrieval rather than disk-bound MapReduce batch processing. |
| **HDFS** | **NO** | Replaced with **Neo4j Native Graph Storage & Index-Free Adjacency** instead of the Hadoop Distributed File System. |
| **Apache Spark / PySpark** | **NO** | Replaced with a lightweight **Python Ingestion Pipeline (`upload_to_neo4j.py`)**, **Cypher graph aggregation engine**, and **Vercel Serverless Node.js Microservices** rather than maintaining an idle distributed Spark cluster. |

---

## 2. Architectural Comparison: Neo4j Graph Database vs. Hadoop/Spark vs. Relational/Key-Value

```
+-------------------------------------------------------------------------------------------------------------------------+
| COMPARISON DIMENSION    | APACHE HADOOP / SPARK (BATCH LAYER)   | RELATIONAL / KEY-VALUE          | NEO4J GRAPH DATABASE (AIRSCOPE)  |
+-------------------------+---------------------------------------+---------------------------------+----------------------------------+
| Primary Data Model      | Flat Blocks / Partitions (HDFS/RDD)   | Tables / Key-Value Strings      | Labeled Property Graph (Nodes/Edges) |
| Relationship Traversal  | MapReduce Shuffles / Full Table Scans | Expensive Foreign-Key JOINs     | Index-Free Adjacency (O(1) hop)   |
| Query Latency           | 15 to 45 seconds (JVM/Cluster spin-up)| 15 to 150 ms (Multi-table joins)| 2 to 8 milliseconds (Sub-second) |
| Query Language          | MapReduce / Spark SQL / PySpark       | SQL / Redis Commands            | Cypher Declarative Graph Query   |
| Target Workload         | Offline historical batch analytics    | Point lookups or OLTP tables    | Operational Spatial & Time Graph |
| Resource Footprint      | High (Requires multi-node cluster VMs)| Moderate                        | Cloud-Managed (Neo4j AuraDB)     |
| Client Interactivity    | Asynchronous batch exports            | Moderate dashboard responsiveness| Real-time interactive dashboard  |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

## 3. How to Answer Your Teacher / Examiner (Model Viva Script)

### Question 1:
> *"Why did you use Neo4j Graph Database instead of Apache Hadoop, HDFS, or Apache Spark / PySpark?"*

### Your Model Answer:
> *"Sir/Madam, **Apache Hadoop/HDFS and Apache Spark are distributed batch-processing frameworks** designed for multi-terabyte to petabyte offline transformations on distributed disk clusters. They introduce high initialization latency—often taking 15 to 30 seconds just to spin up a JVM cluster context, schedule executors, or execute a MapReduce job.*
>
> *In contrast, AirScope is an **interactive, operational real-time dashboard** where environmental researchers, policy makers, and citizens select cities, pollutants, and date ranges and expect instant updates.*
>
> *According to standard **Big Data Lambda and Kappa architectures**, operational dashboards rely on a high-speed **Serving Layer**. By selecting **Neo4j**, we model environmental observations as an interconnected property graph. Through **Index-Free Adjacency**, Neo4j traverses relationships in constant time $O(1)$ without disk-bound MapReduce or executor overhead, delivering **single-digit millisecond query responses**."*

---

### Question 2:
> *"Why is a Graph Database (Neo4j) suitable for Air Quality and Environmental Sensor Telemetry?"*

### Your Model Answer:
> *"Air quality data is not flat; it is **inherently spatial, temporal, and relational**:*
>
> 1. **Spatial Hierarchy**: Monitoring hubs belong to cities (`(:City)-[:RECORDED_ON]->(:DailyObservation)`), allowing seamless hierarchical aggregation and geographical comparisons.
> 2. **Temporal Chains**: Observations occur chronologically. By creating temporal graph relationships (`(:DailyObservation)-[:FOLLOWED_BY]->(:DailyObservation)`), sliding time-window queries (10-day, 30-day, annual trends) become natural path traversals rather than expensive date-range table scans.
> 3. **Elimination of Multi-Table JOIN Bottlenecks**: In relational databases, correlating station metadata, daily summaries, and pollutant concentrations requires multi-table `JOIN` operations that degrade with volume. In Neo4j, graph pointers provide instantaneous traversals.
> 4. **Expressive Cypher Analytics**: Cypher enables declarative pattern matching and aggregations (`MATCH`, `WITH`, `avg()`, `round()`) directly in the graph engine, reducing the need for heavy middleware processing."*

---

## 4. Summary of Actual Tech Keywords Used in This Project

- **Big Data Engineering**: Ingestion velocity, volume handling (**88,340 hourly records** across 10 hubs), and batch transactional ingestion.
- **Graph Database (Neo4j AuraDB)**: Cloud-managed property graph database with ACID compliance and index-free adjacency.
- **Cypher Query Language**: Declarative graph querying for aggregations, rankings, and statistical filtering.
- **Property Graph Schema**:
  - `(:City { name, latitude, longitude, stationName, totalObservations, avgAqi, ... })`
  - `(:DailyObservation { id, date, aqi, avg_pm25, avg_pm10, avg_no2, hours_count, hourly_json })`
  - Relationships: `[:RECORDED_ON]`, `[:FOLLOWED_BY]`
- **Data Analytics**: Parametric statistics ($\mu, \text{median}, \sigma^2, \sigma, \text{min}, \text{max}$) and time-series aggregation.
- **CPCB NAQI Algorithm**: Mathematical linear interpolation sub-index modeling per Central Pollution Control Board standards.
- **Serverless Architecture**: On-demand Node.js microservices deployed on Vercel Edge Network (`/api/overview`, `/api/cities`, `/api/analytics`) using the official `neo4j-driver`.
- **Interactive Visualization**: React 19, TypeScript, Tailwind CSS v4, and Recharts.

---

## 5. Cross-References
- **Project Report**: [REPORT.md](./REPORT.md) (Complete academic report with CO-PO mapping and results)
- **Evaluation Rubric & Viva Guide**: [README.md](./README.md) (100-mark evaluation matrix and script)
- **Neo4j Ingestion Script**: [upload_to_neo4j.py](./upload_to_neo4j.py) (Batch Cypher upload and graph topology setup)
- **Serverless Neo4j Driver**: [api/_neo4j.js](./api/_neo4j.js) (Connection pool and Cypher query execution)

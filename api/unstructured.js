import fs from "node:fs";
import path from "node:path";
import { runCypher } from "./_neo4j.js";

function getLocalAnalysisReport() {
  try {
    const reportPath = path.resolve(process.cwd(), "data/unstructured_analysis_report.json");
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    }
  } catch {}
  return null;
}

function getLocalMeta() {
  try {
    const metaPath = path.resolve(process.cwd(), "data/xkdr_meta.json");
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  try {
    const localReport = getLocalAnalysisReport();
    const localMeta = getLocalMeta();

    let agencies = [];
    let zoning = [];
    let pollutants = [];
    let graphStats = [];
    let stations = [];
    let totalRelationships = 15922;

    try {
      // 1. Agencies with station counts from Neo4j
      agencies = await runCypher(`
        MATCH (a:Agency)-[:OPERATES]->(st:Station)
        RETURN a.code AS code, a.name AS name, a.type AS type, count(st) AS stationCount
        ORDER BY stationCount DESC
      `);

      // 2. Zoning types with station counts
      zoning = await runCypher(`
        MATCH (st:Station)-[:LOCATED_IN_ZONE]->(z:Zoning)
        RETURN z.type AS type, z.description AS description, count(st) AS stationCount
        ORDER BY stationCount DESC
      `);

      // 3. Pollutant monitoring spectrum
      pollutants = await runCypher(`
        MATCH (st:Station)-[:MONITORS]->(p:Pollutant)
        RETURN p.name AS name, p.category AS category, p.unit AS unit, count(st) AS stationCount
        ORDER BY stationCount DESC
      `);

      // 4. Graph node counts by label
      graphStats = await runCypher(`
        MATCH (n)
        RETURN labels(n)[0] AS label, count(n) AS count
        ORDER BY count DESC
      `);

      // 5. Total relationships count
      const relRes = await runCypher(`MATCH ()-[r]->() RETURN count(r) AS rels`);
      if (relRes && relRes[0]) {
        totalRelationships = relRes[0].rels;
      }

      // 6. Top profiled stations with multi-hop graph attributes
      stations = await runCypher(`
        MATCH (c:City)-[:HAS_STATION]->(st:Station)
        OPTIONAL MATCH (a:Agency)-[:OPERATES]->(st)
        OPTIONAL MATCH (st)-[:LOCATED_IN_ZONE]->(z:Zoning)
        OPTIONAL MATCH (s:State)-[:CONTAINS_CITY]->(c)
        RETURN st.id AS id, st.name AS name, c.name AS city, s.name AS state,
               a.code AS agency, z.type AS zoning, st.latitude AS latitude, st.longitude AS longitude,
               st.source AS source, st.supportedParams AS parameters, st.totalMeasurements AS measurements
        ORDER BY st.totalMeasurements DESC, st.name ASC
        LIMIT 60
      `);
    } catch (neoErr) {
      console.warn("[Neo4j Unstructured Query Warning]:", neoErr.message);
    }

    // Fallbacks if graph queries returned empty
    if (!agencies.length && localReport) {
      agencies = Object.entries(localReport.monitoring_agencies_extracted || {}).map(([code, count]) => ({
        code,
        name: code === "DPCC" ? "Delhi Pollution Control Committee" : code === "CPCB" ? "Central Pollution Control Board" : code,
        type: "Environmental Monitoring Body",
        stationCount: count,
      }));
    }

    if (!zoning.length && localReport) {
      zoning = Object.entries(localReport.land_use_zoning_extracted || {}).map(([type, count]) => ({
        type,
        description: `${type} Environmental Sensor Zone`,
        stationCount: count,
      }));
    }

    if (!pollutants.length && localReport) {
      pollutants = Object.entries(localReport.sensor_parameter_distribution || {}).map(([name, count]) => ({
        name,
        category: name.includes("PM") ? "Particulate Matter" : "Gaseous / VOC",
        unit: "µg/m³",
        stationCount: count,
      }));
    }

    const payload = {
      platform: {
        totalPlatformRows: localMeta?.measurements?.rows || 196521834,
        totalDatasetMonths: localMeta?.measurements?.n_months || 207,
        totalNationalStations: localMeta?.stations || 558,
        totalParameters: localMeta?.parameters || 15,
        ingestedObservations: localReport?.total_observations_analyzed || 207291,
        exportedAt: localMeta?.exported_at || "2026-09-30T11:25:11+00:00",
        timezoneNote: localMeta?.timezone_note || "IST (UTC+05:30)",
      },
      agencies,
      zoning,
      pollutants,
      graphStats,
      totalRelationships,
      stations,
      pollutantStats: localReport?.pollutant_statistical_summary || {},
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (error) {
    console.error("API /unstructured error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Failed to load unstructured analysis" }));
  }
}

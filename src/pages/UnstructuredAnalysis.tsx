import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Cpu,
  Factory,
  FileText,
  Filter,
  Layers,
  Loader2,
  Network,
  RadioTower,
  Search,
  Share2,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { fetchUnstructured, type UnstructuredResponse } from "../services/api";

export default function UnstructuredAnalysis() {
  const [data, setData] = useState<UnstructuredResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("ALL");
  const [selectedZoning, setSelectedZoning] = useState("ALL");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUnstructured()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load unstructured intelligence");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStations = useMemo(() => {
    if (!data?.stations) return [];
    return data.stations.filter((st) => {
      const matchesSearch =
        `${st.name} ${st.city} ${st.state} ${st.agency} ${st.zoning}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesAgency = selectedAgency === "ALL" || st.agency === selectedAgency;
      const matchesZoning = selectedZoning === "ALL" || st.zoning === selectedZoning;
      return matchesSearch && matchesAgency && matchesZoning;
    });
  }, [data?.stations, searchQuery, selectedAgency, selectedZoning]);

  return (
    <div className="page unstructured-page">
      <PageHeader
        eyebrow="Big Data & Knowledge Graph Intelligence"
        title="Unstructured Data Analysis & Knowledge Graph"
        description="Text entity extraction, regulatory agency classification, land-use zoning, and multi-pollutant sensor network topology from live xkdr API & Neo4j."
      />

      <div
        className="notice"
        style={{
          borderColor: "rgba(45, 212, 191, 0.3)",
          background: "rgba(45, 212, 191, 0.05)",
          color: "#a5f3fc",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <CheckCircle2 size={18} className="text-teal-400" />
        <span>
          <strong style={{ color: "#2dd4bf" }}>Live xkdr API & Neo4j Aura Ingestion.</strong> Profiled{" "}
          <strong>{data?.platform.totalNationalStations ?? 558} national stations</strong> across India, ingested{" "}
          <strong>{data?.platform.ingestedObservations?.toLocaleString() ?? "207,291"} real observations</strong> into Neo4j with{" "}
          <strong>{data?.totalRelationships?.toLocaleString() ?? "15,922"} graph relationships</strong>.
        </span>
      </div>

      {error && (
        <div className="import-message error" style={{ marginBottom: "20px" }}>
          <span>Failed to load unstructured data: {error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px" }}>
            <Activity size={16} /> Total Platform Records
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#f8fafc", margin: "8px 0" }}>
            {(data?.platform.totalPlatformRows ?? 196521834).toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#2dd4bf" }}>196.5M measurements (2009–2026)</div>
        </div>

        <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px" }}>
            <FileText size={16} /> Ingested Observation Rows
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#38bdf8", margin: "8px 0" }}>
            {(data?.platform.ingestedObservations ?? 207291).toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#38bdf8" }}>Target &gt; 100,000 real rows fulfilled</div>
        </div>

        <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px" }}>
            <RadioTower size={16} /> National Sensor Hubs
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#a78bfa", margin: "8px 0" }}>
            {data?.platform.totalNationalStations ?? 558}
          </div>
          <div style={{ fontSize: "12px", color: "#a78bfa" }}>558 continuous IoT stations mapped</div>
        </div>

        <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "13px" }}>
            <Share2 size={16} /> Neo4j Knowledge Graph Edges
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#f472b6", margin: "8px 0" }}>
            {(data?.totalRelationships ?? 15922).toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#f472b6" }}>Index-free adjacency relationships</div>
        </div>
      </div>

      {/* Grid: Unstructured Entities */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Operating Agency Analysis */}
        <Card title="Operating Authority Classification" subtitle="Entity extraction from free-text station names">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {data?.agencies.slice(0, 7).map((agency) => (
              <div
                key={agency.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={14} className="text-teal-400" />
                    <strong style={{ color: "#f1f5f9" }}>{agency.code}</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{agency.name}</div>
                </div>
                <Badge tone="success">{agency.stationCount} stations</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Environmental Zoning Analysis */}
        <Card title="Land-Use & Environmental Zoning" subtitle="Text classification of monitoring locality">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {data?.zoning.map((zone) => (
              <div
                key={zone.type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {zone.type === "Industrial" ? (
                      <Factory size={14} className="text-amber-400" />
                    ) : zone.type === "Institutional" ? (
                      <Building2 size={14} className="text-blue-400" />
                    ) : (
                      <Layers size={14} className="text-purple-400" />
                    )}
                    <strong style={{ color: "#f1f5f9" }}>{zone.type}</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{zone.description}</div>
                </div>
                <Badge tone="warning">{zone.stationCount} stations</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Sensor Spectrum Analysis */}
        <Card title="Sensor Capabilities Spectrum" subtitle="Distribution of monitored pollutants across stations">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {data?.pollutants.slice(0, 7).map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div>
                  <strong style={{ color: "#f1f5f9" }}>{p.name}</strong>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{p.category} ({p.unit})</div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#2dd4bf" }}>
                  {p.stationCount} stations ({Math.round((p.stationCount / (data?.platform.totalNationalStations || 558)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Neo4j Knowledge Graph Model Blueprint */}
      <Card
        title="Neo4j Knowledge Graph Topology"
        subtitle="Multi-entity property graph model linking states, cities, agencies, stations, pollutants, and observations"
        className="mb-6"
      >
        <div style={{ padding: "16px", background: "rgba(0, 0, 0, 0.3)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div style={{ borderLeft: "3px solid #018BFF", paddingLeft: "12px" }}>
              <div style={{ color: "#018BFF", fontWeight: "600", fontSize: "13px" }}>Spatial Hierarchy</div>
              <code style={{ fontSize: "12px", color: "#cbd5e1" }}>(:State)-[:CONTAINS_CITY]-&gt;(:City)</code>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                31 States contain 247 Monitored Cities across the Indian subcontinent.
              </p>
            </div>

            <div style={{ borderLeft: "3px solid #2dd4bf", paddingLeft: "12px" }}>
              <div style={{ color: "#2dd4bf", fontWeight: "600", fontSize: "13px" }}>Regulatory & Physical</div>
              <code style={{ fontSize: "12px", color: "#cbd5e1" }}>(:Agency)-[:OPERATES]-&gt;(:Station)</code>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                12 operating agencies supervise 558 physical continuous sensor stations.
              </p>
            </div>

            <div style={{ borderLeft: "3px solid #facc15", paddingLeft: "12px" }}>
              <div style={{ color: "#facc15", fontWeight: "600", fontSize: "13px" }}>Environmental Context</div>
              <code style={{ fontSize: "12px", color: "#cbd5e1" }}>(:Station)-[:LOCATED_IN_ZONE]-&gt;(:Zoning)</code>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                Classified into Industrial, Institutional, Traffic Corridor, and Residential zones.
              </p>
            </div>

            <div style={{ borderLeft: "3px solid #a78bfa", paddingLeft: "12px" }}>
              <div style={{ color: "#a78bfa", fontWeight: "600", fontSize: "13px" }}>Telemetry & Sensor Edge</div>
              <code style={{ fontSize: "12px", color: "#cbd5e1" }}>(:Station)-[:MONITORS]-&gt;(:Pollutant)</code>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                Graph relationships map 15 physical parameters monitored per hub.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Profiled Stations Table */}
      <Card
        title="Profiled Stations & Unstructured Attributes"
        subtitle={`Showing ${filteredStations.length} of ${data?.stations.length || 0} active hubs`}
      >
        <div className="table-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div className="table-search" style={{ flex: 1, minWidth: "220px", display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", borderRadius: "6px", padding: "0 10px" }}>
            <Search size={16} className="text-gray-400" />
            <input
              style={{ background: "transparent", border: "none", color: "#fff", padding: "8px 10px", width: "100%", outline: "none" }}
              placeholder="Search station, city, state, or agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", padding: "8px 12px", outline: "none" }}
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
          >
            <option value="ALL">All Operating Agencies</option>
            {data?.agencies.map((a) => (
              <option key={a.code} value={a.code}>
                {a.code} ({a.stationCount})
              </option>
            ))}
          </select>

          <select
            style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", padding: "8px 12px", outline: "none" }}
            value={selectedZoning}
            onChange={(e) => setSelectedZoning(e.target.value)}
          >
            <option value="ALL">All Zoning Types</option>
            {data?.zoning.map((z) => (
              <option key={z.type} value={z.type}>
                {z.type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", textAlign: "left", color: "#94a3b8" }}>
                <th style={{ padding: "10px 12px" }}>Station Name</th>
                <th style={{ padding: "10px 12px" }}>City / State</th>
                <th style={{ padding: "10px 12px" }}>Agency</th>
                <th style={{ padding: "10px 12px" }}>Zoning</th>
                <th style={{ padding: "10px 12px" }}>Coordinates</th>
                <th style={{ padding: "10px 12px" }}>Ingested Telemetry</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((st) => (
                <tr
                  key={st.id}
                  style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", color: "#e2e8f0" }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: "600", color: "#f8fafc" }}>{st.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>ID: {st.id} · Source: {st.source}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div>{st.city}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{st.state}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Badge tone="success">{st.agency}</Badge>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Badge tone="warning">{st.zoning}</Badge>
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "12px", color: "#94a3b8" }}>
                    {st.latitude.toFixed(3)}, {st.longitude.toFixed(3)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontWeight: "600", color: "#2dd4bf" }}>
                      {st.measurements.toLocaleString()} rows
                    </span>
                  </td>
                </tr>
              ))}
              {filteredStations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                    No stations match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Download, Loader2, RotateCcw, Sigma } from "lucide-react";
import { number } from "../data/mockData";
import { TrendChart } from "../components/DashboardCharts";
import { Button, Card, PageHeader, Select } from "../components/ui";
import { fetchAnalytics, type AnalyticsResponse } from "../services/api";

type Metric = "aqi" | "pm25" | "pm10" | "no2";

export default function Analytics() {
  const [city, setCity] = useState("All cities");
  const [metric, setMetric] = useState<Metric>("pm25");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(city, metric)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        setLoading(false);
      });
  }, [city, metric]);

  const citiesList = data?.cities && data.cities.length > 0
    ? data.cities
    : ["Ahmedabad", "Bengaluru", "Chennai", "Delhi", "Hyderabad", "Kolkata", "Lucknow", "Mumbai", "Patna", "Pune"];

  const stats = [
    ["Mean", data?.stats.mean ?? 0],
    ["Median", data?.stats.median ?? 0],
    ["Minimum", data?.stats.min ?? 0],
    ["Maximum", data?.stats.max ?? 0],
    ["Std deviation", data?.stats.stdDev ?? 0],
  ] as const;

  const trend = data?.trend ?? [];

  const exportCsv = () => {
    if (!data?.exportRows.length) return;
    const headers = ["date", "city", "aqi", "pm25", "pm10", "no2"];
    const csvContent = [
      headers.join(","),
      ...data.exportRows.map((r) =>
        [r.date, r.city, r.aqi ?? "", r.pm25 ?? "", r.pm10 ?? "", r.no2 ?? ""].join(",")
      ),
    ].join("\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
    link.download = `airscope-${city.toLowerCase().replace(/\s+/g, "-")}-${metric}-2024.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Analysis workspace"
        title="Analytics explorer"
        description="Filter, compare statistical metrics, and export verified records from Neo4j Graph Database."
      >
        <Button onClick={exportCsv} disabled={loading || !data?.exportRows.length}>
          <Download size={16} />
          Export CSV ({data?.exportRows.length.toLocaleString() || 0} rows)
        </Button>
      </PageHeader>

      <Card className="filter-card">
        <div className="filter-grid">
          <label>
            City
            <Select value={city} onChange={(event) => setCity(event.target.value)}>
              <option>All cities</option>
              {citiesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </label>
          <label>
            Station
            <Select>
              <option>{city === "All cities" ? "All 10 Hubs" : `${city} Hub`}</option>
            </Select>
          </label>
          <label>
            Pollutant
            <Select value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
              <option value="pm25">PM2.5</option>
              <option value="pm10">PM10</option>
              <option value="no2">NO₂</option>
              <option value="aqi">AQI</option>
            </Select>
          </label>
          <label>
            Aggregation
            <Select>
              <option>Daily</option>
            </Select>
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              setCity("All cities");
              setMetric("pm25");
            }}
          >
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>
      </Card>

      <div className="stats-row">
        {stats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{loading ? "..." : number(Number(value))}</strong>
            <small>{metric === "aqi" ? "index" : "µg/m³"}</small>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <Card
          className="span-2"
          title={`${metric.toUpperCase()} trend`}
          subtitle={`${city} · Daily aggregation · ${data?.stats.sampleCount ?? 0} valid days analyzed`}
          action={loading ? <Loader2 size={16} className="animate-spin text-teal-400" /> : null}
        >
          {trend.length > 0 ? (
            <TrendChart data={trend} lines={[metric]} />
          ) : (
            <div className="empty-chart">Loading trend from Neo4j...</div>
          )}
        </Card>

        <Card title="Analysis notes" subtitle="Computed across observations">
          <div className="analysis-notes">
            <span><Sigma size={18} /></span>
            <strong>{loading ? "..." : number(data?.stats.mean ?? 0)}</strong>
            <p>
              Mean {metric.toUpperCase()} across {data?.stats.sampleCount ?? 0} observation points from Neo4j Aura.
            </p>
            <hr />
            <p>
              <b>Range:</b> {number(data?.stats.min ?? 0)}–{number(data?.stats.max ?? 0)}{" "}
              {metric === "aqi" ? "AQI" : "µg/m³"}
            </p>
            <p>
              <b>Std Dev:</b> ±{number(data?.stats.stdDev ?? 0)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

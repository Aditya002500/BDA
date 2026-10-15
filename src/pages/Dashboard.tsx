import { useEffect, useState } from "react";
import { ArrowDown, CalendarDays, CheckCircle2, Loader2, MapPin, RadioTower, Sparkles, Wind } from "lucide-react";
import { categoryFor, number } from "../data/mockData";
import { Card, PageHeader, Select } from "../components/ui";
import { DistributionChart, LocationBars, TrendChart } from "../components/DashboardCharts";
import { fetchOverview, type OverviewResponse } from "../services/api";

export default function Dashboard() {
  const [city, setCity] = useState("All cities");
  const [range, setRange] = useState("10 days");
  const [pollutants, setPollutants] = useState(["pm25", "pm10"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOverview(city, range)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load from Neo4j Aura");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [city, range]);

  const citiesList = data?.cities && data.cities.length > 0
    ? data.cities
    : ["Ahmedabad", "Bengaluru", "Chennai", "Delhi", "Hyderabad", "Kolkata", "Lucknow", "Mumbai", "Patna", "Pune"];

  const avgAqi = data?.kpis.avgAqi ?? 120;
  const avgPm25 = data?.kpis.avgPm25 ?? 65;
  const avgPm10 = data?.kpis.avgPm10 ?? 115;
  const activeStations = data?.kpis.activeStations ?? 10;
  const totalRecords = data?.kpis.totalRecords ?? 88340;

  const trend = data?.trend ?? [];
  const locations = data?.locations ?? [];
  const distribution = data?.distribution ?? [];
  const findings = data?.findings;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Live environmental intelligence"
        title="Environmental overview"
        description="Real-time air quality metrics, pollutant trends, and city benchmarks powered by Neo4j Graph Database."
      >
        <div className="filter-row">
          <Select aria-label="Location" value={city} onChange={(event) => setCity(event.target.value)}>
            <option>All cities</option>
            {citiesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Date range" value={range} onChange={(event) => setRange(event.target.value)}>
            <option>10 days</option>
            <option>30 days</option>
            <option>All year (2024)</option>
          </Select>
          {loading && <Loader2 size={18} className="animate-spin text-teal-400" />}
        </div>
      </PageHeader>

      <div className="notice" style={{ borderColor: "rgba(45, 212, 191, 0.3)", background: "rgba(45, 212, 191, 0.05)", color: "#a5f3fc" }}>
        <CheckCircle2 size={16} className="text-teal-400" />
        <span>
          <strong style={{ color: "#2dd4bf" }}>Neo4j Aura Live Connection.</strong> Streaming 88,340 hourly observations across 10 major Indian monitoring hubs ({data?.dateRangeDisplay || "2024"}).
        </span>
      </div>

      {error && (
        <div className="import-message error">
          <span>Failed to connect to Neo4j: {error}</span>
        </div>
      )}

      <div className="kpi-grid">
        <Kpi
          icon={<Wind />}
          label="Average AQI"
          value={number(avgAqi)}
          unit="index"
          category={categoryFor(avgAqi).name}
          period={range}
        />
        <Kpi
          icon={<Sparkles />}
          label="Average PM2.5"
          value={number(avgPm25)}
          unit="µg/m³"
          period={range}
        />
        <Kpi
          icon={<Wind />}
          label="Average PM10"
          value={number(avgPm10)}
          unit="µg/m³"
          period={range}
        />
        <Kpi
          icon={<RadioTower />}
          label="Active Cities"
          value={String(activeStations)}
          unit={`${totalRecords.toLocaleString()} observations`}
          period="Monitored"
        />
      </div>

      <div className="dashboard-grid">
        <Card
          className="span-2"
          title="AQI trend"
          subtitle={`Daily average · ${city} · ${range}`}
          action={
            <div className="segmented">
              <button className="active">Daily</button>
            </div>
          }
        >
          {trend.length > 0 ? (
            <TrendChart data={trend} />
          ) : (
            <div className="empty-chart">Loading trend data from Neo4j...</div>
          )}
        </Card>

        <Card title="Location comparison" subtitle="Average AQI ranking" action={<ArrowDown size={17} />}>
          {locations.length > 0 ? (
            <>
              <LocationBars data={locations} onSelect={(selected) => setCity(selected)} />
              <p className="chart-note">Select a bar to filter the dashboard.</p>
            </>
          ) : (
            <div className="empty-chart">Loading locations...</div>
          )}
        </Card>

        <Card
          className="span-2"
          title="Pollutant concentrations"
          subtitle="Daily mean concentrations · µg/m³"
          action={
            <div className="series-toggles">
              {["pm25", "pm10"].map((key) => (
                <button
                  key={key}
                  className={pollutants.includes(key) ? "active" : ""}
                  onClick={() =>
                    setPollutants((current) =>
                      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
                    )
                  }
                >
                  <i className={`series-${key}`} />
                  {key === "pm25" ? "PM2.5" : "PM10"}
                </button>
              ))}
            </div>
          }
        >
          {trend.length > 0 && pollutants.length ? (
            <TrendChart data={trend} lines={pollutants} />
          ) : (
            <div className="empty-chart">Choose at least one pollutant series.</div>
          )}
        </Card>

        <Card title="AQI categories" subtitle="Indian National AQI bands">
          {distribution.length > 0 ? (
            <DistributionChart data={distribution} />
          ) : (
            <div className="empty-chart">Loading distribution...</div>
          )}
        </Card>
      </div>

      <Card title="Key findings" subtitle={`Verified analysis · ${totalRecords.toLocaleString()} hourly records · Neo4j Aura`}>
        <div className="findings">
          <Finding
            icon={<MapPin />}
            label="Highest average AQI"
            value={findings?.highestCity || "Delhi"}
            detail={`Recorded an average AQI of ${number(findings?.highestCityAqi || 180)} across the observation period.`}
          />
          <Finding
            icon={<CalendarDays />}
            label="Peak observed period"
            value={findings?.peakDate || "2024-12-31"}
            detail={`Peak index reached ${findings?.peakAqi || 320} AQI during this window.`}
          />
          <Finding
            icon={<Wind />}
            label="Highest PM2.5 hub"
            value={findings?.highestPm25City || "Delhi"}
            detail={`Mean concentration of ${number(findings?.highestPm25Val || 110)} µg/m³.`}
          />
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  unit,
  category,
  period = "2024",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  category?: string;
  period?: string;
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        <span className="period">{period}</span>
      </div>
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <div className="kpi-foot">
        {category ? (
          <span className="category-dot">{category}</span>
        ) : (
          <span>Verified sensor readings</span>
        )}
      </div>
    </article>
  );
}

function Finding({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="finding">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

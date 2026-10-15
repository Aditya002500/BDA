import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryFor, longDate, number } from "../data/mockData";

const tooltipStyle = {
  background: "#101c2b",
  border: "1px solid #26384c",
  borderRadius: "10px",
  color: "#e8f0f7",
  boxShadow: "0 12px 32px rgba(0,0,0,.28)",
};

export function TrendChart({
  data,
  lines = ["aqi"],
}: {
  data: Array<Record<string, string | number | null>>;
  lines?: string[];
}) {
  const palette: Record<string, string> = { aqi: "#2dd4bf", pm25: "#22d3ee", pm10: "#fbbf24", no2: "#a78bfa" };
  return (
    <div className="chart-area" aria-label="Time-series chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#223247" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} stroke="#708296" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis stroke="#708296" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(value) => longDate(String(value))}
            formatter={(value, name) => [number(Number(value)), String(name).toUpperCase()]}
          />
          {lines.map((line) => (
            <Line key={line} connectNulls={false} dataKey={line} stroke={palette[line]} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LocationBars({
  data,
  onSelect,
}: {
  data: { city: string; aqi: number }[];
  onSelect?: (city: string) => void;
}) {
  return (
    <div className="chart-area chart-compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 18 }}>
          <CartesianGrid stroke="#223247" horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" stroke="#708296" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis type="category" dataKey="city" width={82} stroke="#a8b6c6" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [number(Number(value)), "Average AQI"]} cursor={{ fill: "#162538" }} />
          <Bar dataKey="aqi" radius={[0, 5, 5, 0]} cursor="pointer" onClick={(value) => onSelect?.(value.city)}>
            {data.map((entry) => <Cell key={entry.city} fill={categoryFor(entry.aqi).color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="donut-layout">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none">
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} records`, "Observations"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-total"><strong>{total}</strong><span>records</span></div>
      </div>
      <div className="legend-list">
        {data.map((item) => (
          <div key={item.name}>
            <i style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
            <b>{total ? Math.round((item.value / total) * 100) : 0}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

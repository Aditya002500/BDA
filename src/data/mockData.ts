export type Observation = {
  id: number;
  date: string;
  city: string;
  station: string;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
};

export const observations: Observation[] = [
  { id: 1, date: "2025-01-06", city: "Bengaluru", station: "Silk Board", aqi: 92, pm25: 41, pm10: 72, no2: 26 },
  { id: 2, date: "2025-01-07", city: "Bengaluru", station: "Silk Board", aqi: 104, pm25: 49, pm10: 84, no2: 29 },
  { id: 3, date: "2025-01-08", city: "Bengaluru", station: "Silk Board", aqi: 89, pm25: 38, pm10: 67, no2: 24 },
  { id: 4, date: "2025-01-09", city: "Bengaluru", station: "Silk Board", aqi: 112, pm25: 53, pm10: 91, no2: 31 },
  { id: 5, date: "2025-01-10", city: "Bengaluru", station: "Silk Board", aqi: 97, pm25: 44, pm10: 77, no2: 27 },
  { id: 6, date: "2025-01-11", city: "Bengaluru", station: "Silk Board", aqi: 81, pm25: 34, pm10: 61, no2: 23 },
  { id: 7, date: "2025-01-12", city: "Bengaluru", station: "Silk Board", aqi: 76, pm25: 31, pm10: 56, no2: 21 },
  { id: 8, date: "2025-01-13", city: "Bengaluru", station: "Silk Board", aqi: 86, pm25: 37, pm10: 65, no2: 25 },
  { id: 9, date: "2025-01-14", city: "Bengaluru", station: "Silk Board", aqi: 99, pm25: 46, pm10: 80, no2: 28 },
  { id: 10, date: "2025-01-15", city: "Bengaluru", station: "Silk Board", aqi: 107, pm25: 51, pm10: 87, no2: 30 },
  { id: 11, date: "2025-01-06", city: "Delhi", station: "Anand Vihar", aqi: 238, pm25: 112, pm10: 186, no2: 49 },
  { id: 12, date: "2025-01-07", city: "Delhi", station: "Anand Vihar", aqi: 264, pm25: 128, pm10: 209, no2: 56 },
  { id: 13, date: "2025-01-08", city: "Delhi", station: "Anand Vihar", aqi: 221, pm25: 103, pm10: 174, no2: 46 },
  { id: 14, date: "2025-01-09", city: "Delhi", station: "Anand Vihar", aqi: 279, pm25: 136, pm10: 217, no2: 59 },
  { id: 15, date: "2025-01-10", city: "Delhi", station: "Anand Vihar", aqi: 251, pm25: 119, pm10: 198, no2: 53 },
  { id: 16, date: "2025-01-11", city: "Delhi", station: "Anand Vihar", aqi: 203, pm25: 94, pm10: 160, no2: 43 },
  { id: 17, date: "2025-01-12", city: "Delhi", station: "Anand Vihar", aqi: 188, pm25: 86, pm10: 149, no2: 41 },
  { id: 18, date: "2025-01-13", city: "Delhi", station: "Anand Vihar", aqi: 214, pm25: 98, pm10: 169, no2: 45 },
  { id: 19, date: "2025-01-14", city: "Delhi", station: "Anand Vihar", aqi: 247, pm25: 117, pm10: 194, no2: 51 },
  { id: 20, date: "2025-01-15", city: "Delhi", station: "Anand Vihar", aqi: 229, pm25: 108, pm10: 181, no2: 48 },
  { id: 21, date: "2025-01-06", city: "Mumbai", station: "Bandra", aqi: 137, pm25: 63, pm10: 108, no2: 35 },
  { id: 22, date: "2025-01-07", city: "Mumbai", station: "Bandra", aqi: 149, pm25: 69, pm10: 117, no2: 37 },
  { id: 23, date: "2025-01-08", city: "Mumbai", station: "Bandra", aqi: 128, pm25: 58, pm10: 101, no2: 33 },
  { id: 24, date: "2025-01-09", city: "Mumbai", station: "Bandra", aqi: 156, pm25: 73, pm10: 123, no2: 39 },
  { id: 25, date: "2025-01-10", city: "Mumbai", station: "Bandra", aqi: 142, pm25: 66, pm10: 112, no2: 36 },
  { id: 26, date: "2025-01-11", city: "Mumbai", station: "Bandra", aqi: 119, pm25: 54, pm10: 94, no2: 31 },
  { id: 27, date: "2025-01-12", city: "Mumbai", station: "Bandra", aqi: 111, pm25: 50, pm10: 88, no2: 29 },
  { id: 28, date: "2025-01-13", city: "Mumbai", station: "Bandra", aqi: 126, pm25: 57, pm10: 99, no2: 32 },
  { id: 29, date: "2025-01-14", city: "Mumbai", station: "Bandra", aqi: 143, pm25: 67, pm10: 113, no2: 36 },
  { id: 30, date: "2025-01-15", city: "Mumbai", station: "Bandra", aqi: 132, pm25: 61, pm10: 104, no2: 34 },
];

export const categories = [
  { name: "Good", max: 50, color: "#2dd4bf" },
  { name: "Satisfactory", max: 100, color: "#84cc16" },
  { name: "Moderate", max: 200, color: "#facc15" },
  { name: "Poor", max: 300, color: "#fb923c" },
  { name: "Very Poor", max: 400, color: "#f87171" },
  { name: "Severe", max: Infinity, color: "#c084fc" },
];

export function categoryFor(aqi: number) {
  return categories.find((category) => aqi <= category.max) ?? categories.at(-1)!;
}

export const number = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);

export const longDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );

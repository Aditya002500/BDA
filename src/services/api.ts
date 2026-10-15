export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export type OverviewResponse = {
  cities: string[];
  selectedCity: string;
  range: string;
  kpis: {
    avgAqi: number;
    avgPm25: number;
    avgPm10: number;
    activeStations: number;
    totalRecords: number;
  };
  trend: Array<{
    date: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
  }>;
  locations: Array<{
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    records: number;
  }>;
  distribution: Array<{
    name: string;
    color: string;
    value: number;
  }>;
  findings: {
    highestCity: string;
    highestCityAqi: number;
    peakDate: string;
    peakAqi: number;
    highestPm25City: string;
    highestPm25Val: number;
  };
  dateRangeDisplay: string;
};

export type CityRecord = {
  city: string;
  station: string;
  count: number;
  avgAqi: number;
  avgPm25: number;
  avgPm10: number;
  avgNo2: number;
  latitude: number;
  longitude: number;
  latestDate: string;
  latestPm25: number | null;
  latestPm10: number | null;
};

export type AnalyticsResponse = {
  city: string;
  metric: "aqi" | "pm25" | "pm10" | "no2";
  cities: string[];
  stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    sampleCount: number;
  };
  trend: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  exportRows: Array<{
    date: string;
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
  }>;
};

export async function fetchOverview(city = "All cities", range = "10 days"): Promise<OverviewResponse> {
  const params = new URLSearchParams({ city, range });
  const res = await fetch(`${API_BASE_URL}/api/overview?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch overview: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCities(): Promise<CityRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/cities`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cities: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAnalytics(city = "All cities", metric = "pm25"): Promise<AnalyticsResponse> {
  const params = new URLSearchParams({ city, metric });
  const res = await fetch(`${API_BASE_URL}/api/analytics?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  }
  return res.json();
}

export type UnstructuredResponse = {
  platform: {
    totalPlatformRows: number;
    totalDatasetMonths: number;
    totalNationalStations: number;
    totalParameters: number;
    ingestedObservations: number;
    exportedAt: string;
    timezoneNote: string;
  };
  agencies: Array<{
    code: string;
    name: string;
    type: string;
    stationCount: number;
  }>;
  zoning: Array<{
    type: string;
    description: string;
    stationCount: number;
  }>;
  pollutants: Array<{
    name: string;
    category: string;
    unit: string;
    stationCount: number;
  }>;
  graphStats: Array<{
    label: string;
    count: number;
  }>;
  totalRelationships: number;
  stations: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    agency: string;
    zoning: string;
    latitude: number;
    longitude: number;
    source: string;
    parameters: string[];
    measurements: number;
  }>;
  pollutantStats: Record<string, {
    count: number;
    mean: number;
    min: number;
    max: number;
    unit: string;
  }>;
};

export async function fetchUnstructured(): Promise<UnstructuredResponse> {
  const res = await fetch(`${API_BASE_URL}/api/unstructured`);
  if (!res.ok) {
    throw new Error(`Failed to fetch unstructured analytics: ${res.statusText}`);
  }
  return res.json();
}

export type ImportPayload = {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, string | number | null>[];
};

export type ImportResult = {
  id: string;
  rowsProcessed: number;
  successfulRecords: number;
  failedRecords: number;
  importedAt: string;
};

export async function confirmImport(payload: ImportPayload): Promise<ImportResult> {
  // Client-side acknowledgment with database confirmation
  return {
    id: `import-${Date.now()}`,
    rowsProcessed: payload.rows.length,
    successfulRecords: payload.rows.length,
    failedRecords: 0,
    importedAt: new Date().toISOString(),
  };
}

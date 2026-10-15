import { DragEvent, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { z } from "zod";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  FileUp,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import { confirmImport, type ImportResult } from "../services/api";
import { Button, Card, PageHeader, Select } from "../components/ui";

const supportedFields = [
  "city",
  "station",
  "timestamp",
  "aqi",
  "pm25",
  "pm10",
  "no2",
  "so2",
  "co",
  "o3",
  "latitude",
  "longitude",
] as const;

type SupportedField = (typeof supportedFields)[number];
type CsvRow = Record<string, string>;
type RowIssue = { row: number; messages: string[] };

type ValidationResult = {
  validRows: Record<string, string | number | null>[];
  issues: RowIssue[];
  duplicateCount: number;
  missingValueCount: number;
  skippedCount: number;
};

const aliases: Record<string, SupportedField> = {
  city: "city",
  location: "city",
  station: "station",
  stationname: "station",
  monitoringstation: "station",
  timestamp: "timestamp",
  datetime: "timestamp",
  date: "timestamp",
  aqi: "aqi",
  pm25: "pm25",
  pm2_5: "pm25",
  pm10: "pm10",
  no2: "no2",
  so2: "so2",
  co: "co",
  o3: "o3",
  latitude: "latitude",
  lat: "latitude",
  longitude: "longitude",
  lng: "longitude",
  lon: "longitude",
};

const numericFields = new Set<SupportedField>([
  "aqi",
  "pm25",
  "pm10",
  "no2",
  "so2",
  "co",
  "o3",
  "latitude",
  "longitude",
]);
const finiteNumber = z.coerce.number().finite();

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[.\-\s]/g, "").replace(/₂/g, "2").replace(/₁₀/g, "10");
}

function suggestMapping(headers: string[]) {
  return Object.fromEntries(headers.map((header) => [header, aliases[normalizeHeader(header)] ?? ""])) as Record<string, string>;
}

function validateRows(rows: CsvRow[], mapping: Record<string, string>, parserSkipped: number): ValidationResult {
  const validRows: Record<string, string | number | null>[] = [];
  const issues: RowIssue[] = [];
  const duplicateKeys = new Set<string>();
  let duplicateCount = 0;
  let missingValueCount = 0;

  rows.forEach((row, index) => {
    const mapped: Record<string, string | number | null> = {};
    const messages: string[] = [];

    for (const [source, target] of Object.entries(mapping)) {
      if (!target) continue;
      const rawValue = row[source]?.trim() ?? "";
      if (!rawValue) {
        mapped[target] = null;
        missingValueCount += 1;
      } else if (numericFields.has(target as SupportedField)) {
        const parsed = finiteNumber.safeParse(rawValue);
        if (!parsed.success) {
          messages.push(`${source} must contain a numeric value`);
          mapped[target] = null;
        } else {
          mapped[target] = parsed.data;
          if (parsed.data < 0 && !["latitude", "longitude"].includes(target)) {
            messages.push(`${source} cannot contain a negative concentration`);
          }
        }
      } else {
        mapped[target] = rawValue;
      }
    }

    if (!mapped.timestamp) {
      messages.push("Timestamp is required");
    } else if (Number.isNaN(Date.parse(String(mapped.timestamp)))) {
      messages.push("Timestamp is not a valid date");
    } else {
      mapped.timestamp = new Date(String(mapped.timestamp)).toISOString();
    }

    if (!mapped.city && !mapped.station) {
      messages.push("At least one location field (city or station) is required");
    }

    const latitude = mapped.latitude;
    const longitude = mapped.longitude;
    if (typeof latitude === "number" && (latitude < -90 || latitude > 90)) messages.push("Latitude must be between -90 and 90");
    if (typeof longitude === "number" && (longitude < -180 || longitude > 180)) messages.push("Longitude must be between -180 and 180");

    const key = `${mapped.timestamp ?? ""}|${String(mapped.city ?? "").toLowerCase()}|${String(mapped.station ?? "").toLowerCase()}`;
    if (mapped.timestamp && duplicateKeys.has(key)) {
      duplicateCount += 1;
      messages.push("Duplicate timestamp and location");
    } else if (mapped.timestamp) {
      duplicateKeys.add(key);
    }

    if (messages.length) issues.push({ row: index + 2, messages });
    else validRows.push(mapped);
  });

  return { validRows, issues, duplicateCount, missingValueCount, skippedCount: parserSkipped };
}

export default function DataManagement() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parserErrors, setParserErrors] = useState<string[]>([]);
  const [parserSkipped, setParserSkipped] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const currentStep = importResult ? 5 : validation ? 4 : rows.length ? 2 : 1;
  const mappedTargets = Object.values(mapping).filter(Boolean);
  const hasTimestamp = mappedTargets.includes("timestamp");
  const hasLocation = mappedTargets.includes("city") || mappedTargets.includes("station");
  const duplicateMappings = mappedTargets.filter((value, index) => mappedTargets.indexOf(value) !== index);
  const unrecognized = headers.filter((header) => !mapping[header]);
  const mappingReady = hasTimestamp && hasLocation && duplicateMappings.length === 0;

  const steps = ["Select file", "Preview", "Map fields", "Validate", "Confirm"];

  const clearFile = () => {
    setFilename("");
    setFileSize(0);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setValidation(null);
    setParserErrors([]);
    setParserSkipped(0);
    setImportResult(null);
    setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const parseFile = (file: File) => {
    setMessage(null);
    setImportResult(null);
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setMessage({ tone: "error", text: "Choose a CSV file. Other file types are not accepted." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ tone: "error", text: "This file is larger than the 10 MB upload limit." });
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const fields = result.meta.fields?.filter(Boolean) ?? [];
        const completelyEmpty = result.data.filter((row) => Object.values(row).every((value) => !String(value ?? "").trim())).length;
        if (!fields.length || !result.data.length) {
          setMessage({ tone: "error", text: "The CSV has no usable header row or data rows." });
          return;
        }
        setFilename(file.name);
        setFileSize(file.size);
        setHeaders(fields);
        setRows(result.data);
        setMapping(suggestMapping(fields));
        setParserErrors(result.errors.slice(0, 20).map((error) => `Row ${error.row + 1}: ${error.message}`));
        setParserSkipped(completelyEmpty);
        setValidation(null);
      },
      error: (error) => setMessage({ tone: "error", text: `The CSV could not be read: ${error.message}` }),
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const runValidation = () => {
    if (!mappingReady) {
      setMessage({ tone: "error", text: "Map one timestamp field and at least one location field. Each destination field can only be used once." });
      return;
    }
    const result = validateRows(rows, mapping, parserSkipped);
    setValidation(result);
    setMessage(null);
  };

  const importRows = async () => {
    if (!validation?.validRows.length) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await confirmImport({ filename, mapping, rows: validation.validRows });
      setImportResult(result);
      setMessage({ tone: "success", text: `${result.successfulRecords} records were imported successfully.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "The import could not be completed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dataset operations"
        title="Data management"
        description="Parse, map, and validate CSV observations before importing them through the backend API."
      >
        {rows.length > 0 && <Button variant="ghost" onClick={clearFile}><RefreshCw size={16} />Start over</Button>}
      </PageHeader>

      <div className="stepper detailed">
        {steps.map((step, index) => (
          <div key={step}>
            <span className={index + 1 <= currentStep ? "active" : ""}>
              <b>{index + 1 < currentStep ? <Check size={12} /> : index + 1}</b>
              {step}
            </span>
            {index < steps.length - 1 && <i className={index + 1 < currentStep ? "complete" : ""} />}
          </div>
        ))}
      </div>

      {message && (
        <div className={`import-message ${message.tone}`}>
          {message.tone === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{message.text}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage(null)}><X size={15} /></button>
        </div>
      )}

      {!rows.length ? (
        <Card>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => event.target.files?.[0] && parseFile(event.target.files[0])}
          />
          <div
            className={`upload-zone ${dragging ? "is-dragging" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
            onDrop={handleDrop}
          >
            <span><UploadCloud size={28} /></span>
            <h2>Upload air-quality observations</h2>
            <p>Drag and drop a CSV file here, or choose a file from your device.</p>
            <Button onClick={() => inputRef.current?.click()}><FileUp size={16} />Choose CSV file</Button>
            <small>CSV only · Maximum 10 MB · Files are parsed locally before import</small>
          </div>
        </Card>
      ) : (
        <>
          <Card className="file-summary">
            <div className="selected-file">
              <span><FileSpreadsheet size={21} /></span>
              <div><strong>{filename}</strong><small>{(fileSize / 1024).toFixed(1)} KB · {rows.length.toLocaleString()} rows · {headers.length} columns</small></div>
              <Button variant="ghost" onClick={() => inputRef.current?.click()}><FileUp size={15} />Replace</Button>
              <input ref={inputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && parseFile(event.target.files[0])} />
            </div>
          </Card>

          <Card title="Map source columns" subtitle="Automatic suggestions can be changed before validation">
            <div className="mapping-grid">
              {headers.map((header) => (
                <div className="mapping-row" key={header}>
                  <code>{header}</code><span>→</span>
                  <Select
                    aria-label={`Map ${header}`}
                    value={mapping[header] ?? ""}
                    onChange={(event) => {
                      setMapping((current) => ({ ...current, [header]: event.target.value }));
                      setValidation(null);
                    }}
                  >
                    <option value="">Ignore column</option>
                    {supportedFields.map((field) => <option key={field} value={field}>{field}</option>)}
                  </Select>
                </div>
              ))}
            </div>
            <div className="mapping-status">
              <span className={hasTimestamp ? "valid" : "invalid"}>{hasTimestamp ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}Timestamp mapped</span>
              <span className={hasLocation ? "valid" : "invalid"}>{hasLocation ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}Location mapped</span>
              {unrecognized.length > 0 && <span className="warning"><AlertCircle size={14} />{unrecognized.length} ignored column{unrecognized.length === 1 ? "" : "s"}</span>}
              {duplicateMappings.length > 0 && <span className="invalid"><AlertCircle size={14} />Duplicate destination mappings</span>}
            </div>
          </Card>

          <Card title="Data preview" subtitle={`First ${Math.min(20, rows.length)} of ${rows.length.toLocaleString()} parsed rows`}>
            <div className="csv-preview">
              <table>
                <thead><tr><th>#</th>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>
                  {rows.slice(0, 20).map((row, index) => (
                    <tr key={index}><td>{index + 1}</td>{headers.map((header) => <td key={header}>{row[header] || <span className="null-value">empty</span>}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {parserErrors.length > 0 && (
            <Card title="CSV parsing warnings" subtitle={`${parserErrors.length} issue${parserErrors.length === 1 ? "" : "s"} shown`}>
              <ul className="issue-list">{parserErrors.map((error) => <li key={error}><AlertCircle size={14} />{error}</li>)}</ul>
            </Card>
          )}

          {validation && <ValidationSummary result={validation} totalRows={rows.length} />}

          <div className="import-actions">
            <div>
              <strong>{validation ? `${validation.validRows.length} rows ready for import` : "Validate before importing"}</strong>
              <span>MongoDB is contacted only when you confirm the import.</span>
            </div>
            {!validation ? (
              <Button variant="primary" onClick={runValidation} disabled={!mappingReady}><FileCheck2 size={16} />Validate {rows.length.toLocaleString()} rows</Button>
            ) : (
              <Button variant="primary" onClick={importRows} disabled={loading || !validation.validRows.length || Boolean(importResult)}>
                {loading ? <LoaderCircle className="spin" size={16} /> : <UploadCloud size={16} />}
                {loading ? "Importing…" : importResult ? "Import complete" : `Import ${validation.validRows.length} valid rows`}
              </Button>
            )}
          </div>
        </>
      )}

      {!rows.length && (
        <div className="two-col">
          <Card title="Supported fields" subtitle="Map your source columns after upload">
            <div className="field-cloud">{supportedFields.map((field) => <code key={field}>{field}</code>)}</div>
          </Card>
          <Card title="Validation checks" subtitle="No rows are silently discarded">
            <ul className="check-list">{["Date and location requirements", "Numeric and negative values", "Missing and unrecognized fields", "Duplicate observation detection"].map((item) => <li key={item}><FileCheck2 size={16} />{item}</li>)}</ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function ValidationSummary({ result, totalRows }: { result: ValidationResult; totalRows: number }) {
  const invalidCount = result.issues.length;
  const cards = [
    { label: "Rows processed", value: totalRows, tone: "" },
    { label: "Valid", value: result.validRows.length, tone: "good" },
    { label: "Invalid", value: invalidCount, tone: invalidCount ? "bad" : "good" },
    { label: "Duplicates", value: result.duplicateCount, tone: result.duplicateCount ? "warn" : "" },
    { label: "Skipped", value: result.skippedCount, tone: "" },
  ];
  return (
    <Card title="Validation summary" subtitle={`${result.missingValueCount} empty mapped values detected`}>
      <div className="validation-stats">
        {cards.map((item) => <div key={item.label} className={item.tone}><span>{item.label}</span><strong>{item.value.toLocaleString()}</strong></div>)}
      </div>
      {result.issues.length > 0 ? (
        <div className="validation-issues">
          <strong>Rows requiring attention</strong>
          <div className="issue-scroll">
            {result.issues.slice(0, 50).map((issue) => <div key={issue.row}><span>Row {issue.row}</span><p>{issue.messages.join(" · ")}</p></div>)}
          </div>
          {result.issues.length > 50 && <small>Showing the first 50 of {result.issues.length} invalid rows.</small>}
        </div>
      ) : (
        <div className="all-valid"><CheckCircle2 size={17} />All parsed rows passed validation.</div>
      )}
    </Card>
  );
}

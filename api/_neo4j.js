import neo4j from "neo4j-driver";
import fs from "node:fs";
import path from "node:path";

function getEnvConfig() {
  const config = {
    uri: process.env.NEO4J_URI || "",
    username: process.env.NEO4J_USERNAME || process.env.Username || "",
    password: process.env.NEO4J_PASSWORD || process.env.Password || "",
    database: process.env.NEO4J_DATABASE || "",
  };

  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [k, ...vParts] = trimmed.split("=");
        const v = vParts.join("=").trim();
        if (k === "NEO4J_URI") config.uri = v;
        if (k === "NEO4J_USERNAME" || k === "Username") config.username = v;
        if (k === "NEO4J_PASSWORD" || k === "Password") config.password = v;
        if (k === "NEO4J_DATABASE") config.database = v;
      }
    }
  } catch {}

  if (!config.uri && config.username) {
    config.uri = `neo4j+s://${config.username}.databases.neo4j.io`;
  }

  return config;
}

let driverInstance = null;

export function getNeo4jDriver() {
  if (!driverInstance) {
    const config = getEnvConfig();
    if (!config.uri || !config.username || !config.password) {
      throw new Error(
        "Neo4j credentials are not configured. Please define NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env"
      );
    }

    driverInstance = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      {
        maxConnectionPoolSize: 50,
        connectionTimeout: 15000,
        maxTransactionRetryTime: 30000,
      }
    );
  }
  return driverInstance;
}

/**
 * Converts Neo4j Integer and complex objects to standard JavaScript primitives.
 */
export function toNative(val) {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) {
    return val.inSafeRange() ? val.toNumber() : val.toString();
  }
  if (Array.isArray(val)) {
    return val.map(toNative);
  }
  if (typeof val === "object") {
    if (val.properties) {
      return toNative(val.properties);
    }
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = toNative(v);
    }
    return res;
  }
  return val;
}

/**
 * Prepares parameters for Cypher, converting integer numbers to neo4j.int
 */
export function prepareParams(params = {}) {
  const prepared = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "number" && Number.isInteger(v)) {
      prepared[k] = neo4j.int(v);
    } else if (v && typeof v === "object" && !Array.isArray(v) && !neo4j.isInt(v)) {
      prepared[k] = prepareParams(v);
    } else {
      prepared[k] = v;
    }
  }
  return prepared;
}

/**
 * Execute a Cypher query with automatic session lifecycle management.
 */
export async function runCypher(query, params = {}) {
  const config = getEnvConfig();
  const driver = getNeo4jDriver();
  const sessionConfig = {};
  if (config.database && config.database !== "neo4j") {
    sessionConfig.database = config.database;
  }

  const session = driver.session(sessionConfig);
  try {
    const safeParams = prepareParams(params);
    const result = await session.run(query, safeParams);
    return result.records.map((record) => {
      const obj = {};
      record.keys.forEach((key) => {
        obj[key] = toNative(record.get(key));
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

export { neo4j };

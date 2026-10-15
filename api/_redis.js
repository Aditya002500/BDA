import Redis from "ioredis";
import fs from "node:fs";
import path from "node:path";

function getRedisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/REDIS_URL=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}
  return "";
}

let redisClient = null;

export function getRedis() {
  if (!redisClient) {
    const url = getRedisUrl();
    if (!url) {
      throw new Error("REDIS_URL is not configured. Please set the REDIS_URL environment variable.");
    }
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });
    redisClient.on("error", (err) => {
      console.error("[Redis Error]", err.message);
    });
  }
  return redisClient;
}

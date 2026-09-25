import dotenv from "dotenv";

dotenv.config();

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

const r2Endpoint =
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined);

if (!r2Endpoint && process.env.NODE_ENV !== "test") {
  throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID must be set in environment");
}

const r2AccessKey = process.env.R2_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY;

if (!r2AccessKey && !r2SecretKey && process.env.NODE_ENV !== "test") {
  throw new Error(
    "R2_ACCESS_KEY (or R2_ACCESS_KEY_ID) and R2_SECRET_KEY (or R2_SECRET_ACCESS_KEY) must be set",
  );
}

export const config = {
  port: num("PORT", 4000),
  mongoUri:
    process.env.MONGO_URI ||
    process.env.LOCAL_MONGO_DB_URI ||
    "mongodb://127.0.0.1:27017/marion_store",
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  bcryptRounds: num("BCRYPT_ROUNDS", 10),
  allowRegistration: process.env.ALLOW_REGISTRATION === "true",
  corsOrigin,
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "http://localhost:4000").replace(
    /\/+$/,
    "",
  ),
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  rateLimitGeneral: num("RATE_LIMIT_GENERAL", 300),
  rateLimitAuth: num("RATE_LIMIT_AUTH", 10),
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || null,
  R2_ACCESS_KEY: r2AccessKey || "",
  R2_SECRET_KEY: r2SecretKey || "",
  R2_BUCKET: process.env.R2_BUCKET || "",
  R2_ENDPOINT: r2Endpoint || "",
  R2_REGION: process.env.R2_REGION || "auto",
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL || "",
  R2_KEY_PREFIX: process.env.R2_KEY_PREFIX || "",
  R2_SIGNED_URL_TTL: num("R2_SIGNED_URL_TTL", 3600),
} as const;

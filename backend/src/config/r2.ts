import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.js";

let client: S3Client | null = null;

export function getR2(): S3Client {
  if (!client) {
    client = new S3Client({
      region: config.R2_REGION,
      endpoint: config.R2_ENDPOINT,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY,
        secretAccessKey: config.R2_SECRET_KEY,
      },
      forcePathStyle: false,
    });
  }
  return client;
}

export function buildObjectKey(relative: string): string {
  const prefix = config.R2_KEY_PREFIX?.replace(/^\/+|\/+$/g, "");
  const clean = relative.replace(/^\/+/, "");
  return prefix ? `${prefix}/${clean}` : clean;
}

export function publicUrlFor(key: string): string {
  const base = config.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

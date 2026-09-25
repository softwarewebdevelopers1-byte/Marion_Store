import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { getR2, buildObjectKey, publicUrlFor } from "../config/r2.js";
import { config } from "../config.js";
import AppError from "../appError.js";

export interface StoredImage {
  key: string;
  url: string;
  mimeType: string;
  size: number;
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 8;

export async function uploadImage(
  file: Express.Multer.File,
  opts: { sellerId: string; productId: string },
): Promise<StoredImage> {
  if (!ALLOWED_MIME[file.mimetype]) {
    throw new AppError(
      415,
      "Unsupported image type. Use JPEG, PNG or WebP.",
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }
  if (file.size > MAX_BYTES) {
    throw new AppError(413, "Image exceeds the 5 MB limit.", "PAYLOAD_TOO_LARGE");
  }

  const ext = ALLOWED_MIME[file.mimetype];
  const relative = `sellers/${opts.sellerId}/products/${opts.productId}/${randomUUID()}.${ext}`;
  const key = buildObjectKey(relative);

  try {
    await getR2().send(
      new PutObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (err) {
    throw new AppError(
      502,
      `Failed to upload image to storage: ${(err as Error).message}`,
      "STORAGE_UPLOAD_FAILED",
    );
  }

  return {
    key,
    url: await resolveReadUrl(key),
    mimeType: file.mimetype,
    size: file.size,
  };
}

export async function deleteImage(key: string): Promise<void> {
  if (!key) return;
  try {
    await getR2().send(
      new DeleteObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
      }),
    );
  } catch (err) {
    const e = err as {
      name?: string;
      message?: string;
      $metadata?: { httpStatusCode?: number };
    };
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return;
    throw new AppError(
      502,
      `Failed to delete image from storage: ${e.message}`,
      "STORAGE_DELETE_FAILED",
    );
  }
}

export async function deleteImages(keys: string[]): Promise<void> {
  const valid = keys.filter((k) => Boolean(k));
  if (valid.length === 0) return;

  for (let i = 0; i < valid.length; i += 1000) {
    const chunk = valid.slice(i, i + 1000);
    try {
      await getR2().send(
        new DeleteObjectsCommand({
          Bucket: config.R2_BUCKET,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
    } catch (err) {
      throw new AppError(
        502,
        `Failed to batch-delete images: ${(err as Error).message}`,
        "STORAGE_DELETE_FAILED",
      );
    }
  }
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getR2().send(
      new HeadObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (err) {
    const e = err as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

export async function listAllObjects(prefix?: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await getR2().send(
      new ListObjectsV2Command({
        Bucket: config.R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

export async function resolveReadUrl(key: string): Promise<string> {
  if (config.R2_PUBLIC_BASE_URL) return publicUrlFor(key);
  return getSignedUrl(
    getR2(),
    new GetObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
    }),
    { expiresIn: config.R2_SIGNED_URL_TTL },
  );
}

export const imageConstraints = {
  MAX_BYTES,
  MAX_FILES,
  ALLOWED_MIME,
};

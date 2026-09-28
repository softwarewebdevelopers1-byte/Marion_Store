export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MAX_COUNT = 8;

export type ImageRejection = { name: string; reason: string };

/**
 * Validates a drop/pick against the same rules the backend enforces
 * (JPEG/PNG/WebP, <= 5 MB) so the seller is told before the bytes are sent.
 */
export function partitionImageFiles(
  files: Iterable<File>,
  remaining: number,
): { accepted: File[]; rejected: ImageRejection[] } {
  const accepted: File[] = [];
  const rejected: ImageRejection[] = [];
  let slots = Number.isFinite(remaining) ? Math.max(0, remaining) : Infinity;

  for (const file of files) {
    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
      rejected.push({
        name: file.name,
        reason: "unsupported type — use JPEG, PNG or WebP",
      });
      continue;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      rejected.push({
        name: file.name,
        reason: `too large (${(file.size / (1024 * 1024)).toFixed(1)} MB, max 5 MB)`,
      });
      continue;
    }
    if (slots <= 0) {
      rejected.push({
        name: file.name,
        reason: `limit reached — max ${IMAGE_MAX_COUNT} images`,
      });
      continue;
    }
    slots -= 1;
    accepted.push(file);
  }

  return { accepted, rejected };
}

export function describeRejections(rejected: ImageRejection[]): string {
  if (rejected.length === 0) return "";
  const [first, ...rest] = rejected;
  const lead = first ? `${first.name}: ${first.reason}` : "File rejected";
  return rest.length > 0
    ? `${lead} (+${rest.length} more rejected)`
    : lead;
}

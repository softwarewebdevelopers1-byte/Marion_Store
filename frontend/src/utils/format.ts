import { storeConfig } from "../config/store";

export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  return `${storeConfig.currency} ${rounded.toLocaleString("en-KE")}`;
}

export function timeGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Ensure a slug is unique given a list of existing slugs. */
export function uniqueSlug(base: string, existing: string[]): string {
  const root = slugify(base) || "product";
  if (!existing.includes(root)) return root;
  let i = 2;
  while (existing.includes(`${root}-${i}`)) i++;
  return `${root}-${i}`;
}

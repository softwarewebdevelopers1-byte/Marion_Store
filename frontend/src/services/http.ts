import { storeConfig } from "../config/store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class HttpError extends Error {
  status: number;
  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.status = status;
  }
}

/**
 * Native fetch wrapper — no Axios.
 * Currently unused because the UI runs on mockService, but this is the
 * single place where real HTTP traffic will live once the backend exists.
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  void storeConfig; // ensure config is loaded (may influence headers later)
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    throw new HttpError(
      res.status,
      `Request failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<T>;
}

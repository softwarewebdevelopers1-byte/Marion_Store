const env = import.meta.env;

interface StoreConfig {
  name: string;
  sellerName: string;
  whatsappNumber: string;
  description: string;
  logo: string;
  currency: string;
  country: string;
  supportHours: string;
  themeColor?: string;
  banner?: string;
  slug?: string;
  tagline?: string;
}

const defaults: StoreConfig = {
  name: env.VITE_STORE_NAME || "Marion Store",
  sellerName: env.VITE_SELLER_NAME || "Jane",
  whatsappNumber: (env.VITE_SELLER_WHATSAPP || "254743689883").replace(
    /\D/g,
    "",
  ),
  description:
    "Curated everyday essentials — shoes, tech, fashion and home — delivered across Kenya.",
  logo: "/favicon.svg",
  currency: "KES",
  country: "Kenya",
  supportHours: "Mon–Sat, 8am–8pm",
};

export const storeConfig: StoreConfig = { ...defaults };

export type StoreConfigType = StoreConfig;

const STORAGE_KEY = "mp.storeConfig";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ApiStoreConfig {
  slug?: string;
  name?: string;
  sellerName?: string;
  tagline?: string;
  description?: string;
  logo?: string;
  banner?: string;
  themeColor?: string;
  currency?: string;
  supportHours?: string;
  whatsappNumber?: string;
}

export async function fetchStoreConfig(): Promise<void> {
  if (import.meta.env.VITE_USE_REAL_API !== "true") return;

  try {
    // Check cache
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached) as {
        ts: number;
        data: ApiStoreConfig;
      };
      if (Date.now() - ts < TTL_MS) {
        applyStoreConfig(data);
        return;
      }
    }

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/store`);
    if (!res.ok) return;
    const data: ApiStoreConfig = await res.json();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ts: Date.now(), data }),
    );
    applyStoreConfig(data);

    window.dispatchEvent(
      new CustomEvent("storeConfig:updated", { detail: data }),
    );
  } catch {
    // Silently keep env defaults on any failure
  }
}

function applyStoreConfig(data: ApiStoreConfig): void {
  if (data.name) storeConfig.name = data.name;
  if (data.sellerName) storeConfig.sellerName = data.sellerName;
  if (data.whatsappNumber)
    storeConfig.whatsappNumber = data.whatsappNumber.replace(/\D/g, "");
  if (data.description) storeConfig.description = data.description;
  if (data.logo) storeConfig.logo = data.logo;
  if (data.currency) storeConfig.currency = data.currency;
  if (data.supportHours) storeConfig.supportHours = data.supportHours;
  if (data.themeColor) storeConfig.themeColor = data.themeColor;
  if (data.banner) storeConfig.banner = data.banner;
  if (data.slug) storeConfig.slug = data.slug;
  if (data.tagline) storeConfig.tagline = data.tagline;
}

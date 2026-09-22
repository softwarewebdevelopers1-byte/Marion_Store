const env = import.meta.env;

export const storeConfig = {
  name: env.VITE_STORE_NAME || "Kesi Store",
  sellerName: env.VITE_SELLER_NAME || "Jane",
  /** International format, no +, no spaces. Used for wa.me links. */
  whatsappNumber: (env.VITE_SELLER_WHATSAPP || "254712345678").replace(
    /\D/g,
    "",
  ),
  description:
    "Curated everyday essentials — shoes, tech, fashion and home — delivered across Kenya.",
  logo: "/favicon.svg",
  currency: "KES",
  country: "Kenya",
  supportHours: "Mon–Sat, 8am–8pm",
} as const;

export type StoreConfig = typeof storeConfig;

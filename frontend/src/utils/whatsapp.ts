import { storeConfig } from "../config/store";
import { formatPrice, timeGreeting } from "./format";
import type { Product } from "../types";

/**
 * Build a wa.me link with a dynamically generated, time-aware message.
 * Works on Android, iOS, desktop web, and WhatsApp Web.
 */
export function buildWhatsAppLink(product?: Product): string {
  const greeting = timeGreeting();
  const seller = storeConfig.sellerName;
  const lines: string[] = [];

  if (product) {
    lines.push(
      `${greeting} ${seller}, I am interested in this product: ${product.name}.`,
    );
    if (product.description) {
      lines.push("", product.description);
    }
    lines.push("", `Price: ${formatPrice(product.price)}`);
    lines.push(
      product.stockQuantity > 0
        ? `Availability: ${product.stockQuantity} available`
        : "Availability: Out of stock — please let me know when it returns",
    );
  } else {
    lines.push(
      `${greeting} ${seller}, I would like to make an inquiry about your store.`,
    );
  }

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${text}`;
}

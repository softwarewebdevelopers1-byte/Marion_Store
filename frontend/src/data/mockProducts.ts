import type { Product } from "../types";
import { slugify } from "../utils/format";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

interface Seed {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: Product["category"];
  stockQuantity: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  unitsSold?: number;
  images: string[];
}

const seeds: Seed[] = [
  {
    name: "Nike Air Max 270",
    description:
      "Comfortable running shoes with a lightweight breathable upper and responsive Air cushioning.",
    price: 8500,
    compareAtPrice: 9900,
    category: "Shoes",
    stockQuantity: 12,
    lowStockThreshold: 5,
    isFeatured: true,
    unitsSold: 34,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=80",
    ],
  },
  {
    name: "Adidas Superstar Classic",
    description:
      "Timeless leather sneakers with the iconic shell toe. A wardrobe staple for every season.",
    price: 6000,
    category: "Shoes",
    stockQuantity: 3,
    lowStockThreshold: 5,
    isFeatured: true,
    unitsSold: 21,
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&q=80",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=900&q=80",
    ],
  },
  {
    name: "Premium Cotton Hoodie",
    description:
      "Heavyweight 400gsm cotton hoodie with a soft brushed interior. Unisex fit, true to size.",
    price: 2500,
    category: "Fashion",
    stockQuantity: 0,
    lowStockThreshold: 4,
    unitsSold: 48,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80",
    ],
  },
  {
    name: "Samsung Galaxy Buds 2",
    description:
      "True wireless earbuds with active noise cancellation and up to 29 hours of total playtime.",
    price: 9800,
    compareAtPrice: 11500,
    category: "Electronics",
    stockQuantity: 18,
    lowStockThreshold: 5,
    isFeatured: true,
    unitsSold: 27,
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=80",
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900&q=80",
    ],
  },
  {
    name: "Wireless Bluetooth Speaker",
    description:
      "Portable 20W speaker with deep bass, IPX7 waterproofing and 24-hour battery life.",
    price: 4200,
    category: "Electronics",
    stockQuantity: 0,
    lowStockThreshold: 3,
    unitsSold: 15,
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80",
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=900&q=80",
    ],
  },
  {
    name: "Leather Backpack",
    description:
      'Full-grain leather backpack with a padded 15" laptop sleeve and brass hardware.',
    price: 7200,
    category: "Accessories",
    stockQuantity: 7,
    lowStockThreshold: 3,
    isFeatured: true,
    unitsSold: 19,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=900&q=80",
    ],
  },
  {
    name: "Minimalist Wrist Watch",
    description:
      "Sapphire glass, stainless steel case and genuine leather strap. Water resistant to 50m.",
    price: 5400,
    category: "Accessories",
    stockQuantity: 2,
    lowStockThreshold: 5,
    unitsSold: 9,
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900&q=80",
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&q=80",
    ],
  },
  {
    name: "Ceramic Coffee Mug Set",
    description:
      "Set of four hand-glazed stoneware mugs. Microwave and dishwasher safe.",
    price: 1800,
    category: "Home",
    stockQuantity: 26,
    lowStockThreshold: 6,
    unitsSold: 41,
    images: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&q=80",
    ],
  },
  {
    name: "Scented Soy Candle",
    description:
      "Hand-poured soy candle with a 45-hour burn time. Notes of amber, vanilla and cedar.",
    price: 1200,
    category: "Home",
    stockQuantity: 4,
    lowStockThreshold: 5,
    unitsSold: 33,
    images: [
      "https://images.unsplash.com/photo-1602874801006-e26f3f9c1d0e?w=900&q=80",
    ],
  },
  {
    name: "Vitamin C Face Serum",
    description:
      "Brightening 20% Vitamin C serum with hyaluronic acid. Suitable for all skin types.",
    price: 2200,
    category: "Beauty",
    stockQuantity: 31,
    lowStockThreshold: 8,
    isFeatured: true,
    unitsSold: 56,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=900&q=80",
    ],
  },
  {
    name: "iPhone 15 Silicone Case",
    description:
      "Slim-fit silicone case with a soft microfibre lining and MagSafe compatibility.",
    price: 1500,
    category: "Accessories",
    stockQuantity: 0,
    lowStockThreshold: 5,
    unitsSold: 12,
    images: [
      "https://images.unsplash.com/photo-1601593346740-925612772716?w=900&q=80",
    ],
  },
  {
    name: "Denim Jacket — Vintage Wash",
    description:
      "Classic trucker silhouette in a mid-weight rigid denim. Slightly oversized fit.",
    price: 4800,
    category: "Fashion",
    stockQuantity: 9,
    lowStockThreshold: 4,
    isActive: false, // hidden product demo
    unitsSold: 6,
    images: [
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=900&q=80",
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=900&q=80",
    ],
  },
];

export const mockProducts: Product[] = seeds.map((s, i) => ({
  id: `p_${String(i + 1).padStart(3, "0")}`,
  slug: slugify(s.name),
  name: s.name,
  description: s.description,
  price: s.price,
  compareAtPrice: s.compareAtPrice,
  images: s.images,
  category: s.category,
  stockQuantity: s.stockQuantity,
  lowStockThreshold: s.lowStockThreshold ?? 5,
  isAvailable: s.stockQuantity > 0,
  isFeatured: !!s.isFeatured,
  isActive: s.isActive ?? true,
  createdAt: daysAgo(i * 3 + 1),
  updatedAt: daysAgo(i),
  unitsSold: s.unitsSold ?? 0,
}));

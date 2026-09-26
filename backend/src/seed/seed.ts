import mongoose from "mongoose";
import { SellerModel, hashPassword } from "../models/Seller.js";
import { ProductModel } from "../models/Product.js";
import { OrderModel, CounterModel } from "../models/Order.js";
import { InventoryMovementModel } from "../models/InventoryMovement.js";
import type { Category } from "../types/product.js";
import { logger } from "../logger.js";

const isKeep = process.argv.includes("--keep-seller");

interface ProductDef {
  name: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
}

const productDefs: ProductDef[] = [
  {
    name: "Premium Wireless Headphones",
    description:
      "High-quality noise-cancelling wireless headphones with 30hr battery life.",
    price: 12999,
    images: ["/images/headphones.jpg"],
    category: "Electronics",
    stockQuantity: 25,
    lowStockThreshold: 5,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Stainless Steel Water Bottle",
    description:
      "1L insulated stainless steel water bottle keeps drinks hot or cold for 24 hours.",
    price: 3499,
    images: ["/images/bottle.jpg"],
    category: "Home",
    stockQuantity: 80,
    lowStockThreshold: 10,
    isFeatured: false,
    isActive: true,
  },
  {
    name: "Running Shoes",
    description:
      "Lightweight running shoes with responsive cushioning for daily training.",
    price: 7999,
    images: ["/images/shoes.jpg"],
    category: "Shoes",
    stockQuantity: 12,
    lowStockThreshold: 5,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Leather Wallet",
    description:
      "Handcrafted genuine leather wallet with multiple card slots and RFID protection.",
    price: 2999,
    images: ["/images/wallet.jpg"],
    category: "Accessories",
    stockQuantity: 3,
    lowStockThreshold: 5,
    isFeatured: false,
    isActive: true,
  },
  {
    name: "Sunglasses",
    description: "UV400 protection polarized sunglasses with classic frame.",
    price: 4599,
    images: ["/images/sunglasses.jpg"],
    category: "Accessories",
    stockQuantity: 0,
    lowStockThreshold: 3,
    isFeatured: false,
    isActive: true,
  },
  {
    name: "Smart Watch",
    description:
      "Fitness tracking smart watch with heart rate monitor and 7-day battery.",
    price: 15999,
    images: ["/images/watch.jpg"],
    category: "Electronics",
    stockQuantity: 40,
    lowStockThreshold: 8,
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Perfume Set",
    description:
      "Set of 3 premium perfume bottles with long-lasting fragrance.",
    price: 5999,
    images: ["/images/perfume.jpg"],
    category: "Beauty",
    stockQuantity: 60,
    lowStockThreshold: 10,
    isFeatured: false,
    isActive: false,
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main(): Promise<void> {
  const mongoUri = process.env.LIVE_MONGO_DB_URI
    ? process.env.LIVE_MONGO_DB_URI
    : process.exit(1);

  await mongoose.connect(mongoUri);
  logger.info("Connected to MongoDB for seeding");

  if (!isKeep) {
    await Promise.all([
      SellerModel.deleteMany({}),
      ProductModel.deleteMany({}),
      OrderModel.deleteMany({}),
      InventoryMovementModel.deleteMany({}),
      CounterModel.deleteMany({}),
    ]);
    logger.info("Cleared existing data");
  }

  let seller;
  if (isKeep) {
    seller = await SellerModel.findOne({
      role: "SELLER",
      status: "ACTIVE",
    }).exec();
    if (!seller) {
      throw new Error("No existing active seller found");
    }
  } else {
    const passwordHash = await hashPassword("seller@2026#254");
    seller = await SellerModel.create({
      email: "marionwanga05@gmail.com",
      phone: "254743689883",
      displayName: "Marion",
      role: "SELLER",
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date(),
      store: {
        name: "Marion Store",
        slug: "marion-store",
        tagline: "Your one-stop shop",
        description: "An online store for Marion",
        currency: "KES",
        social: { whatsapp: "254743689883" },
      },
    });
  }

  const sellerId = seller._id;
  logger.info(`Seller ready: ${seller.email} (${sellerId})`);

  for (const def of productDefs) {
    const slug = slugify(def.name);
    await ProductModel.create({
      sellerId,
      slug,
      ...def,
      unitsSold: 0,
      views: 0,
    });
    logger.info(`Created product: ${def.name}`);
  }

  logger.info("Seed complete");
  await mongoose.disconnect();
  logger.info("Disconnected from MongoDB");
}

main().catch((err) => {
  logger.error(err, "Seeding failed");
  process.exit(1);
});

export type InventoryMovementType =
  | "PRODUCT_ADDED"
  | "SALE"
  | "ADJUSTMENT"
  | "DAMAGED"
  | "RESTOCKED";

export const INVENTORY_MOVEMENT_TYPES: InventoryMovementType[] = [
  "PRODUCT_ADDED",
  "SALE",
  "ADJUSTMENT",
  "DAMAGED",
  "RESTOCKED",
];

export interface InventoryMovement {
  id: string;
  productId: string;
  sellerId: string;
  type: InventoryMovementType;
  delta: number;
  before: number;
  after: number;
  reason: string;
  createdAt: string;
}

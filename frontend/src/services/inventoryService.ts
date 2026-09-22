import type { InventoryMovement } from "../types";

/**
 * Inventory movement log — architecture stub.
 * The backend will persist these rows; here they are ephemeral.
 * Endpoint: GET /api/admin/products/{id}/inventory-history
 */
const movements: InventoryMovement[] = [];

export const inventoryService = {
  record(m: Omit<InventoryMovement, "id" | "createdAt">) {
    movements.push({
      ...m,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  },
  async history(productId: string): Promise<InventoryMovement[]> {
    return movements.filter((m) => m.productId === productId);
  },
};

import type { Order, OrderStatus } from "../types";

/**
 * Order service stub. Backend endpoints:
 *   POST   /api/orders
 *   GET    /api/orders/{id}
 *   GET    /api/admin/orders
 *   PATCH  /api/admin/orders/{id}/status
 *
 * The frontend currently does not create real orders (WhatsApp is the
 * checkout path). Sales figures in the dashboard are clearly labelled demo data.
 */
const orders: Order[] = [];

export const orderService = {
  async list(): Promise<Order[]> {
    return [...orders];
  },
  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const o = orders.find((x) => x.id === id);
    if (o) o.orderStatus = status;
  },
};

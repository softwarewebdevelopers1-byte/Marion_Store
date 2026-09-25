export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: { productId: string; quantity: number }[];
}

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "PAID",
  "REFUNDED",
  "FAILED",
];

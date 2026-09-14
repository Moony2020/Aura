import "server-only";

import { z } from "zod";

import type { Order, OrderAddressSnapshot, OrderItemSnapshot, OrderStatus } from "@/domain/order/order.schema";
import { ownershipError, validationError } from "@/lib/errors/aura-error";
import { requireCurrentSessionAuthority } from "@/server/auth/current-session";
import { loadUserSessionAuthority, type SessionAuthority } from "@/server/auth/session-authority";
import { MongoOrderRepository } from "@/server/repositories/mongo-order-inventory-repository";
import type { OrderRepository } from "@/server/repositories/order-inventory-repository";

export type OrderHistoryView = {
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  paymentStatus: Order["paymentStatus"];
  fulfillmentStatus: Order["fulfillmentStatus"];
  items: OrderItemSnapshot[];
  shippingAddress: OrderAddressSnapshot;
  totals: Order["totals"];
};

type OrderHistoryRepositories = { orders: OrderRepository };
const mongoRepositories = (): OrderHistoryRepositories => ({ orders: new MongoOrderRepository() });
const orderIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid order id.");

async function requireFreshActiveAuthority(authority: SessionAuthority | null) {
  if (!authority) throw ownershipError();
  const current = await loadUserSessionAuthority(authority.user.id);
  if (!current || current.credentials.sessionVersion !== authority.credentials.sessionVersion) throw ownershipError();
  return current;
}

function parseOrderId(orderId: unknown) {
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) throw validationError("Invalid order id.");
  return parsed.data;
}

function toHistoryView(order: Order): OrderHistoryView {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    items: order.items,
    shippingAddress: order.shippingAddress,
    totals: order.totals,
  };
}

export async function listOrderHistoryForAuthority(authority: SessionAuthority | null, options: { repositories?: OrderHistoryRepositories } = {}): Promise<OrderHistoryView[]> {
  const current = await requireFreshActiveAuthority(authority);
  const orders = await (options.repositories ?? mongoRepositories()).orders.listForUser(current.user.id);
  return orders.map(toHistoryView);
}

export async function getOrderHistoryDetailForAuthority(authority: SessionAuthority | null, orderId: unknown, options: { repositories?: OrderHistoryRepositories } = {}): Promise<OrderHistoryView> {
  const current = await requireFreshActiveAuthority(authority);
  const id = parseOrderId(orderId);
  const order = await (options.repositories ?? mongoRepositories()).orders.findForUser(current.user.id, id);
  if (!order) throw ownershipError();
  return toHistoryView(order);
}

export async function listCurrentOrderHistory(): Promise<OrderHistoryView[]> {
  return listOrderHistoryForAuthority(await requireCurrentSessionAuthority());
}

export async function getCurrentOrderHistoryDetail(orderId: unknown): Promise<OrderHistoryView> {
  return getOrderHistoryDetailForAuthority(await requireCurrentSessionAuthority(), orderId);
}

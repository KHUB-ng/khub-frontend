import { request } from "./client";
import type { OrderLists, OrderResponse } from "./types";

/**
 * `/api/orders` — escrow-backed purchases.
 *
 * **Creation IS payment**: `POST /orders` debits the wallet into escrow in the
 * same transaction. A short wallet returns 400 with zero rows written, and the
 * client-sent amount is ignored entirely. There is no separate "pay" step, so
 * the UI must always show balance + a confirm step first.
 */

export function create(listingPid: string, quantity = 1): Promise<OrderResponse> {
  return request<OrderResponse>("/api/orders", {
    method: "POST",
    body: { listing_pid: listingPid, quantity },
  });
}

export function list(): Promise<OrderLists> {
  return request<OrderLists>("/api/orders");
}

/** Party-gated: 403 if you are neither buyer nor seller. */
export function get(pid: string): Promise<{ order: OrderResponse; images: string[] }> {
  return request<{ order: OrderResponse; images: string[] }>(`/api/orders/${pid}`);
}

/** Seller only → `delivered`. */
export function markDelivered(pid: string): Promise<unknown> {
  return request<unknown>(`/api/orders/${pid}/deliver`, { method: "POST" });
}

/** Buyer only — releases escrow to the seller. */
export function confirm(pid: string): Promise<unknown> {
  return request<unknown>(`/api/orders/${pid}/confirm`, { method: "POST" });
}

/** Buyer only, pre-delivery — refunds atomically. */
export function cancel(pid: string): Promise<unknown> {
  return request<unknown>(`/api/orders/${pid}/cancel`, { method: "POST" });
}

/** Either party — freezes escrow until an admin resolves. */
export function dispute(pid: string): Promise<unknown> {
  return request<unknown>(`/api/orders/${pid}/dispute`, { method: "POST" });
}

/** Buyer, completed orders only, one per order (second → 400). */
export function review(
  pid: string,
  rating: number,
  comment?: string,
): Promise<unknown> {
  return request<unknown>(`/api/orders/${pid}/review`, {
    method: "POST",
    body: { rating, comment },
  });
}

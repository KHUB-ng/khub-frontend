import { request } from "./client";
import type {
  DeliveryResponse,
  Estimate,
  GeoPoint,
  PublicTracker,
  SizeClass,
} from "./types";

/**
 * `/api/deliveries` — requester side (agent side lives in `agent.ts`).
 *
 * **Creation IS payment**: the fee is held via an EscrowLock debit and the
 * escrow row attaches when an agent accepts. Returns `tracking_code`
 * (10-char base32) — human-shareable, no auth needed on the public tracker.
 */

export interface DeliveryRequestInput {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  size_class: SizeClass;
}

/** Estimate == charged; the same math runs on both paths. */
export function estimate(input: DeliveryRequestInput): Promise<Estimate> {
  return request<Estimate>("/api/deliveries/estimate", { method: "POST", body: input });
}

export function requestDelivery(input: DeliveryRequestInput): Promise<DeliveryResponse> {
  return request<DeliveryResponse>("/api/deliveries", { method: "POST", body: input });
}

export function mine(): Promise<DeliveryResponse[]> {
  return request<DeliveryResponse[]>("/api/deliveries/mine");
}

/** Party-gated. */
export function get(pid: string): Promise<DeliveryResponse> {
  return request<DeliveryResponse>(`/api/deliveries/${pid}`);
}

/** Pre-pickup only → refund (compensating credit or escrow refund). */
export function cancel(pid: string): Promise<unknown> {
  return request<unknown>(`/api/deliveries/${pid}/cancel`, { method: "POST" });
}

/** accepted/picked_up/in_transit → frozen for admin. */
export function dispute(pid: string): Promise<unknown> {
  return request<unknown>(`/api/deliveries/${pid}/dispute`, { method: "POST" });
}

/** On a `delivered` parcel, once per party per trip. */
export function rate(pid: string, rating: number, comment?: string): Promise<unknown> {
  return request<unknown>(`/api/deliveries/${pid}/rate`, {
    method: "POST",
    body: { rating, comment },
  });
}

/**
 * PUBLIC tracker — no auth. Returns status/timing only: no names, pids,
 * coordinates or labels (byte-level asserted by a backend test).
 * Lookup is case-insensitive; unknown code → 404.
 */
export function publicTracker(code: string): Promise<PublicTracker> {
  return request<PublicTracker>(`/api/deliveries/public/${encodeURIComponent(code)}`, {
    auth: false,
  });
}

import { request } from "./client";
import type { Estimate, GeoPoint, RideResponse } from "./types";

/**
 * `/api/rides` — passenger side (driver side lives in `driver.ts`).
 *
 * **Creation IS payment**: `POST /` debits + escrows the fare in one
 * transaction and IGNORES any fare the client sends. 400 on bad coords,
 * out-of-range pickup, or a short wallet.
 *
 * `GET /{pid}/track` is a WebSocket but accepts the token via header only,
 * so it cannot be opened from a browser — see `ws.ts`.
 */

export interface RideRequestInput {
  pickup: GeoPoint;
  dest: GeoPoint;
}

/** No writes; fare = base + per-km × ceil(haversine), rates from config. */
export function estimate(input: RideRequestInput): Promise<Estimate> {
  return request<Estimate>("/api/rides/estimate", { method: "POST", body: input });
}

export function requestRide(input: RideRequestInput): Promise<RideResponse> {
  return request<RideResponse>("/api/rides", { method: "POST", body: input });
}

export function mine(): Promise<RideResponse[]> {
  return request<RideResponse[]>("/api/rides/mine");
}

/** Party-gated. */
export function get(pid: string): Promise<RideResponse> {
  return request<RideResponse>(`/api/rides/${pid}`);
}

/** Pre-start only → instant refund. */
export function cancel(pid: string): Promise<unknown> {
  return request<unknown>(`/api/rides/${pid}/cancel`, { method: "POST" });
}

/** Freezes the fare for admin resolve. */
export function dispute(pid: string): Promise<unknown> {
  return request<unknown>(`/api/rides/${pid}/dispute`, { method: "POST" });
}

/** Completed ride, once per party per trip, counterparty only. */
export function rate(pid: string, rating: number, comment?: string): Promise<unknown> {
  return request<unknown>(`/api/rides/${pid}/rate`, {
    method: "POST",
    body: { rating, comment },
  });
}

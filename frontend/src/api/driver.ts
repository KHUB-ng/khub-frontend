import { request } from "./client";
import type { DriverResponse, Earnings, RatingAggregate, RideResponse } from "./types";

/**
 * `/api/driver` — 11 routes.
 *
 * Everything except `apply` requires `require_driveable` = Role::Driver + KYC
 * verified + admin-verified profile. The full onboarding chain is:
 *   apply → submit KYC → admin approves KYC → admin verifies driver.
 *
 * `GET /socket` accepts the token via header only → cannot be opened from a
 * browser; drivers must poll `requests` until a `?token=` fallback exists.
 */

export interface ApplyInput {
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
}

export function apply(input: ApplyInput): Promise<DriverResponse> {
  return request<DriverResponse>("/api/driver/apply", { method: "POST", body: input });
}

/** 404 when the caller has no driver profile. */
export function me(): Promise<DriverResponse> {
  return request<DriverResponse>("/api/driver/me");
}

/**
 * Open board, limit 50. With `near_*` params only pickups within `r_km`,
 * nearest first. The REST board is authoritative — the WS `new_request`
 * push is best-effort latency only, so poll this regardless.
 */
export function requests(near?: {
  near_lat?: number;
  near_lng?: number;
  r_km?: number;
}): Promise<RideResponse[]> {
  return request<RideResponse[]>("/api/driver/requests", { query: near });
}

export function rides(): Promise<RideResponse[]> {
  return request<RideResponse[]>("/api/driver/rides");
}

/** Σ escrow_release credits attributed to rides via the escrows join. */
export function earnings(): Promise<Earnings> {
  return request<Earnings>("/api/driver/earnings");
}

/** PUBLIC aggregate — no auth. */
export function rating(profilePid: string): Promise<RatingAggregate> {
  return request<RatingAggregate>(`/api/driver/${profilePid}/rating`, { auth: false });
}

/** First-wins under BEGIN IMMEDIATE — the loser gets 400. */
export function accept(ridePid: string): Promise<unknown> {
  return request<unknown>(`/api/driver/rides/${ridePid}/accept`, { method: "POST" });
}

export function arriving(ridePid: string): Promise<unknown> {
  return request<unknown>(`/api/driver/rides/${ridePid}/arriving`, { method: "POST" });
}

export function start(ridePid: string): Promise<unknown> {
  return request<unknown>(`/api/driver/rides/${ridePid}/start`, { method: "POST" });
}

/** Releases the fare to the wallet AND fires the passenger's referral reward
 *  inside the same transaction. */
export function complete(ridePid: string): Promise<unknown> {
  return request<unknown>(`/api/driver/rides/${ridePid}/complete`, { method: "POST" });
}

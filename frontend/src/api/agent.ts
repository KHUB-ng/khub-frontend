import { request } from "./client";
import type { DeliveryResponse, Earnings, RatingAggregate } from "./types";

/**
 * `/api/agent` — mirror of the driver surface.
 * Gate: Role::LogisticsAgent + KYC + admin-verified profile.
 *
 * `GET /socket` is header-only auth → not browser-reachable; poll `requests`.
 */

export interface ApplyInput {
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
}

export function apply(input: ApplyInput): Promise<unknown> {
  return request<unknown>("/api/agent/apply", { method: "POST", body: input });
}

export function me(): Promise<unknown> {
  return request<unknown>("/api/agent/me");
}

export function requests(near?: {
  near_lat?: number;
  near_lng?: number;
  r_km?: number;
}): Promise<DeliveryResponse[]> {
  return request<DeliveryResponse[]>("/api/agent/requests", { query: near });
}

export function deliveries(): Promise<DeliveryResponse[]> {
  return request<DeliveryResponse[]>("/api/agent/deliveries");
}

/** Source is `deliveries` (G6). */
export function earnings(): Promise<Earnings> {
  return request<Earnings>("/api/agent/earnings");
}

/** PUBLIC aggregate — no auth. */
export function rating(profilePid: string): Promise<RatingAggregate> {
  return request<RatingAggregate>(`/api/agent/${profilePid}/rating`, { auth: false });
}

/** First-wins; the loser gets 400. */
export function accept(pid: string): Promise<unknown> {
  return request<unknown>(`/api/agent/deliveries/${pid}/accept`, { method: "POST" });
}

export function pickup(pid: string): Promise<unknown> {
  return request<unknown>(`/api/agent/deliveries/${pid}/pickup`, { method: "POST" });
}

export function transit(pid: string): Promise<unknown> {
  return request<unknown>(`/api/agent/deliveries/${pid}/transit`, { method: "POST" });
}

/** Releases the fee to the agent wallet + the requester's referral reward,
 *  both inside the same transaction. */
export function complete(pid: string): Promise<unknown> {
  return request<unknown>(`/api/agent/deliveries/${pid}/complete`, { method: "POST" });
}

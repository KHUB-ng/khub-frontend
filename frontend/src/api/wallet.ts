import { request } from "./client";
import { keysetQuery } from "./pagination";
import type {
  Bank,
  FundIntent,
  KeysetQuery,
  LedgerEntry,
  Wallet,
  WithdrawalResponse,
} from "./types";

/**
 * `/api/wallet` — 8 routes, all JWT, every mutation idempotent at the DB.
 *
 * POST /fund returns `link`: open it for Flutterwave hosted checkout, then
 * poll GET /fund/{pid}. The webhook is the primary path but this polling
 * endpoint is its documented twin.
 */

export function get(): Promise<Wallet> {
  return request<Wallet>("/api/wallet");
}

/** Keyset history, newest first — NOT the `Page` envelope. */
export function entries(q: KeysetQuery = {}): Promise<LedgerEntry[]> {
  return request<LedgerEntry[]>("/api/wallet/entries", { query: keysetQuery(q) });
}

/** Amount is a naira string (`"1500.00"`), never a number. 503 if unconfigured. */
export function fund(amount: string): Promise<FundIntent> {
  return request<FundIntent>("/api/wallet/fund", { method: "POST", body: { amount } });
}

/** Owner-only (403). On `pending` the server re-verifies with Flutterwave. */
export function getFundIntent(pid: string): Promise<FundIntent> {
  return request<FundIntent>(`/api/wallet/fund/${pid}`);
}

/** Requires KYC verified; whole naira only. Funds held until admin approves. */
export function withdraw(input: {
  bank_code: string;
  account_number: string;
  amount: string;
}): Promise<WithdrawalResponse> {
  return request<WithdrawalResponse>("/api/wallet/withdraw", {
    method: "POST",
    body: input,
  });
}

export function withdrawals(): Promise<WithdrawalResponse[]> {
  return request<WithdrawalResponse[]>("/api/wallet/withdrawals");
}

/** Recipient must exist AND be email-verified (else 404); no self-transfer. */
export function transfer(email: string, amount: string): Promise<unknown> {
  return request<unknown>("/api/wallet/transfer", {
    method: "POST",
    body: { email, amount },
  });
}

/** Flutterwave bank list, cached 24 h server-side. */
export function banks(): Promise<Bank[]> {
  return request<Bank[]>("/api/wallet/banks");
}

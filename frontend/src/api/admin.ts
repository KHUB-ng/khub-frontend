import { request } from "./client";
import { keysetQuery } from "./pagination";
import type {
  AdminAuditRow,
  DailyStats,
  DriverResponse,
  KeysetQuery,
  MonitorSnapshot,
  Pid,
  Role,
  WalletWithIntegrity,
} from "./types";

/**
 * `/api/admin` — 30 routes. EVERY one requires `Role::Admin`.
 *
 * Powers are split: reading (users, kyc, audit, escrows, wallets, stats,
 * monitor) is plain Admin, but role changes and block/unblock are
 * SUPERADMIN-ONLY — the superadmin's own account is locked against both.
 * Exactly one superadmin row exists, granted via the CLI task.
 *
 * `GET /heartbeat` is the role canary: use it to decide whether to render
 * the admin shell at all.
 */

export function heartbeat(): Promise<unknown> {
  return request<unknown>("/api/admin/heartbeat");
}

// ── Withdrawals ─────────────────────────────────────────────────────────────

export function withdrawals(status = "requested") {
  return request<unknown[]>("/api/admin/withdrawals", { query: { status } });
}

/** Calls Flutterwave transfer. Double-approve → 400; 502 gateway; 503
 *  unconfigured (fail-closed). */
export function approveWithdrawal(pid: string): Promise<unknown> {
  return request<unknown>(`/api/admin/withdrawals/${pid}/approve`, { method: "POST" });
}

/** Funds return instantly. */
export function rejectWithdrawal(pid: string, note?: string): Promise<unknown> {
  return request<unknown>(`/api/admin/withdrawals/${pid}/reject`, {
    method: "POST",
    body: { note },
  });
}

// ── Dispute resolution ──────────────────────────────────────────────────────

export function resolveOrder(pid: string, forSeller: boolean) {
  return request<unknown>(`/api/admin/orders/${pid}/resolve`, {
    method: "POST",
    body: { for_seller: forSeller },
  });
}

export function resolveRide(pid: string, forDriver: boolean) {
  return request<unknown>(`/api/admin/rides/${pid}/resolve`, {
    method: "POST",
    body: { for_driver: forDriver },
  });
}

export function resolveDelivery(pid: string, forAgent: boolean) {
  return request<unknown>(`/api/admin/deliveries/${pid}/resolve`, {
    method: "POST",
    body: { for_agent: forAgent },
  });
}

// ── Listings ────────────────────────────────────────────────────────────────

/** Takedown — the owner cannot self-reactivate afterwards. */
export function removeListing(pid: string, reason: string) {
  return request<unknown>(`/api/admin/listings/${pid}/remove`, {
    method: "POST",
    body: { reason },
  });
}

export function reactivateListing(pid: string) {
  return request<unknown>(`/api/admin/listings/${pid}/reactivate`, { method: "POST" });
}

// ── Driver & delivery-agent verification queues ────────────────────────────

export function drivers(): Promise<DriverResponse[]> {
  return request<DriverResponse[]>("/api/admin/drivers");
}

type VerifyAction = "verify" | "reject" | "suspend";
function driverAction(pid: string, action: VerifyAction, note?: string) {
  return request<unknown>(`/api/admin/drivers/${pid}/${action}`, {
    method: "POST",
    body: { note },
  });
}
export const verifyDriver = (pid: string, note?: string) => driverAction(pid, "verify", note);
export const rejectDriver = (pid: string, note?: string) => driverAction(pid, "reject", note);
export const suspendDriver = (pid: string, note?: string) => driverAction(pid, "suspend", note);

export function deliveryAgents(): Promise<unknown[]> {
  return request<unknown[]>("/api/admin/delivery-agents");
}

function agentAction(pid: string, action: VerifyAction, note?: string) {
  return request<unknown>(`/api/admin/delivery-agents/${pid}/${action}`, {
    method: "POST",
    body: { note },
  });
}
export const verifyAgent = (pid: string, note?: string) => agentAction(pid, "verify", note);
export const rejectAgent = (pid: string, note?: string) => agentAction(pid, "reject", note);
export const suspendAgent = (pid: string, note?: string) => agentAction(pid, "suspend", note);

// ── Audit (Phase 7) ─────────────────────────────────────────────────────────

/** Append-only, newest first, keyset. Never edited or deleted. */
export function audit(q: KeysetQuery & { actor_pid?: string } = {}) {
  const { actor_pid, ...rest } = q;
  return request<AdminAuditRow[]>("/api/admin/audit", {
    query: { ...keysetQuery(rest, 100), actor_pid },
  });
}

// ── KYC review queue (Phase 7 / G7) ────────────────────────────────────────

export function kycQueue(status = "pending") {
  return request<
    Array<{
      user_pid: Pid;
      user_name: string;
      user_email: string;
      doc_type: string;
      status: string;
      url: string;
      submitted_at: string;
    }>
  >("/api/admin/kyc", { query: { status } });
}

/** Guarded pending→verified; user notified; audit-logged. */
export function approveKyc(userPid: string, docType: string, note?: string) {
  return request<unknown>(
    `/api/admin/kyc/${userPid}/${encodeURIComponent(docType)}/approve`,
    { method: "POST", body: { note } },
  );
}

export function rejectKyc(userPid: string, docType: string, note?: string) {
  return request<unknown>(
    `/api/admin/kyc/${userPid}/${encodeURIComponent(docType)}/reject`,
    { method: "POST", body: { note } },
  );
}

// ── User management (Phase 7 / G9) ─────────────────────────────────────────

export function users(q: KeysetQuery & { query?: string; role?: Role } = {}) {
  const { query: search, role, ...rest } = q;
  return request<unknown[]>("/api/admin/users", {
    query: { ...keysetQuery(rest, 50), query: search, role },
  });
}

/** SUPERADMIN-ONLY. The superadmin's own account is locked. */
export function setUserRole(pid: string, role: Role) {
  return request<unknown>(`/api/admin/users/${pid}/role`, {
    method: "POST",
    body: { role },
  });
}

/** SUPERADMIN-ONLY — block also revokes every refresh family. */
export function blockUser(pid: string) {
  return request<unknown>(`/api/admin/users/${pid}/block`, { method: "POST" });
}

export function unblockUser(pid: string) {
  return request<unknown>(`/api/admin/users/${pid}/unblock`, { method: "POST" });
}

// ── Oversight (Phase 7) ─────────────────────────────────────────────────────

export function escrows(q: KeysetQuery & { status?: string } = {}) {
  const { status, ...rest } = q;
  return request<unknown[]>("/api/admin/escrows", {
    query: { ...keysetQuery(rest, 50), status },
  });
}

/** Each row carries `ledger_ok` — Σ ledger vs cached balance, computed live.
 *  A `false` is a STOP signal: investigate before anything else. */
export function wallets(q: KeysetQuery = {}) {
  return request<WalletWithIntegrity[]>("/api/admin/wallets", { query: keysetQuery(q, 50) });
}

/** Support view: wallet + last 50 ledger entries. */
export function userWallet(pid: string) {
  return request<{ wallet: WalletWithIntegrity; entries: unknown[] }>(
    `/api/admin/users/${pid}/wallet`,
  );
}

// ── Analytics & monitoring (Phase 7 / G10, G12) ────────────────────────────

/** Pre-aggregated rows only — no live scanning. Backfill via CLI task. */
export function stats(days = 30): Promise<DailyStats[]> {
  return request<DailyStats[]>("/api/admin/stats", { query: { days } });
}

/** Live WS counts, queue depth, email budget vs cap, and every rate/limit. */
export function monitor(): Promise<MonitorSnapshot> {
  return request<MonitorSnapshot>("/api/admin/monitor");
}

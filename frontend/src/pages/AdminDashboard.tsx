import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { admin, ApiError, koboToNaira } from "@/api";
import type { AdminAuditRow, DriverResponse, Role } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Users, Wallet, ArrowDownToLine, Scale, Car, Bike, FileCheck,
  UserSearch, Tag, Vault, ScrollText, Gauge, Loader2, ShieldAlert, OctagonX,
} from "lucide-react";
import { AdminEscrowManager } from "@/components/Admin/AdminEscrowManager";

type Tab =
  | "overview" | "wallets" | "withdrawals" | "disputes" | "drivers"
  | "agents" | "kyc" | "users" | "listings" | "escrows" | "audit";

type Row = Record<string, unknown>;

function str(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function errMsg(e: unknown): string {
  return e instanceof ApiError ? e.description : "Request failed. Please try again.";
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="card p-5 mb-5">
      <h2 className="font-semibold text-foreground mb-1">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground mb-4">{hint}</p>}
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="py-8 text-center">
      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
    </div>
  );
}

function QueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <p className="mb-3">{errMsg(error)}</p>
      <button onClick={onRetry} className="btn-primary px-4 py-2 rounded-lg text-sm">
        Retry
      </button>
    </div>
  );
}

// ── Overview: monitor + stats ────────────────────────────────────────────────

function OverviewTab() {
  const [days, setDays] = useState(30);
  const monitor = useQuery({ queryKey: ["admin", "monitor"], queryFn: admin.monitor });
  const stats = useQuery({ queryKey: ["admin", "stats", days], queryFn: () => admin.stats(days) });

  return (
    <>
      <Section title="Live monitor" hint="WebSocket counts, queue depth, email budget and rate limits.">
        {monitor.isLoading ? <Loading /> :
          monitor.isError ? <QueryError error={monitor.error} onRetry={() => monitor.refetch()} /> :
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 border border-border rounded-xl bg-card">
                <p className="text-xs text-muted-foreground">Queue depth</p>
                <p className="text-2xl font-bold">{str(monitor.data?.queue_depth ?? "-")}</p>
              </div>
              {Object.entries(monitor.data?.ws ?? {}).map(([k, v]) => (
                <div key={k} className="p-4 border border-border rounded-xl bg-card">
                  <p className="text-xs text-muted-foreground">WS: {k}</p>
                  <p className="text-2xl font-bold">{str(v)}</p>
                </div>
              ))}
              <div className="p-4 border border-border rounded-xl bg-card">
                <p className="text-xs text-muted-foreground">Email budget</p>
                <p className="text-sm font-mono break-all">{str(monitor.data?.email ?? "-")}</p>
              </div>
              <div className="p-4 border border-border rounded-xl bg-card">
                <p className="text-xs text-muted-foreground">Limits</p>
                <p className="text-sm font-mono break-all">{str(monitor.data?.limits ?? "-")}</p>
              </div>
            </div>
          )}
      </Section>
      <Section title="Daily stats" hint="Pre-aggregated rows only — no live scanning.">
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-muted-foreground">Days</label>
          <input
            type="number" min={1} max={365} value={days}
            onChange={(e) => setDays(Number(e.target.value) || 30)}
            className="input-field w-24 px-3 py-1.5 rounded-lg"
          />
        </div>
        {stats.isLoading ? <Loading /> :
          stats.isError ? <QueryError error={stats.error} onRetry={() => stats.refetch()} /> :
          !stats.data?.length ? <p className="text-sm text-muted-foreground">No stats rows yet.</p> :
          (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4">Day</th>
                    <th className="py-2 pr-4">Metrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.data.map((row) => {
                    const { day, ...metrics } = row as Record<string, unknown>;
                    return (
                      <tr key={str(day)}>
                        <td className="py-2 pr-4 font-medium whitespace-nowrap">{str(day)}</td>
                        <td className="py-2 pr-4 font-mono text-xs break-all">{JSON.stringify(metrics)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Section>
    </>
  );
}

// ── Wallets ──────────────────────────────────────────────────────────────────

function WalletsTab() {
  const wallets = useQuery({ queryKey: ["admin", "wallets"], queryFn: () => admin.wallets() });

  if (wallets.isLoading) return <Loading />;
  if (wallets.isError) return <QueryError error={wallets.error} onRetry={() => wallets.refetch()} />;

  const rows = wallets.data ?? [];
  const bad = rows.filter((w) => !w.ledger_ok);

  return (
    <>
      {bad.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-red-600 text-white flex items-start gap-3" role="alert">
          <OctagonX className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">STOP — {bad.length} wallet{bad.length === 1 ? "" : "s"} failed ledger integrity.</p>
            <p className="text-sm text-red-100">
              Cached balance does not match the ledger sum. Investigate before anything else.
            </p>
          </div>
        </div>
      )}
      <Section title="Wallets" hint="Each row carries a live ledger_ok flag: ledger sum vs cached balance.">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wallets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Wallet</th>
                  <th className="py-2 pr-4">Balance</th>
                  <th className="py-2 pr-4">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((w) => (
                  <tr key={w.pid}>
                    <td className="py-2 pr-4 font-mono text-xs" title={w.pid}>{w.pid.slice(0, 8)}...</td>
                    <td className="py-2 pr-4 font-semibold">{w.balance_display}</td>
                    <td className="py-2 pr-4">
                      {w.ledger_ok ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">STOP</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}

// ── Withdrawals ──────────────────────────────────────────────────────────────

function WithdrawalsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("requested");
  const list = useQuery({
    queryKey: ["admin", "withdrawals", status],
    queryFn: () => admin.withdrawals(status),
  });
  const act = useMutation({
    mutationFn: ({ pid, approve, note }: { pid: string; approve: boolean; note?: string }) =>
      approve ? admin.approveWithdrawal(pid) : admin.rejectWithdrawal(pid, note),
    onSuccess: (_, v) => {
      toast.success(v.approve ? "Withdrawal approved." : "Withdrawal rejected; funds returned.");
      qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decide = (pid: string, approve: boolean) => {
    const label = approve ? "APPROVE this withdrawal? This calls the Flutterwave transfer." : "REJECT this withdrawal? Funds return instantly.";
    if (window.confirm(label)) act.mutate({ pid, approve });
  };

  return (
    <Section title="Withdrawals queue" hint="Approve calls the Flutterwave transfer; double-approve is rejected with 400.">
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-muted-foreground">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field px-3 py-1.5 rounded-lg">
          <option value="requested">requested</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
      {list.isLoading ? <Loading /> :
        list.isError ? <QueryError error={list.error} onRetry={() => list.refetch()} /> :
        (list.data as Row[]).length === 0 ? <p className="text-sm text-muted-foreground">Queue is empty.</p> :
        (
          <div className="space-y-3">
            {(list.data as Row[]).map((w, i) => (
              <div key={str(w.pid ?? i)} className="p-4 border border-border rounded-xl flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-mono text-xs text-muted-foreground">{str(w.pid)}</p>
                  <p className="font-semibold">{str(w.amount_display ?? w.amount_kobo ?? "")}</p>
                  <p className="text-xs text-muted-foreground">{str(w.status ?? status)}</p>
                </div>
                {status === "requested" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(str(w.pid), true)}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(str(w.pid), false)}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </Section>
  );
}

// ── Disputes ─────────────────────────────────────────────────────────────────

function DisputesTab() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"order" | "ride" | "delivery">("order");
  const [pid, setPid] = useState("");
  const [side, setSide] = useState<"a" | "b">("a");

  const resolve = useMutation({
    mutationFn: () => {
      if (!pid.trim()) throw new Error("Enter a reference first.");
      const forFirst = side === "a";
      if (kind === "order") return admin.resolveOrder(pid.trim(), forFirst);
      if (kind === "ride") return admin.resolveRide(pid.trim(), forFirst);
      return admin.resolveDelivery(pid.trim(), forFirst);
    },
    onSuccess: () => {
      toast.success("Dispute resolved; escrow settled.");
      setPid("");
      qc.invalidateQueries({ queryKey: ["admin", "escrows"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : errMsg(e)),
  });

  const sideLabels = kind === "order"
    ? ["For seller", "For buyer"]
    : kind === "ride" ? ["For driver", "For rider"] : ["For agent", "For customer"];

  return (
    <Section
      title="Dispute resolution"
      hint="Settles the frozen escrow. The boolean body picks the winning side — confirm carefully."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Type</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="input-field w-full px-3 py-2 rounded-lg">
            <option value="order">Order</option>
            <option value="ride">Ride</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Reference (pid)</label>
          <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="uuid" className="input-field w-full px-3 py-2 rounded-lg font-mono" />
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        {(["a", "b"] as const).map((s, i) => (
          <label key={s} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={side === s} onChange={() => setSide(s)} />
            {sideLabels[i]}
          </label>
        ))}
      </div>
      <button
        disabled={resolve.isPending || !pid.trim()}
        onClick={() => {
          if (window.confirm(`Resolve this ${kind} dispute? Escrow moves immediately.`)) resolve.mutate();
        }}
        className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
      >
        {resolve.isPending ? "Resolving..." : "Resolve dispute"}
      </button>
    </Section>
  );
}

// ── Driver / agent verification ──────────────────────────────────────────────

function VerifyQueueTab({ kind }: { kind: "drivers" | "agents" }) {
  const qc = useQueryClient();
  const key = ["admin", kind];
  const list = useQuery({
    queryKey: key,
    queryFn: () => (kind === "drivers" ? admin.drivers() : admin.deliveryAgents()),
  });
  const act = useMutation({
    mutationFn: ({ pid, action }: { pid: string; action: "verify" | "reject" | "suspend" }) => {
      if (kind === "drivers") {
        return action === "verify" ? admin.verifyDriver(pid)
          : action === "reject" ? admin.rejectDriver(pid) : admin.suspendDriver(pid);
      }
      return action === "verify" ? admin.verifyAgent(pid)
        : action === "reject" ? admin.rejectAgent(pid) : admin.suspendAgent(pid);
    },
    onSuccess: (_, v) => {
      toast.success(`${kind === "drivers" ? "Driver" : "Agent"} ${v.action}d.`);
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decide = (pid: string, action: "verify" | "reject" | "suspend") => {
    if (window.confirm(`${action.toUpperCase()} this ${kind === "drivers" ? "driver" : "delivery agent"}?`)) {
      act.mutate({ pid, action });
    }
  };

  const rows: Row[] = ((list.data ?? []) as unknown as Row[]).map((r) => {
    const d = r as unknown as DriverResponse & Row;
    return { pid: str(d.pid ?? (d as Row).user_pid ?? ""), status: str(d.status ?? ""), raw: r };
  });

  return (
    <Section
      title={kind === "drivers" ? "Driver verification" : "Delivery-agent verification"}
      hint="Apply to KYC review: approve only after documents check out."
    >
      {list.isLoading ? <Loading /> :
        list.isError ? <QueryError error={list.error} onRetry={() => list.refetch()} /> :
        rows.length === 0 ? <p className="text-sm text-muted-foreground">Queue is empty.</p> :
        (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={str(r.pid) || i} className="p-4 border border-border rounded-xl flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-mono text-xs text-muted-foreground">{str(r.pid)}</p>
                  <p className="text-sm">Status: <span className="font-medium">{str(r.status)}</span></p>
                </div>
                <div className="flex gap-2">
                  {(["verify", "reject", "suspend"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => decide(str(r.pid), a)}
                      disabled={act.isPending}
                      className={`px-3 py-1.5 rounded-lg text-sm text-white disabled:opacity-50 ${
                        a === "verify" ? "bg-green-600 hover:bg-green-700"
                        : a === "reject" ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      {a[0].toUpperCase() + a.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </Section>
  );
}

// ── KYC ─────────────────────────────────────────────────────────────────────��

function KycTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const list = useQuery({
    queryKey: ["admin", "kyc", status],
    queryFn: () => admin.kycQueue(status),
  });
  const act = useMutation({
    mutationFn: ({ userPid, docType, approve }: { userPid: string; docType: string; approve: boolean }) =>
      approve ? admin.approveKyc(userPid, docType) : admin.rejectKyc(userPid, docType),
    onSuccess: (_, v) => {
      toast.success(v.approve ? "KYC approved; user notified." : "KYC rejected.");
      qc.invalidateQueries({ queryKey: ["admin", "kyc"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Section title="KYC review" hint="Approve is guarded pending-to-verified and notifies the user.">
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-muted-foreground">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field px-3 py-1.5 rounded-lg">
          <option value="pending">pending</option>
          <option value="verified">verified</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
      {list.isLoading ? <Loading /> :
        list.isError ? <QueryError error={list.error} onRetry={() => list.refetch()} /> :
        (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Queue is empty.</p> :
        (
          <div className="space-y-3">
            {(list.data ?? []).map((k) => (
              <div key={`${k.user_pid}-${k.doc_type}`} className="p-4 border border-border rounded-xl flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <p className="font-medium">{k.user_name} <span className="text-xs text-muted-foreground">({k.user_email})</span></p>
                  <p className="text-sm">Document: <span className="font-medium">{k.doc_type}</span></p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(k.submitted_at).toLocaleString()}</p>
                  <a href={k.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Open document</a>
                </div>
                {k.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (window.confirm(`APPROVE ${k.doc_type} for ${k.user_name}?`)) {
                          act.mutate({ userPid: k.user_pid, docType: k.doc_type, approve: true });
                        }
                      }}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`REJECT ${k.doc_type} for ${k.user_name}?`)) {
                          act.mutate({ userPid: k.user_pid, docType: k.doc_type, approve: false });
                        }
                      }}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </Section>
  );
}

// ── Users ────────────────────────────────────────────────────��────────��──────

function UsersTab() {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<string | undefined>(undefined);
  const [roleFor, setRoleFor] = useState<Record<string, string>>({});
  const list = useQuery({
    queryKey: ["admin", "users", applied ?? ""],
    queryFn: () => admin.users(applied ? { query: applied } : {}),
  });
  const act = useMutation({
    mutationFn: (v: { pid: string; op: "role" | "block" | "unblock"; role?: string }) =>
      v.op === "role" ? admin.setUserRole(v.pid, (v.role ?? "buyer") as Role)
      : v.op === "block" ? admin.blockUser(v.pid) : admin.unblockUser(v.pid),
    onSuccess: (_, v) => {
      toast.success(v.op === "role" ? "Role updated." : v.op === "block" ? "User blocked; sessions revoked." : "User unblocked.");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const destructive = (pid: string, op: "role" | "block" | "unblock", role?: string) => {
    const label = op === "role" ? `Set role to ${role}?` : op === "block" ? "BLOCK this user? Every session is revoked." : "UNBLOCK this user?";
    if (window.confirm(label)) act.mutate({ pid, op, role });
  };

  // GET /api/admin/users/{pid}/wallet — support view: balance, live ledger
  // integrity flag, last 50 ledger entries.
  const [walletPid, setWalletPid] = useState<string | null>(null);
  const walletQ = useQuery({
    queryKey: ["admin", "user-wallet", walletPid],
    queryFn: () => admin.userWallet(walletPid!),
    enabled: Boolean(walletPid),
  });

  return (
    <Section
      title="Users"
      hint="Role changes and block/unblock are SUPERADMIN-ONLY. The superadmin account itself is locked."
    >
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => { e.preventDefault(); setApplied(input.trim() ? input.trim() : undefined); }}
      >
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name or email..."
          className="input-field flex-1 px-3 py-2 rounded-lg"
        />
        <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-sm">Search</button>
      </form>
      {list.isLoading ? <Loading /> :
        list.isError ? <QueryError error={list.error} onRetry={() => list.refetch()} /> :
        (list.data as Row[]).length === 0 ? <p className="text-sm text-muted-foreground">No users found.</p> :
        (
          <div className="space-y-3">
            {(list.data as Row[]).map((u, i) => {
              const pid = str(u.pid ?? u.user_pid ?? i);
              return (
                <div key={pid} className="p-4 border border-border rounded-xl flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-medium">{str(u.name ?? u.full_name ?? u.email)}</p>
                    <p className="text-xs text-muted-foreground">{str(u.email)} · role: {str(u.role)}</p>
                    <p className="font-mono text-xs text-muted-foreground">{pid}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">SUPERADMIN-ONLY</span>
                    <select
                      value={roleFor[pid] ?? str(u.role ?? "buyer")}
                      onChange={(e) => setRoleFor((m) => ({ ...m, [pid]: e.target.value }))}
                      className="input-field px-2 py-1.5 rounded-lg text-sm"
                    >
                      {["buyer", "seller", "service_provider", "jobposter", "driver", "logistics_agent", "admin", "superadmin"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => destructive(pid, "role", roleFor[pid] ?? str(u.role ?? "buyer"))}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg border text-sm hover:bg-accent disabled:opacity-50"
                    >
                      Set role
                    </button>
                    <button
                      onClick={() => destructive(pid, "block")}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => destructive(pid, "unblock")}
                      disabled={act.isPending}
                      className="px-3 py-1.5 rounded-lg border text-sm hover:bg-accent disabled:opacity-50"
                    >
                      Unblock
                    </button>
                    <button
                      onClick={() => setWalletPid(walletPid === pid ? null : pid)}
                      className="px-3 py-1.5 rounded-lg border text-sm hover:bg-accent"
                    >
                      {walletPid === pid ? "Hide wallet" : "Wallet"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Support view: balance + live ledger integrity + recent entries */}
      {walletPid && (
        <div className="mt-4 p-4 border border-border rounded-xl bg-background">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm">Wallet — {walletPid.slice(0, 8)}…</h4>
            <button type="button" onClick={() => setWalletPid(null)} className="text-xs text-muted-foreground hover:text-foreground">
              close
            </button>
          </div>
          {walletQ.isLoading && <Loading />}
          {walletQ.error && <QueryError error={walletQ.error} onRetry={() => walletQ.refetch()} />}
          {walletQ.data && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-lg font-semibold">{walletQ.data.wallet.balance_display}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    walletQ.data.wallet.ledger_ok
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {walletQ.data.wallet.ledger_ok ? "ledger OK" : "LEDGER MISMATCH — STOP"}
                </span>
              </div>
              {walletQ.data.wallet.ledger_ok === false && (
                <p className="text-xs text-red-700">
                  The cached balance disagrees with the sum of ledger rows. Do not trust
                  this wallet until it is investigated — every kobo must reconcile.
                </p>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Last {walletQ.data.entries.length} ledger entries
                </p>
                <ul className="divide-y divide-border text-xs">
                  {walletQ.data.entries.map((raw, idx) => {
                    const e = raw as Record<string, unknown>;
                    const amount = typeof e.amount_kobo === "number" ? e.amount_kobo : 0;
                    return (
                      <li key={typeof e.id === "number" ? e.id : idx} className="py-1.5 flex justify-between gap-3">
                        <span>
                          {str(e.narration) ?? String(e.entry_type ?? "entry")}
                          {typeof e.created_at === "string" && (
                            <span className="text-muted-foreground"> · {e.created_at}</span>
                          )}
                        </span>
                        <span className={amount < 0 ? "text-red-600" : "text-emerald-600"}>
                          {amount < 0 ? "−" : "+"}
                          {koboToNaira(Math.abs(amount))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Listings moderation ──────────────────────────────────────────────────────

function ListingsTab() {
  const [pid, setPid] = useState("");
  const [reason, setReason] = useState("");
  const act = useMutation({
    mutationFn: (v: { op: "remove" | "reactivate" }) =>
      v.op === "remove" ? admin.removeListing(pid.trim(), reason.trim()) : admin.reactivateListing(pid.trim()),
    onSuccess: (_, v) => {
      toast.success(v.op === "remove" ? "Listing taken down. The owner cannot self-reactivate." : "Listing reactivated.");
      setPid(""); setReason("");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const go = (op: "remove" | "reactivate") => {
    if (!pid.trim()) { toast.error("Enter a listing reference first."); return; }
    if (op === "remove" && !reason.trim()) { toast.error("A takedown reason is required."); return; }
    if (window.confirm(op === "remove" ? "TAKEDOWN this listing?" : "REACTIVATE this listing?")) act.mutate({ op });
  };

  return (
    <Section title="Listings moderation" hint="Takedown is one-way for the owner; only an admin can reactivate.">
      <label className="text-sm text-muted-foreground block mb-1">Listing reference (pid)</label>
      <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="uuid" className="input-field w-full px-3 py-2 rounded-lg font-mono mb-3" />
      <label className="text-sm text-muted-foreground block mb-1">Takedown reason (required for remove)</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. prohibited item" className="input-field w-full px-3 py-2 rounded-lg mb-4" />
      <div className="flex gap-2">
        <button onClick={() => go("remove")} disabled={act.isPending} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
          Remove
        </button>
        <button onClick={() => go("reactivate")} disabled={act.isPending} className="px-4 py-2 rounded-lg border text-sm hover:bg-accent disabled:opacity-50">
          Reactivate
        </button>
      </div>
    </Section>
  );
}

// ── Audit ────────────────────────────────────────────────────────────────────

function AuditTab() {
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const page = useQuery({
    queryKey: ["admin", "audit", cursor ?? "head"],
    queryFn: () => admin.audit(cursor === undefined ? {} : { after: cursor }),
  });

  const items: AdminAuditRow[] = cursor === undefined ? (page.data ?? []) : [...rows, ...(page.data ?? [])];

  return (
    <Section title="Audit trail" hint="Append-only, newest first. Never edited or deleted.">
      {page.isLoading && cursor === undefined ? <Loading /> :
        page.isError && cursor === undefined ? <QueryError error={page.error} onRetry={() => page.refetch()} /> :
        items.length === 0 ? <p className="text-sm text-muted-foreground">No audit rows yet.</p> :
        (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{str(a.actor_pid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(page.data ?? []).length > 0 && (
              <button
                disabled={page.isFetching}
                onClick={() => {
                  const last = (page.data ?? [])[(page.data ?? []).length - 1];
                  if (cursor === undefined) setRows(page.data ?? []);
                  setCursor(last.id);
                }}
                className="mt-4 px-4 py-2 rounded-lg border text-sm hover:bg-accent disabled:opacity-50"
              >
                {page.isFetching ? "Loading..." : "Load older"}
              </button>
            )}
            {page.isError && cursor !== undefined && (
              <p className="mt-2 text-sm text-red-600">{errMsg(page.error)}</p>
            )}
          </>
        )}
    </Section>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
  { id: "disputes", label: "Disputes", icon: Scale },
  { id: "drivers", label: "Drivers", icon: Car },
  { id: "agents", label: "Agents", icon: Bike },
  { id: "kyc", label: "KYC", icon: FileCheck },
  { id: "users", label: "Users", icon: UserSearch },
  { id: "listings", label: "Listings", icon: Tag },
  { id: "escrows", label: "Escrows", icon: Vault },
  { id: "audit", label: "Audit", icon: ScrollText },
];

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  const heartbeat = useQuery({
    queryKey: ["admin", "heartbeat"],
    queryFn: () => admin.heartbeat(),
    retry: false,
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Please log in</h1>
          <Link to="/login" className="btn-primary inline-block mt-4 px-5 py-2 rounded-lg text-sm">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (heartbeat.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hbError = heartbeat.error as ApiError | null;
  if (heartbeat.isError && hbError?.status === 403) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-red-500" />
          <h1 className="text-xl font-semibold">Admin role required</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account does not have admin access. Nothing further was loaded.
          </p>
          <Link to="/" className="btn-primary inline-block mt-4 px-5 py-2 rounded-lg text-sm">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (heartbeat.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Could not reach the admin service</h1>
          <p className="text-sm text-muted-foreground mt-2">{errMsg(heartbeat.error)}</p>
          <button onClick={() => heartbeat.refetch()} className="btn-primary mt-4 px-5 py-2 rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Admin</h1>
          <span className="text-xs text-muted-foreground ml-2">signed in as {user.email} ({user.roles[0]})</span>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "gradient-purple text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "wallets" && <WalletsTab />}
        {tab === "withdrawals" && <WithdrawalsTab />}
        {tab === "disputes" && <DisputesTab />}
        {tab === "drivers" && <VerifyQueueTab kind="drivers" />}
        {tab === "agents" && <VerifyQueueTab kind="agents" />}
        {tab === "kyc" && <KycTab />}
        {tab === "users" && <UsersTab />}
        {tab === "listings" && <ListingsTab />}
        {tab === "escrows" && <AdminEscrowManager />}
        {tab === "audit" && <AuditTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;

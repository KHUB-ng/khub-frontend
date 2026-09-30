import type { ReactNode } from "react";
import { ApiError } from "@/api";
import { koboToNaira } from "@/api";

/**
 * Shared presentational primitives used by every page group.
 *
 * `Money` is deliberately the only way amounts are rendered: the backend
 * sends `*_kobo` integers plus `*_display` strings, and hand-rolling the
 * formatting in each screen is how a kobo/naira mix-up slips through.
 */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      {title && <h2 className="text-sm font-semibold">{title}</h2>}
      <div className={title ? "mt-3" : ""}>{children}</div>
      {footer && <div className="mt-4 border-t border-border pt-3">{footer}</div>}
    </section>
  );
}

export function Money({
  kobo,
  display,
  className = "",
}: {
  kobo?: number | null;
  display?: string | null;
  className?: string;
}) {
  if (display) return <span className={className}>{display}</span>;
  if (typeof kobo === "number") return <span className={className}>{koboToNaira(kobo)}</span>;
  return <span className={className}>—</span>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Renders the backend's `{error, description}` envelope faithfully.
 * 503 is called out explicitly because it means "provider unconfigured" —
 * a server state, not the caller's mistake.
 */
export function ErrorState({ error }: { error: unknown }) {
  const api = error instanceof ApiError ? error : null;
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <p className="text-sm font-medium text-destructive">
        {api ? `${api.status} ${api.code}` : "Request failed"}
      </p>
      <p className="mt-1 text-sm text-destructive/90">
        {api ? api.description : error instanceof Error ? error.message : String(error)}
      </p>
      {api?.isUnconfigured && (
        <p className="mt-2 text-xs text-muted-foreground">
          The server reports a provider is not configured (Flutterwave / Google
          keys absent). Nothing you did — retry once it is set up.
        </p>
      )}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad";
}) {
  const styles = {
    neutral: "bg-muted text-muted-foreground",
    ok: "bg-emerald-500/15 text-emerald-500",
    warn: "bg-amber-500/15 text-amber-500",
    bad: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${styles[tone]}`}>
      {children}
    </span>
  );
}

/** Status → tone, so identical backend states look identical everywhere. */
export function statusTone(status: string): "neutral" | "ok" | "warn" | "bad" {
  const s = status.toLowerCase();
  if (["active", "completed", "confirmed", "delivered", "verified", "rewarded", "approved"].includes(s)) return "ok";
  if (["pending", "requested", "accepted", "arriving", "started", "picked_up", "in_transit", "applied", "viewed", "shortlisted"].includes(s)) return "warn";
  if (["cancelled", "disputed", "rejected", "suspended", "blocked", "refunded", "failed"].includes(s)) return "bad";
  return "neutral";
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export const buttonClass =
  "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50";

export const secondaryButtonClass = "rounded-md border border-border px-4 py-2 text-sm";

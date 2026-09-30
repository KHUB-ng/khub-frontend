import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, rides } from "@/api";
import {
  Badge,
  Card,
  ErrorState,
  Loading,
  Money,
  PageHeader,
  inputClass,
  secondaryButtonClass,
  statusTone,
} from "@/components/ui/primitives";

const STEPS = ["requested", "accepted", "arriving", "started", "completed"] as const;

function describe(e: unknown): string {
  if (e instanceof ApiError) return e.description;
  if (e instanceof Error) return e.message;
  return "Request failed";
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled" || status === "disputed") {
    return (
      <div className="flex items-center gap-2">
        {STEPS.map((s) => (
          <span key={s} className="h-2 w-8 rounded bg-muted" />
        ))}
        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>
    );
  }
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  const active = idx === -1 ? 0 : idx;
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              i < active
                ? "bg-emerald-500/20 text-emerald-500"
                : i === active
                  ? "bg-amber-500/20 text-amber-500"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </span>
          <span className={`text-xs ${i <= active ? "font-medium" : "text-muted-foreground"}`}>
            {s}
          </span>
          {i < STEPS.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
        </li>
      ))}
    </ol>
  );
}

export default function RideDetailPage() {
  const { pid = "" } = useParams();
  const qc = useQueryClient();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const detailQ = useQuery({
    queryKey: ["rides", "detail", pid],
    queryFn: () => rides.get(pid),
    enabled: pid.length > 0,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["rides"] });
  };

  const cancelM = useMutation({
    mutationFn: () => rides.cancel(pid),
    onSuccess: () => {
      toast.success("Ride cancelled — pre-start fare refunded.");
      invalidate();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const disputeM = useMutation({
    mutationFn: () => rides.dispute(pid),
    onSuccess: () => {
      toast.success("Ride disputed — fare frozen for admin review.");
      invalidate();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const rateM = useMutation({
    mutationFn: () => {
      const r = Number.parseInt(rating, 10);
      return rides.rate(pid, r, comment.trim() ? comment.trim() : undefined);
    },
    onSuccess: () => {
      toast.success("Rating submitted.");
      setComment("");
      invalidate();
    },
    onError: (e) => toast.error(describe(e)),
  });

  const status = detailQ.data ? String(detailQ.data.status) : "";
  const cancellable = ["requested", "accepted", "arriving"].includes(status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride detail"
        subtitle={pid}
        actions={
          <Link to="/rides" className={secondaryButtonClass}>
            Back to rides
          </Link>
        }
      />

      {detailQ.isLoading && <Loading label="Loading ride…" />}
      {detailQ.error && <ErrorState error={detailQ.error} />}

      {detailQ.data && (
        <>
          <Card title="Status">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={statusTone(status)}>{status}</Badge>
                <Money
                  kobo={num(detailQ.data["fare_kobo"]) ?? num(detailQ.data["amount_kobo"])}
                  display={str(detailQ.data["fare_display"]) ?? str(detailQ.data["amount_display"])}
                  className="text-lg font-semibold"
                />
              </div>
              <StatusTimeline status={status} />
              <p className="text-xs text-muted-foreground">
                requested → accepted → arriving → started → completed. A cancelled or
                disputed ride leaves this path; disputed fares stay frozen until an admin
                resolves them.
              </p>
            </div>
          </Card>

          <Card title="Trip">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Pickup</dt>
                <dd>
                  {str(detailQ.data["pickup_label"]) ??
                    JSON.stringify(detailQ.data["pickup"] ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Destination</dt>
                <dd>
                  {str(detailQ.data["dest_label"]) ??
                    JSON.stringify(detailQ.data["dest"] ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Driver</dt>
                <dd>{str(detailQ.data["driver_pid"]) ?? "Not yet assigned"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{str(detailQ.data["created_at"]) ?? "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Actions">
            <div className="flex flex-wrap gap-2">
              {cancellable && (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={cancelM.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Cancel this ride? The escrowed fare is refunded instantly.",
                      )
                    ) {
                      cancelM.mutate();
                    }
                  }}
                >
                  {cancelM.isPending ? "Cancelling…" : "Cancel ride"}
                </button>
              )}
              {status !== "cancelled" && status !== "disputed" && (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={disputeM.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Dispute this ride? The fare is frozen until an admin resolves it.",
                      )
                    ) {
                      disputeM.mutate();
                    }
                  }}
                >
                  {disputeM.isPending ? "Disputing…" : "Dispute ride"}
                </button>
              )}
            </div>
            {status === "completed" && (
              <form
                className="mt-4 flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const r = Number.parseInt(rating, 10);
                  if (!Number.isInteger(r) || r < 1 || r > 5) {
                    toast.error("Rating must be 1–5.");
                    return;
                  }
                  rateM.mutate();
                }}
              >
                <select
                  aria-label="Rating"
                  className="rounded-md border border-input bg-transparent px-2 py-1.5 text-sm"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {["5", "4", "3", "2", "1"].map((v) => (
                    <option key={v} value={v}>
                      {v}★
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  style={{ width: "12rem" }}
                  placeholder="Comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="submit"
                  className={secondaryButtonClass}
                  disabled={rateM.isPending}
                >
                  {rateM.isPending ? "Sending…" : "Rate driver"}
                </button>
              </form>
            )}
            {(cancelM.error ?? disputeM.error ?? rateM.error) && (
              <div className="mt-3">
                <ErrorState error={cancelM.error ?? disputeM.error ?? rateM.error} />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

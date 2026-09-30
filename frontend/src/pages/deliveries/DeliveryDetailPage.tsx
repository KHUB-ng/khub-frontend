import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, deliveries } from "@/api";
import {
  Badge,
  Card,
  ErrorState,
  Loading,
  PageHeader,
  buttonClass,
  statusTone,
} from "@/components/ui/primitives";

/**
 * GET /api/deliveries/{pid} — one parcel, party-gated.
 *
 * The requester can cancel before pickup, dispute while it is moving, and
 * rate only once it is delivered. Money fields arrive as `*_kobo` /
 * `*_display`; the delivery response is loosely typed on the backend, so every
 * field is read defensively rather than assumed.
 */

const FLOW = ["requested", "accepted", "picked_up", "in_transit", "delivered"] as const;

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function Timeline({ status }: { status: string }) {
  const at = FLOW.indexOf(status as (typeof FLOW)[number]);
  const stopped = status === "cancelled" || status === "disputed" || status === "refunded";

  return (
    <ol className="space-y-2">
      {FLOW.map((step, i) => {
        const done = at >= 0 && i <= at;
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                done ? "bg-emerald-500" : "bg-muted-foreground/30"
              }`}
            />
            <span className={done ? "" : "text-muted-foreground"}>
              {step.replace(/_/g, " ")}
            </span>
          </li>
        );
      })}
      {stopped && (
        <li className="flex items-center gap-2 text-sm">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          <Badge tone={statusTone(status)}>{status.replace(/_/g, " ")}</Badge>
        </li>
      )}
    </ol>
  );
}

export default function DeliveryDetailPage() {
  const { pid } = useParams<{ pid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const query = useQuery({
    queryKey: ["delivery", pid],
    queryFn: () => deliveries.get(pid!),
    enabled: Boolean(pid),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["delivery", pid] });
    void queryClient.invalidateQueries({ queryKey: ["deliveries"] });
  };

  const act = useMutation({
    mutationFn: async (kind: "cancel" | "dispute" | "rate") => {
      if (kind === "cancel") return deliveries.cancel(pid!);
      if (kind === "dispute") return deliveries.dispute(pid!);
      return deliveries.rate(pid!, Number(rating), comment.trim() || undefined);
    },
    onSuccess: () => {
      toast.success("Done.");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.description : "Request failed"),
  });

  const d = query.data;
  const status = d ? String(d.status) : "";
  const trackingCode = d ? str(d["tracking_code"]) : null;

  const canCancel = ["requested", "accepted"].includes(status);
  const canDispute = ["accepted", "picked_up", "in_transit"].includes(status);
  const canRate = status === "delivered";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <PageHeader
        title="Delivery"
        subtitle={trackingCode ? `Tracking code ${trackingCode}` : undefined}
        actions={
          <button
            type="button"
            onClick={() => navigate("/deliveries")}
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            All deliveries
          </button>
        }
      />

      {query.isLoading && <Loading label="Loading delivery…" />}
      {query.error && <ErrorState error={query.error} />}

      {d && (
        <>
          <Card title="Status">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={statusTone(status)}>{status.replace(/_/g, " ")}</Badge>
              {str(d["size_class"]) && (
                <span className="text-muted-foreground">size: {str(d["size_class"])}</span>
              )}
            </div>
            <div className="mt-4">
              <Timeline status={status} />
            </div>
          </Card>

          <Card title="Details">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Tracking code</dt>
                <dd className="font-mono">{trackingCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fee</dt>
                <dd>{str(d["fee_display"]) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{str(d["created_at"]) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{str(d["updated_at"]) ?? "—"}</dd>
              </div>
            </dl>
            {num(d["distance_m"]) !== null && (
              <p className="mt-2 text-sm text-muted-foreground">
                Distance: {num(d["distance_m"])} m
              </p>
            )}
          </Card>

          {trackingCode && (
            <p className="text-sm text-muted-foreground">
              Anyone can follow this parcel without an account:{" "}
              <Link className="underline" to={`/track/${trackingCode}`}>
                public tracking link
              </Link>
              . It shows status and timing only, never names or addresses.
            </p>
          )}

          <Card title="Actions">
            {act.isPending && <Loading label="Working…" />}
            <div className="flex flex-wrap gap-2">
              {canCancel && (
                <button
                  type="button"
                  disabled={act.isPending}
                  onClick={() => {
                    if (window.confirm("Cancel this parcel? The fee is refunded.")) {
                      act.mutate("cancel");
                    }
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Cancel parcel
                </button>
              )}
              {canDispute && (
                <button
                  type="button"
                  disabled={act.isPending}
                  onClick={() => {
                    if (window.confirm("Open a dispute? The agent is frozen until an admin resolves it.")) {
                      act.mutate("dispute");
                    }
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Dispute
                </button>
              )}
              {!canCancel && !canDispute && !canRate && (
                <p className="text-sm text-muted-foreground">
                  Nothing to do at this stage.
                </p>
              )}
            </div>

            {canRate && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-medium">Rate this delivery</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="rounded-md border border-input bg-transparent px-2 py-1.5 text-sm"
                    aria-label="Rating"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} / 5
                      </option>
                    ))}
                  </select>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comment (optional)"
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={act.isPending}
                    onClick={() => act.mutate("rate")}
                    className={buttonClass}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Package } from "lucide-react";
import { ApiError, deliveries } from "@/api";
import type { Estimate, SizeClass } from "@/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  Money,
  PageHeader,
  buttonClass,
  inputClass,
  secondaryButtonClass,
  statusTone,
} from "@/components/ui/primitives";

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

const SIZES: SizeClass[] = ["small", "medium", "large"];

function DeliveryActions({ pid, status }: { pid: string; status: string }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["deliveries"] });
  };

  const cancelM = useMutation({
    mutationFn: () => deliveries.cancel(pid),
    onSuccess: () => {
      toast.success("Delivery cancelled — pre-pickup fee refunded.");
      invalidate();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const disputeM = useMutation({
    mutationFn: () => deliveries.dispute(pid),
    onSuccess: () => {
      toast.success("Delivery disputed — fee frozen for admin review.");
      invalidate();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const rateM = useMutation({
    mutationFn: () => {
      const r = Number.parseInt(rating, 10);
      return deliveries.rate(pid, r, comment.trim() ? comment.trim() : undefined);
    },
    onSuccess: () => {
      toast.success("Rating submitted.");
      setComment("");
      invalidate();
    },
    onError: (e) => toast.error(describe(e)),
  });

  const cancellable = status === "requested";
  const rateable = status === "delivered";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {cancellable && (
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={cancelM.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Cancel this delivery? The held fee is refunded (pre-pickup only).",
              )
            ) {
              cancelM.mutate();
            }
          }}
        >
          {cancelM.isPending ? "Cancelling…" : "Cancel"}
        </button>
      )}
      {!["cancelled", "disputed", "refunded"].includes(status) && (
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={disputeM.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Dispute this delivery? The fee is frozen until an admin resolves it.",
              )
            ) {
              disputeM.mutate();
            }
          }}
        >
          {disputeM.isPending ? "Disputing…" : "Dispute"}
        </button>
      )}
      {rateable && (
        <form
          className="flex flex-wrap items-center gap-2"
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
            style={{ width: "10rem" }}
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className={secondaryButtonClass} disabled={rateM.isPending}>
            {rateM.isPending ? "Sending…" : "Rate"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function DeliveriesPage() {
  const qc = useQueryClient();
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [dropoffLat, setDropoffLat] = useState("");
  const [dropoffLng, setDropoffLng] = useState("");
  const [sizeClass, setSizeClass] = useState<SizeClass>("small");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const mineQ = useQuery({ queryKey: ["deliveries", "mine"], queryFn: deliveries.mine });

  const parseCoords = () => {
    const pLat = Number.parseFloat(pickupLat);
    const pLng = Number.parseFloat(pickupLng);
    const dLat = Number.parseFloat(dropoffLat);
    const dLng = Number.parseFloat(dropoffLng);
    if (![pLat, pLng, dLat, dLng].every((n) => Number.isFinite(n))) {
      toast.error("Enter valid pickup and dropoff coordinates.");
      return null;
    }
    return {
      pickup: { lat: pLat, lng: pLng },
      dropoff: { lat: dLat, lng: dLng },
      size_class: sizeClass,
    };
  };

  const estimateM = useMutation({
    mutationFn: () => {
      const coords = parseCoords();
      if (!coords) throw new Error("Invalid coordinates.");
      return deliveries.estimate(coords);
    },
    onSuccess: (est) => setEstimate(est),
    onError: (e) => toast.error(describe(e)),
  });

  const requestM = useMutation({
    mutationFn: () => {
      const coords = parseCoords();
      if (!coords) throw new Error("Invalid coordinates.");
      return deliveries.requestDelivery(coords);
    },
    onSuccess: (res) => {
      const code = str(res.tracking_code);
      setTrackingCode(code);
      toast.success("Delivery booked — fee debited and held in escrow.");
      setEstimate(null);
      void qc.invalidateQueries({ queryKey: ["deliveries", "mine"] });
    },
    onError: (e) => toast.error(describe(e)),
  });

  const estFee = estimate ? str(estimate.fee_display) ?? str(estimate.base_fee_display) : null;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Tracking code copied.");
    } catch {
      toast.error("Copy failed — select the code manually.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries"
        subtitle="Send a parcel. Creation IS payment: requesting debits your wallet and holds the fee in escrow."
      />

      {trackingCode && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
          <p className="text-sm text-muted-foreground">Your parcel is booked. Tracking code:</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <code className="text-2xl font-bold tracking-widest">{trackingCode}</code>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => void copyCode(trackingCode)}
            >
              <span className="inline-flex items-center gap-1">
                <Copy className="h-4 w-4" /> Copy
              </span>
            </button>
            <Link to={`/track/${encodeURIComponent(trackingCode)}`} className="text-sm underline">
              Open public tracker
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Anyone with this code can check status — no login needed.
          </p>
        </div>
      )}

      <Card title="New delivery">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Pickup latitude" required>
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="6.5244"
                value={pickupLat}
                onChange={(e) => setPickupLat(e.target.value)}
              />
            </Field>
            <Field label="Pickup longitude" required>
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="3.3792"
                value={pickupLng}
                onChange={(e) => setPickupLng(e.target.value)}
              />
            </Field>
            <Field label="Dropoff latitude" required>
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="6.4311"
                value={dropoffLat}
                onChange={(e) => setDropoffLat(e.target.value)}
              />
            </Field>
            <Field label="Dropoff longitude" required>
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="3.4098"
                value={dropoffLng}
                onChange={(e) => setDropoffLng(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Parcel size" required>
            <select
              className={inputClass}
              value={sizeClass}
              onChange={(e) => setSizeClass(e.target.value as SizeClass)}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          {estimate && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p>
                Estimated fee ({sizeClass}):{" "}
                <Money
                  kobo={num(estimate.fee_kobo)}
                  display={estimate.fee_display}
                  className="font-semibold"
                />
                {typeof estimate.distance_m === "number" && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {(estimate.distance_m / 1000).toFixed(1)} km
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimate equals what you will be charged — the server runs the same math on
                both paths.
              </p>
            </div>
          )}
          {estimateM.error && estimateM.error.message !== "Invalid coordinates." && (
            <ErrorState error={estimateM.error} />
          )}
          {requestM.error && <ErrorState error={requestM.error} />}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={estimateM.isPending}
              onClick={() => estimateM.mutate()}
            >
              {estimateM.isPending ? "Estimating…" : "Get estimate"}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={requestM.isPending}
              onClick={() => {
                if (!parseCoords()) return;
                const fee = estFee ?? "the estimated fee";
                if (
                  window.confirm(
                    `Book this delivery now? Your wallet will be debited ${fee} and the fee held in escrow. A short wallet fails with 400 and nothing is booked.`,
                  )
                ) {
                  requestM.mutate();
                }
              }}
            >
              {requestM.isPending ? "Booking…" : "Confirm & book (pays now)"}
            </button>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My deliveries</h2>
        {mineQ.isLoading && <Loading label="Loading deliveries…" />}
        {mineQ.error && <ErrorState error={mineQ.error} />}
        {mineQ.data && mineQ.data.length === 0 && (
          <EmptyState title="No deliveries yet" hint="Book your first parcel above." />
        )}
        <div className="grid gap-3">
          {mineQ.data?.map((d) => {
            const status = String(d.status);
            const code = str(d.tracking_code);
            return (
              <article key={d.pid} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {code ? (
                        <span className="inline-flex items-center gap-2">
                          <code className="font-mono font-bold tracking-wider">{code}</code>
                          <button
                            type="button"
                            aria-label="Copy tracking code"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => void copyCode(code)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ) : (
                        d.pid.slice(0, 8)
                      )}
                    </span>
                    <Badge tone={statusTone(status)}>{status}</Badge>
                  </div>
                  <Money
                    kobo={num(d["fee_kobo"]) ?? num(d["amount_kobo"])}
                    display={str(d["fee_display"]) ?? str(d["amount_display"])}
                    className="text-sm font-semibold"
                  />
                </div>
                <DeliveryActions pid={d.pid} status={status} />
                <Link
                  to={`/deliveries/${d.pid}`}
                  className="mt-2 inline-block text-xs underline"
                >
                  View details and timeline
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

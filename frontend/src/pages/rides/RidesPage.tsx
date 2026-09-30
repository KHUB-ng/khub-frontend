import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Car } from "lucide-react";
import { ApiError, rides } from "@/api";
import type { Estimate } from "@/api";
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

function shortPid(pid: string): string {
  return pid.length > 8 ? `${pid.slice(0, 8)}…` : pid;
}

/** Cancel / dispute / rate controls for one ride. */
function RideActions({ pid, status }: { pid: string; status: string }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
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

  const cancellable = ["requested", "accepted", "arriving"].includes(status);
  const rateable = status === "completed";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {cancellable && (
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={cancelM.isPending}
          onClick={() => {
            if (window.confirm("Cancel this ride? The escrowed fare is refunded instantly.")) {
              cancelM.mutate();
            }
          }}
        >
          {cancelM.isPending ? "Cancelling…" : "Cancel"}
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

function CoordFields({
  prefix,
  lat,
  lng,
  label,
  onLat,
  onLng,
  onLabel,
}: {
  prefix: string;
  lat: string;
  lng: string;
  label: string;
  onLat: (v: string) => void;
  onLng: (v: string) => void;
  onLabel: (v: string) => void;
}) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-3">
      <Field label={`${prefix} latitude`} required>
        <input
          className={inputClass}
          inputMode="decimal"
          placeholder="6.5244"
          value={lat}
          onChange={(e) => onLat(e.target.value)}
        />
      </Field>
      <Field label={`${prefix} longitude`} required>
        <input
          className={inputClass}
          inputMode="decimal"
          placeholder="3.3792"
          value={lng}
          onChange={(e) => onLng(e.target.value)}
        />
      </Field>
      <Field label={`${prefix} label`}>
        <input
          className={inputClass}
          placeholder="Landmark (optional)"
          value={label}
          onChange={(e) => onLabel(e.target.value)}
        />
      </Field>
    </fieldset>
  );
}

export default function RidesPage() {
  const qc = useQueryClient();
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [pickupLabel, setPickupLabel] = useState("");
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [destLabel, setDestLabel] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const historyQ = useQuery({ queryKey: ["rides", "mine"], queryFn: rides.mine });

  const parseCoords = () => {
    const pLat = Number.parseFloat(pickupLat);
    const pLng = Number.parseFloat(pickupLng);
    const dLat = Number.parseFloat(destLat);
    const dLng = Number.parseFloat(destLng);
    if (![pLat, pLng, dLat, dLng].every((n) => Number.isFinite(n))) {
      toast.error("Enter valid pickup and destination coordinates.");
      return null;
    }
    return {
      pickup: {
        lat: pLat,
        lng: pLng,
        ...(pickupLabel.trim() ? { label: pickupLabel.trim() } : {}),
      },
      dest: {
        lat: dLat,
        lng: dLng,
        ...(destLabel.trim() ? { label: destLabel.trim() } : {}),
      },
    };
  };

  const estimateM = useMutation({
    mutationFn: () => {
      const coords = parseCoords();
      if (!coords) throw new Error("Invalid coordinates.");
      return rides.estimate(coords);
    },
    onSuccess: (est) => setEstimate(est),
    onError: (e) => toast.error(describe(e)),
  });

  const requestM = useMutation({
    mutationFn: () => {
      const coords = parseCoords();
      if (!coords) throw new Error("Invalid coordinates.");
      return rides.requestRide(coords);
    },
    onSuccess: () => {
      toast.success("Ride requested — fare debited and escrowed.");
      setEstimate(null);
      void qc.invalidateQueries({ queryKey: ["rides", "mine"] });
    },
    onError: (e) => toast.error(describe(e)),
  });

  const estFare = estimate ? str(estimate.fare_display) ?? str(estimate.base_fare_display) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rides"
        subtitle="Request a ride. Creation IS payment: requesting debits your wallet and escrows the fare in one transaction."
      />

      <Card title="New ride">
        <div className="space-y-4">
          <CoordFields
            prefix="Pickup"
            lat={pickupLat}
            lng={pickupLng}
            label={pickupLabel}
            onLat={setPickupLat}
            onLng={setPickupLng}
            onLabel={setPickupLabel}
          />
          <CoordFields
            prefix="Destination"
            lat={destLat}
            lng={destLng}
            label={destLabel}
            onLat={setDestLat}
            onLng={setDestLng}
            onLabel={setDestLabel}
          />
          {estimate && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p>
                Estimated fare:{" "}
                <Money
                  kobo={num(estimate.fare_kobo)}
                  display={estimate.fare_display}
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
                The server ignores any client-sent fare — this quote is what you will be
                charged.
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
                const fare = estFare ?? "the estimated fare";
                if (
                  window.confirm(
                    `Request this ride now? Your wallet will be debited ${fare} and the fare escrowed. A short wallet fails with 400 and nothing is booked.`,
                  )
                ) {
                  requestM.mutate();
                }
              }}
            >
              {requestM.isPending ? "Requesting…" : "Confirm & request (pays now)"}
            </button>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My rides</h2>
        {historyQ.isLoading && <Loading label="Loading rides…" />}
        {historyQ.error && <ErrorState error={historyQ.error} />}
        {historyQ.data && historyQ.data.length === 0 && (
          <EmptyState title="No rides yet" hint="Request your first ride above." />
        )}
        <div className="grid gap-3">
          {historyQ.data?.map((r) => {
            const status = String(r.status);
            return (
              <article key={r.pid} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <Link
                      to={`/rides/${r.pid}`}
                      className="text-sm font-medium hover:underline"
                    >
                      Ride {shortPid(r.pid)}
                    </Link>
                    <Badge tone={statusTone(status)}>{status}</Badge>
                  </div>
                  <Money
                    kobo={num(r["fare_kobo"]) ?? num(r["amount_kobo"])}
                    display={str(r["fare_display"]) ?? str(r["amount_display"])}
                    className="text-sm font-semibold"
                  />
                </div>
                {(str(r["pickup_label"]) ?? str(r["dest_label"])) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[str(r["pickup_label"]), str(r["dest_label"])]
                      .filter((x): x is string => x !== null)
                      .join(" → ")}
                  </p>
                )}
                <RideActions pid={r.pid} status={status} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

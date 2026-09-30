import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { deliveries } from "@/api";
import {
  Badge,
  Card,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  buttonClass,
  inputClass,
  statusTone,
} from "@/components/ui/primitives";

const TRACK_STEPS = ["requested", "accepted", "picked_up", "in_transit", "delivered"] as const;

export default function TrackerPage() {
  const { code = "" } = useParams();
  const [input, setInput] = useState(code);
  const [lookup, setLookup] = useState(code);

  const trackQ = useQuery({
    queryKey: ["deliveries", "public", lookup],
    queryFn: () => deliveries.publicTracker(lookup),
    enabled: lookup.trim().length > 0,
    retry: false,
  });

  const idx = trackQ.data
    ? TRACK_STEPS.indexOf(trackQ.data.status as (typeof TRACK_STEPS)[number])
    : -1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track a parcel"
        subtitle="Public tracker — no login needed. Enter the 10-character tracking code from your receipt."
      />

      <Card title="Look up">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setLookup(input.trim());
          }}
        >
          <div className="min-w-52 flex-1">
            <Field label="Tracking code" required>
              <input
                className={`${inputClass} font-mono uppercase`}
                placeholder="AB12CD34EF"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </Field>
          </div>
          <button type="submit" className={buttonClass}>
            Track
          </button>
        </form>
      </Card>

      {lookup.trim().length === 0 && (
        <p className="text-sm text-muted-foreground">
          Tip: open <code>/track/:code</code> directly — e.g. after booking, the receipt
          links here.
        </p>
      )}

      {lookup.trim().length > 0 && trackQ.isLoading && <Loading label="Looking up parcel…" />}
      {lookup.trim().length > 0 && trackQ.error && <ErrorState error={trackQ.error} />}

      {trackQ.data && (
        <Card title={`Parcel ${trackQ.data.tracking_code}`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone={statusTone(trackQ.data.status)}>{trackQ.data.status}</Badge>
              <span className="text-xs text-muted-foreground">
                Size: {trackQ.data.size_class}
              </span>
            </div>
            <ol className="flex flex-wrap items-center gap-2">
              {TRACK_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      idx !== -1 && i < idx
                        ? "bg-emerald-500/20 text-emerald-500"
                        : i === idx
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs">{s.replace("_", " ")}</span>
                  {i < TRACK_STEPS.length - 1 && (
                    <span className="mx-1 text-muted-foreground">→</span>
                  )}
                </li>
              ))}
            </ol>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Booked</dt>
                <dd>{trackQ.data.created_at}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last update</dt>
                <dd>{trackQ.data.updated_at}</dd>
              </div>
            </dl>
            <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Privacy note: this public tracker deliberately shows only status, parcel
              size, and timestamps. Names, phone numbers, addresses, coordinates, and
              payment details are never exposed here — the full details stay behind
              login for the sender, the assigned agent, and admins.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

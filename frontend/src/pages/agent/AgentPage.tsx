import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, agent } from "@/api";
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

const ONBOARDING_STEPS = [
  "Apply as a logistics agent",
  "Submit KYC documents",
  "Admin approves KYC",
  "Admin verifies agent profile",
] as const;

function AgentLifecycle({
  pid,
  status,
  onDone,
}: {
  pid: string;
  status: string;
  onDone: () => void;
}) {
  const acceptM = useMutation({
    mutationFn: () => agent.accept(pid),
    onSuccess: () => {
      toast.success("Delivery accepted — first agent wins.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const pickupM = useMutation({
    mutationFn: () => agent.pickup(pid),
    onSuccess: () => {
      toast.success("Parcel picked up.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const transitM = useMutation({
    mutationFn: () => agent.transit(pid),
    onSuccess: () => {
      toast.success("Parcel in transit.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const completeM = useMutation({
    mutationFn: () => agent.complete(pid),
    onSuccess: () => {
      toast.success("Delivery completed — fee released to your wallet.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {status === "requested" && (
        <button
          type="button"
          className={buttonClass}
          disabled={acceptM.isPending}
          onClick={() => {
            if (window.confirm("Accept this delivery? First agent to accept wins it.")) {
              acceptM.mutate();
            }
          }}
        >
          {acceptM.isPending ? "Accepting…" : "Accept"}
        </button>
      )}
      {status === "accepted" && (
        <button
          type="button"
          className={buttonClass}
          disabled={pickupM.isPending}
          onClick={() => pickupM.mutate()}
        >
          {pickupM.isPending ? "Updating…" : "Pick up"}
        </button>
      )}
      {status === "picked_up" && (
        <button
          type="button"
          className={buttonClass}
          disabled={transitM.isPending}
          onClick={() => transitM.mutate()}
        >
          {transitM.isPending ? "Updating…" : "Mark in transit"}
        </button>
      )}
      {status === "in_transit" && (
        <button
          type="button"
          className={buttonClass}
          disabled={completeM.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Complete this delivery? The held fee is released to your wallet.",
              )
            ) {
              completeM.mutate();
            }
          }}
        >
          {completeM.isPending ? "Completing…" : "Complete delivery"}
        </button>
      )}
    </div>
  );
}

export default function AgentPage() {
  const qc = useQueryClient();
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [nearLat, setNearLat] = useState("");
  const [nearLng, setNearLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");

  const meQ = useQuery({ queryKey: ["agent", "me"], queryFn: agent.me, retry: false });
  const meMissing = meQ.error instanceof ApiError && meQ.error.status === 404;
  const meForbidden = meQ.error instanceof ApiError && meQ.error.isForbidden;

  // GET /api/agent/{pid}/rating — the public aggregate for an agent profile.
  const meRecord =
    meQ.data && typeof meQ.data === "object"
      ? (meQ.data as Record<string, unknown>)
      : null;
  const myPid = typeof meRecord?.["pid"] === "string" ? meRecord["pid"] : undefined;
  const ratingQ = useQuery({
    queryKey: ["agent", "rating", myPid],
    queryFn: () => agent.rating(myPid!),
    enabled: Boolean(myPid),
  });

  const nearLatN = Number.parseFloat(nearLat);
  const nearLngN = Number.parseFloat(nearLng);
  const nearValid =
    (!nearLat.trim() && !nearLng.trim()) ||
    (Number.isFinite(nearLatN) && Number.isFinite(nearLngN));

  const boardQ = useQuery({
    queryKey: ["agent", "requests", nearLat, nearLng, radiusKm],
    queryFn: () =>
      agent.requests(
        nearValid && nearLat.trim() && nearLng.trim()
          ? {
              near_lat: nearLatN,
              near_lng: nearLngN,
              r_km: Number.parseFloat(radiusKm) || undefined,
            }
          : undefined,
      ),
    enabled: meQ.isSuccess,
    refetchInterval: 15_000,
  });
  const myQ = useQuery({
    queryKey: ["agent", "deliveries"],
    queryFn: agent.deliveries,
    enabled: meQ.isSuccess,
  });
  const earningsQ = useQuery({
    queryKey: ["agent", "earnings"],
    queryFn: agent.earnings,
    enabled: meQ.isSuccess,
  });

  const applyM = useMutation({
    mutationFn: () =>
      agent.apply({
        vehicle_type: vehicleType.trim(),
        vehicle_number: vehicleNumber.trim(),
        license_number: licenseNumber.trim(),
      }),
    onSuccess: () => {
      toast.success("Agent application submitted — next: KYC, then admin verification.");
      setVehicleType("");
      setVehicleNumber("");
      setLicenseNumber("");
      void qc.invalidateQueries({ queryKey: ["agent", "me"] });
    },
    onError: (e) => toast.error(describe(e)),
  });

  const renderProfile = () => {
    if (meQ.data === null || typeof meQ.data !== "object") return null;
    const rec = meQ.data as Record<string, unknown>;
    return (
      <>
        <Card title="My agent profile">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={statusTone(String(rec["status"] ?? "unknown"))}>
              {String(rec["status"] ?? "unknown")}
            </Badge>
            {str(rec["vehicle_type"]) && (
              <span className="text-muted-foreground">{str(rec["vehicle_type"])}</span>
            )}
            {str(rec["vehicle_number"]) && (
              <span className="text-muted-foreground">{str(rec["vehicle_number"])}</span>
            )}
          </div>
        </Card>

        {myPid && (
          <Card title="My rating">
            {ratingQ.isLoading && <Loading label="Loading rating…" />}
            {ratingQ.data && (
              <p className="text-sm">
                <span className="text-2xl font-semibold">
                  {ratingQ.data.avg.toFixed(1)}
                </span>
                <span className="text-muted-foreground"> / 5</span>
                <span className="ml-3 text-muted-foreground">
                  from {ratingQ.data.count}{" "}
                  {ratingQ.data.count === 1 ? "rating" : "ratings"}
                </span>
              </p>
            )}
            {ratingQ.data && ratingQ.data.count === 0 && (
              <p className="text-sm text-muted-foreground">
                No ratings yet. Senders rate after a completed delivery.
              </p>
            )}
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery agent"
        subtitle="Accept nearby parcel requests and track your earnings."
      />

      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-muted-foreground">
        Live push is not available in the browser: the agent socket accepts the token via
        header only, which browsers cannot set on a WebSocket. This board polls{" "}
        <code>agent.requests</code> every 15s instead — live push arrives once the backend
        accepts <code>?token=</code>.
      </div>

      {meQ.isLoading && <Loading label="Loading agent profile…" />}
      {meQ.error && !meMissing && !meForbidden && <ErrorState error={meQ.error} />}
      {(meMissing || meForbidden) && (
        <Card title="Get verified to deliver">
          <p className="text-sm text-muted-foreground">
            {meMissing
              ? "You have no agent profile yet — apply below to start the chain."
              : `Your profile is not deliverable yet (${describe(meQ.error)}). Complete the remaining steps.`}
          </p>
          <ol className="mt-3 space-y-2">
            {ONBOARDING_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            A 403 here means one of the middle steps is still pending — apply below, then
            complete KYC under Profile before an admin can verify you.
          </p>
        </Card>
      )}
      {meQ.data !== undefined && !meQ.error && renderProfile()}

      <Card title="Apply as an agent">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!vehicleType.trim() || !vehicleNumber.trim() || !licenseNumber.trim()) {
              toast.error("Vehicle type, vehicle number, and license number are required.");
              return;
            }
            applyM.mutate();
          }}
        >
          <Field label="Vehicle type" required>
            <input
              className={inputClass}
              placeholder="Motorbike"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
          </Field>
          <Field label="Vehicle number" required>
            <input
              className={inputClass}
              placeholder="ABC-123-XY"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </Field>
          <Field label="License number" required>
            <input
              className={inputClass}
              placeholder="Rider's permit no."
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </Field>
          <div className="sm:col-span-3">
            <button type="submit" className={buttonClass} disabled={applyM.isPending}>
              {applyM.isPending ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
        {applyM.error && <ErrorState error={applyM.error} />}
      </Card>

      {earningsQ.data && (
        <Card title="Earnings">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Lifetime</p>
              <Money
                kobo={earningsQ.data.lifetime_kobo}
                display={earningsQ.data.lifetime_display}
                className="text-xl font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <Money kobo={earningsQ.data.today_kobo} className="text-lg font-medium" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
              <Money kobo={earningsQ.data.last_7_days_kobo} className="text-lg font-medium" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trips</p>
              <p className="text-lg font-medium">{earningsQ.data.trips}</p>
            </div>
          </div>
          {earningsQ.data.recent.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {earningsQ.data.recent.map((r) => (
                <li key={r.ref_pid} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {r.ref_pid.slice(0, 8)} · {r.at}
                  </span>
                  <Money kobo={r.amount_kobo} display={r.amount_display} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Open requests</h2>
        <Card title="Nearby filter">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Near latitude" hint="Leave blank for the full board">
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="6.5244"
                value={nearLat}
                onChange={(e) => setNearLat(e.target.value)}
              />
            </Field>
            <Field label="Near longitude">
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="3.3792"
                value={nearLng}
                onChange={(e) => setNearLng(e.target.value)}
              />
            </Field>
            <Field label="Radius (km)">
              <input
                className={inputClass}
                inputMode="decimal"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
              />
            </Field>
          </div>
          {!nearValid && (
            <p className="mt-2 text-xs text-destructive">
              Invalid coordinates — showing the unfiltered board.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Filtered boards return only pickups within range, nearest first. Polls every
            15s.
          </p>
        </Card>
        {boardQ.isLoading && <Loading label="Loading requests…" />}
        {boardQ.error && <ErrorState error={boardQ.error} />}
        {boardQ.data && boardQ.data.length === 0 && (
          <EmptyState title="No open requests" hint="New parcels appear here as senders book." />
        )}
        <div className="grid gap-3">
          {boardQ.data?.map((d) => (
            <article key={d.pid} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone(String(d.status))}>{String(d.status)}</Badge>
                  {str(d["size_class"]) && (
                    <span className="text-xs text-muted-foreground">
                      {str(d["size_class"])}
                    </span>
                  )}
                </div>
                <Money
                  kobo={num(d["fee_kobo"])}
                  display={str(d["fee_display"])}
                  className="text-sm font-semibold"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Parcel {d.pid.slice(0, 8)}…
              </p>
              <AgentLifecycle
                pid={d.pid}
                status={String(d.status)}
                onDone={() => {
                  void qc.invalidateQueries({ queryKey: ["agent"] });
                }}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My deliveries</h2>
        {myQ.isLoading && <Loading label="Loading deliveries…" />}
        {myQ.error && <ErrorState error={myQ.error} />}
        {myQ.data && myQ.data.length === 0 && (
          <EmptyState title="No deliveries yet" hint="Accepted parcels show up here." />
        )}
        <div className="grid gap-3">
          {myQ.data?.map((d) => (
            <article key={d.pid} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={statusTone(String(d.status))}>{String(d.status)}</Badge>
                <Money
                  kobo={num(d["fee_kobo"])}
                  display={str(d["fee_display"])}
                  className="text-sm font-semibold"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Parcel {d.pid.slice(0, 8)}…
              </p>
              <AgentLifecycle
                pid={d.pid}
                status={String(d.status)}
                onDone={() => {
                  void qc.invalidateQueries({ queryKey: ["agent"] });
                }}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

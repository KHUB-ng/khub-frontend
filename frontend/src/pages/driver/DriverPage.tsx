import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, driver } from "@/api";
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
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const ONBOARDING_STEPS = [
  "Apply as a driver",
  "Submit KYC documents",
  "Admin approves KYC",
  "Admin verifies driver profile",
] as const;

function OnboardingGate({ reason }: { reason: string }) {
  return (
    <Card title="Get verified to drive">
      <p className="text-sm text-muted-foreground">{reason}</p>
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
  );
}

function DriverLifecycle({
  pid,
  status,
  onDone,
}: {
  pid: string;
  status: string;
  onDone: () => void;
}) {
  const acceptM = useMutation({
    mutationFn: () => driver.accept(pid),
    onSuccess: () => {
      toast.success("Ride accepted — first driver wins.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const arrivingM = useMutation({
    mutationFn: () => driver.arriving(pid),
    onSuccess: () => {
      toast.success("Marked as arriving.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const startM = useMutation({
    mutationFn: () => driver.start(pid),
    onSuccess: () => {
      toast.success("Trip started.");
      onDone();
    },
    onError: (e) => toast.error(describe(e)),
  });
  const completeM = useMutation({
    mutationFn: () => driver.complete(pid),
    onSuccess: () => {
      toast.success("Trip completed — fare released to your wallet.");
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
            if (window.confirm("Accept this ride? First driver to accept wins it.")) {
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
          disabled={arrivingM.isPending}
          onClick={() => arrivingM.mutate()}
        >
          {arrivingM.isPending ? "Updating…" : "I'm arriving"}
        </button>
      )}
      {status === "arriving" && (
        <button
          type="button"
          className={buttonClass}
          disabled={startM.isPending}
          onClick={() => startM.mutate()}
        >
          {startM.isPending ? "Starting…" : "Start trip"}
        </button>
      )}
      {status === "started" && (
        <button
          type="button"
          className={buttonClass}
          disabled={completeM.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Complete this trip? The escrowed fare is released to your wallet.",
              )
            ) {
              completeM.mutate();
            }
          }}
        >
          {completeM.isPending ? "Completing…" : "Complete trip"}
        </button>
      )}
    </div>
  );
}

export default function DriverPage() {
  const qc = useQueryClient();
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [nearLat, setNearLat] = useState("");
  const [nearLng, setNearLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");

  const meQ = useQuery({ queryKey: ["driver", "me"], queryFn: driver.me, retry: false });
  const meMissing = meQ.error instanceof ApiError && meQ.error.status === 404;
  const meForbidden = meQ.error instanceof ApiError && meQ.error.isForbidden;

  // GET /api/driver/{pid}/rating — the public aggregate for a driver profile.
  const myPid = meQ.data?.pid;
  const ratingQ = useQuery({
    queryKey: ["driver", "rating", myPid],
    queryFn: () => driver.rating(myPid!),
    enabled: Boolean(myPid),
  });

  const near =
    nearLat.trim() && nearLng.trim()
      ? {
          near_lat: Number.parseFloat(nearLat),
          near_lng: Number.parseFloat(nearLng),
          r_km: Number.parseFloat(radiusKm) || undefined,
        }
      : undefined;
  const nearValid =
    !near || (Number.isFinite(near.near_lat) && Number.isFinite(near.near_lng));

  const boardQ = useQuery({
    queryKey: ["driver", "requests", nearLat, nearLng, radiusKm],
    queryFn: () =>
      driver.requests(
        nearValid && near
          ? { near_lat: near.near_lat, near_lng: near.near_lng, r_km: near.r_km }
          : undefined,
      ),
    enabled: meQ.isSuccess,
    refetchInterval: 15_000,
  });
  const myRidesQ = useQuery({
    queryKey: ["driver", "rides"],
    queryFn: driver.rides,
    enabled: meQ.isSuccess,
  });
  const earningsQ = useQuery({
    queryKey: ["driver", "earnings"],
    queryFn: driver.earnings,
    enabled: meQ.isSuccess,
  });

  const applyM = useMutation({
    mutationFn: () =>
      driver.apply({
        vehicle_type: vehicleType.trim(),
        vehicle_number: vehicleNumber.trim(),
        license_number: licenseNumber.trim(),
      }),
    onSuccess: () => {
      toast.success("Driver application submitted — next: KYC, then admin verification.");
      setVehicleType("");
      setVehicleNumber("");
      setLicenseNumber("");
      void qc.invalidateQueries({ queryKey: ["driver", "me"] });
    },
    onError: (e) => toast.error(describe(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver"
        subtitle="Accept nearby ride requests and track your earnings."
      />

      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-muted-foreground">
        Live push is not available in the browser: the driver socket accepts the token via
        header only, which browsers cannot set on a WebSocket. This board polls{" "}
        <code>driver.requests</code> every 15s instead — live push arrives once the
        backend accepts <code>?token=</code>.
      </div>

      {meQ.isLoading && <Loading label="Loading driver profile…" />}
      {meQ.error && !meMissing && !meForbidden && <ErrorState error={meQ.error} />}
      {(meMissing || meForbidden) && (
        <OnboardingGate
          reason={
            meMissing
              ? "You have no driver profile yet — apply below to start the chain."
              : `Your profile is not driveable yet (${describe(meQ.error)}). Complete the remaining steps.`
          }
        />
      )}

      {meQ.data && (
        <Card title="My driver profile">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={statusTone(String(meQ.data.status))}>
              {String(meQ.data.status)}
            </Badge>
            {str(meQ.data["vehicle_type"]) && (
              <span className="text-muted-foreground">{str(meQ.data["vehicle_type"])}</span>
            )}
            {str(meQ.data["vehicle_number"]) && (
              <span className="text-muted-foreground">{str(meQ.data["vehicle_number"])}</span>
            )}
          </div>
        </Card>
      )}

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
              No ratings yet. Riders rate after a completed trip.
            </p>
          )}
        </Card>
      )}

      <Card title="Apply as a driver">
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
              placeholder="Sedan"
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
              placeholder="Driver's license no."
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
          <EmptyState title="No open requests" hint="New requests appear here as riders book." />
        )}
        <div className="grid gap-3">
          {boardQ.data?.map((r) => (
            <article key={r.pid} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={statusTone(String(r.status))}>{String(r.status)}</Badge>
                <Money
                  kobo={num(r["fare_kobo"])}
                  display={str(r["fare_display"])}
                  className="text-sm font-semibold"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Ride {r.pid.slice(0, 8)}…</p>
              <DriverLifecycle
                pid={r.pid}
                status={String(r.status)}
                onDone={() => {
                  void qc.invalidateQueries({ queryKey: ["driver"] });
                }}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My trips</h2>
        {myRidesQ.isLoading && <Loading label="Loading trips…" />}
        {myRidesQ.error && <ErrorState error={myRidesQ.error} />}
        {myRidesQ.data && myRidesQ.data.length === 0 && (
          <EmptyState title="No trips yet" hint="Accepted rides show up here." />
        )}
        <div className="grid gap-3">
          {myRidesQ.data?.map((r) => (
            <article key={r.pid} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={statusTone(String(r.status))}>{String(r.status)}</Badge>
                <Money
                  kobo={num(r["fare_kobo"])}
                  display={str(r["fare_display"])}
                  className="text-sm font-semibold"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Ride {r.pid.slice(0, 8)}…</p>
              <DriverLifecycle
                pid={r.pid}
                status={String(r.status)}
                onDone={() => {
                  void qc.invalidateQueries({ queryKey: ["driver"] });
                }}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

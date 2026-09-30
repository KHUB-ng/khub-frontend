import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { deliveries } from "@/api";
import type { DeliveryResponse, PublicTracker } from "@/api";
import OpenStreetMap from "../components/Map/OpenStreetMap";
import { Truck, MapPin, Package, Clock, Navigation, Search } from "lucide-react";
import { toast } from "sonner";

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const ACTIVE = new Set(["requested", "accepted", "picked_up", "in_transit", "disputed"]);

/**
 * Logistics against the REST backend (`GET /api/deliveries/mine`,
 * `GET /api/deliveries/{pid}`, `POST /{pid}/cancel|dispute|rate`, public
 * tracker `GET /api/deliveries/public/{code}` — no auth).
 *
 * Live driver tracking is a known backend gap: `GET /deliveries/{pid}/track`
 * is a header-only WebSocket a browser cannot open, so this page polls the
 * delivery status on an interval and shows the public-tracker state
 * instead of pretending to be live. New bookings go through the booking
 * widget (`LogisticBooking`), which calls `deliveries.estimate` +
 * `deliveries.requestDelivery` (creation IS payment — fee escrowed,
 * short wallet → 400).
 */
export default function Logistics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [trackerCode, setTrackerCode] = useState("");
  const [tracker, setTracker] = useState<PublicTracker | null>(null);
  const [tracking, setTracking] = useState(false);
  const [acting, setActing] = useState(false);

  const mineQuery = useQuery({
    queryKey: ["deliveries-mine"],
    queryFn: () => deliveries.mine(),
    enabled: !!user,
    refetchInterval: 20_000,
  });

  const selectedQuery = useQuery({
    queryKey: ["delivery", selectedPid],
    queryFn: () => deliveries.get(selectedPid as string),
    enabled: !!selectedPid,
    refetchInterval: 20_000,
  });

  const mine: DeliveryResponse[] = mineQuery.data ?? [];
  const active = mine.filter((d) => ACTIVE.has(String(d.status)));
  const selected: DeliveryResponse | null = selectedQuery.data ?? null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["deliveries-mine"] });
    if (selectedPid) queryClient.invalidateQueries({ queryKey: ["delivery", selectedPid] });
  };

  const trackCode = async () => {
    const code = trackerCode.trim();
    if (!code) {
      toast.error("Enter a tracking code");
      return;
    }
    setTracking(true);
    try {
      const res = await deliveries.publicTracker(code);
      setTracker(res);
    } catch (err) {
      setTracker(null);
      toast.error(errMsg(err, "Tracking code not found"));
    } finally {
      setTracking(false);
    }
  };

  const cancel = async (pid: string) => {
    if (!window.confirm("Cancel this delivery? Pre-pickup orders are refunded.")) return;
    setActing(true);
    try {
      await deliveries.cancel(pid);
      toast.success("Delivery cancelled.");
      refresh();
    } catch (err) {
      toast.error(errMsg(err, "Cancel failed"));
    } finally {
      setActing(false);
    }
  };

  const dispute = async (pid: string) => {
    if (!window.confirm("Dispute this delivery? Funds will be frozen for admin review.")) return;
    setActing(true);
    try {
      await deliveries.dispute(pid);
      toast.success("Dispute filed. Admin will review within 24-48 hours.");
      refresh();
    } catch (err) {
      toast.error(errMsg(err, "Dispute failed"));
    } finally {
      setActing(false);
    }
  };

  const mapMarkers: Array<{ position: [number, number]; title: string; description?: string }> = [];
  const pickup = (selected as unknown as { pickup?: { lat?: number; lng?: number; label?: string } } | null)?.pickup;
  const dropoff = (selected as unknown as { dropoff?: { lat?: number; lng?: number; label?: string } } | null)?.dropoff;
  if (pickup && typeof pickup.lat === "number" && typeof pickup.lng === "number") {
    mapMarkers.push({ position: [pickup.lat, pickup.lng], title: "Pickup", description: pickup.label });
  }
  if (dropoff && typeof dropoff.lat === "number" && typeof dropoff.lng === "number") {
    mapMarkers.push({ position: [dropoff.lat, dropoff.lng], title: "Dropoff", description: dropoff.label });
  }
  const center: [number, number] =
    mapMarkers.length > 0 ? mapMarkers[0].position : [9.081999, 8.675277];

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-6">Logistics &amp; Delivery</h1>

      {/* Public tracker — no auth needed */}
      <div className="card p-4 mb-8">
        <h2 className="font-semibold mb-3">Track a parcel</h2>
        <div className="flex gap-2">
          <input
            value={trackerCode}
            onChange={(e) => setTrackerCode(e.target.value)}
            className="input-field flex-1"
            placeholder="Tracking code (e.g. ABCDEF1234)"
          />
          <button onClick={trackCode} disabled={tracking} className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            {tracking ? "Tracking..." : "Track"}
          </button>
        </div>
        {tracker && (
          <div className="mt-3 text-sm space-y-1">
            <p><span className="font-semibold">Code:</span> {tracker.tracking_code}</p>
            <p><span className="font-semibold">Status:</span> {tracker.status.replace(/_/g, " ")}</p>
            <p><span className="font-semibold">Size:</span> {tracker.size_class}</p>
            <p className="text-gray-500">Updated {new Date(tracker.updated_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="order-2 lg:order-1">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h3 className="font-semibold mb-1">Delivery {selected.tracking_code ?? `#${selected.pid.slice(0, 8)}`}</h3>
              <p className="text-xs text-gray-500 mb-3">Status refreshes automatically.</p>
              <OpenStreetMap
                center={center}
                zoom={13}
                markers={mapMarkers}
                showRoute={mapMarkers.length === 2}
                routePoints={mapMarkers.length === 2 ? [mapMarkers[0].position, mapMarkers[1].position] : []}
                height="500px"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => cancel(selected.pid)}
                  disabled={acting}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => dispute(selected.pid)}
                  disabled={acting}
                  className="flex-1 btn-secondary"
                >
                  Dispute
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-2xl h-[500px] flex items-center justify-center">
              <p className="text-gray-500">Select a delivery to track</p>
            </div>
          )}
        </div>

        {/* Active Deliveries */}
        <div className="order-1 lg:order-2">
          <h2 className="text-xl font-semibold mb-4">Active Deliveries</h2>

          {mineQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : active.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No active deliveries
            </div>
          ) : (
            <div className="space-y-4">
              {active.map((delivery) => (
                <button
                  key={delivery.pid}
                  onClick={() => setSelectedPid(delivery.pid)}
                  className={`card p-4 w-full text-left transition ${
                    selectedPid === delivery.pid ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <span className="font-semibold">
                        #{delivery.tracking_code ?? delivery.pid.slice(0, 8)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      delivery.status === "accepted" ? "bg-blue-100 text-blue-600" :
                      delivery.status === "picked_up" ? "bg-yellow-100 text-yellow-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {String(delivery.status).replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>Pickup: {(delivery as unknown as { pickup_label?: string }).pickup_label ?? "Selected"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Navigation className="w-4 h-4" />
                      <span>Dropoff: {(delivery as unknown as { dropoff_label?: string }).dropoff_label ?? "Awaiting"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Est. delivery: 30-45 mins</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-primary font-bold">
                      {(delivery as unknown as { fee_display?: string }).fee_display ?? ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {mine.length > active.length && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Past deliveries
              </h3>
              <div className="space-y-2">
                {mine.filter((d) => !ACTIVE.has(String(d.status))).slice(0, 5).map((d) => (
                  <button
                    key={d.pid}
                    onClick={() => setSelectedPid(d.pid)}
                    className="card p-3 w-full text-left text-sm"
                  >
                    <span className="font-semibold">#{d.tracking_code ?? d.pid.slice(0, 8)}</span>
                    <span className="text-gray-500 ml-2">{String(d.status).replace(/_/g, " ")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

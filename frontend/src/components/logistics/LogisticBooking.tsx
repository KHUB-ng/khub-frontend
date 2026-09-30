import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { deliveries, rides, wallet as walletApi, ApiError } from "@/api";
import type { DeliveryResponse, Estimate, RideResponse, SizeClass } from "@/api";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Car, Bike, Truck, Navigation, MapPin,
  Clock, CheckCircle, Loader2, LocateFixed,
} from "lucide-react";
import { toast } from "sonner";

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type ServiceType = "ride" | "delivery";

interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

function shortWallet(err: unknown): boolean {
  return err instanceof ApiError && err.status === 400;
}

/**
 * Booking widget against the REST backend.
 *
 * - Fares/fees always come from the server: `rides.estimate` /
 *   `deliveries.estimate` (client math is ignored by the backend).
 * - Creation IS payment: `rides.requestRide` / `deliveries.requestDelivery`
 *   debit the wallet into escrow in the same transaction. Short wallet →
 *   400 with zero rows → "fund your wallet".
 * - The old driver-location board is REST-authoritative with no browser
 *   live feed, so this widget confirms the booking (with `tracking_code`)
 *   instead of simulating driver assignment.
 */
export const LogisticsBooking: React.FC = () => {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState<ServiceType>("ride");
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [dropoff, setDropoff] = useState<LocationPoint | null>(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTarget, setSearchTarget] = useState<"pickup" | "dropoff">("pickup");
  const [searching, setSearching] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [sizeClass, setSizeClass] = useState<SizeClass>("small");
  const [bookingStep, setBookingStep] = useState<"location" | "details" | "confirm">("location");
  const [loading, setLoading] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [packageNotes, setPackageNotes] = useState("");
  const [confirmed, setConfirmed] = useState<RideResponse | DeliveryResponse | null>(null);
  const [balanceDisplay, setBalanceDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    walletApi.get().then((w) => setBalanceDisplay(w.balance_display)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!pickup || !dropoff) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimating(true);
    const run = async () => {
      try {
        const est =
          serviceType === "ride"
            ? await rides.estimate({
                pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.address },
                dest: { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.address },
              })
            : await deliveries.estimate({
                pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.address },
                dropoff: { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.address },
                size_class: sizeClass,
              });
        if (!cancelled) setEstimate(est);
      } catch (err) {
        if (!cancelled) {
          setEstimate(null);
          toast.error(errMsg(err, "Could not estimate this trip"));
        }
      } finally {
        if (!cancelled) setEstimating(false);
      }
    };
    const t = window.setTimeout(() => void run(), 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pickup, dropoff, serviceType, sizeClass]);

  const searchLocation = async (query: string, target: "pickup" | "dropoff") => {
    if (!query.trim()) return;
    setSearchTarget(target);
    setSearching(true);
    try {
      // Public geocoder — address lookup only, never used for money math.
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Nigeria&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data);
    } catch {
      toast.error("Location search failed");
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (result: any, type: "pickup" | "dropoff") => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
    };
    if (type === "pickup") {
      setPickup(location);
      setPickupQuery(result.display_name);
    } else {
      setDropoff(location);
      setDropoffQuery(result.display_name);
    }
    setSearchResults([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: "Your current location",
        };
        setPickup(loc);
        setPickupQuery(loc.address);
      },
      () => toast.error("Could not read your location"),
    );
  };

  const confirmBooking = async () => {
    if (!pickup || !dropoff) {
      toast.error("Enter pickup and dropoff locations");
      return;
    }
    const fare = estimate?.fare_display ?? estimate?.fee_display;
    if (!window.confirm(`Confirm ${serviceType} for ${fare ?? "the quoted fare"}? Payment is held in escrow.`)) return;
    setLoading(true);
    try {
      if (serviceType === "ride") {
        const ride = await rides.requestRide({
          pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.address },
          dest: { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.address },
        });
        setConfirmed(ride);
      } else {
        const delivery = await deliveries.requestDelivery({
          pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.address },
          dropoff: { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.address },
          size_class: sizeClass,
        });
        setConfirmed(delivery);
      }
      toast.success(
        `${serviceType === "ride" ? "Ride" : "Delivery"} booked! Payment held in escrow.${specialInstructions || packageNotes ? "" : ""}`,
      );
      setBookingStep("confirm");
      walletApi.get().then((w) => setBalanceDisplay(w.balance_display)).catch(() => {});
    } catch (err) {
      if (shortWallet(err)) {
        toast.error("Insufficient wallet balance — fund your wallet and try again.");
      } else {
        toast.error(errMsg(err, `Failed to book ${serviceType}`));
      }
    } finally {
      setLoading(false);
    }
  };

  const fareDisplay = estimate?.fare_display ?? estimate?.fee_display ?? null;

  const reset = () => {
    setBookingStep("location");
    setConfirmed(null);
    setPickup(null);
    setDropoff(null);
    setPickupQuery("");
    setDropoffQuery("");
    setEstimate(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Booking Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Service Type Toggle */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-2">
              <button
                onClick={() => { setServiceType("ride"); setBookingStep("location"); }}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  serviceType === "ride"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Car className="w-4 h-4 inline mr-2" />
                Ride
              </button>
              <button
                onClick={() => { setServiceType("delivery"); setBookingStep("location"); }}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  serviceType === "delivery"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Truck className="w-4 h-4 inline mr-2" />
                Delivery
              </button>
            </div>
            {balanceDisplay && (
              <p className="text-xs text-gray-500 mt-2">Wallet: {balanceDisplay}</p>
            )}
          </div>

          {/* Location Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-4">Where are you going?</h3>

            {/* Pickup Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pickup Location</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={pickupQuery}
                    onChange={(e) => {
                      setPickupQuery(e.target.value);
                      setPickup(null);
                      void searchLocation(e.target.value, "pickup");
                    }}
                    onFocus={() => setSearchTarget("pickup")}
                    placeholder="Enter pickup location"
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={useCurrentLocation}
                  className="px-3 py-2 border rounded-md hover:bg-gray-50"
                  title="Use current location"
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Dropoff Location</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={dropoffQuery}
                  onChange={(e) => {
                    setDropoffQuery(e.target.value);
                    setDropoff(e.target.value ? dropoff : null);
                    void searchLocation(e.target.value, "dropoff");
                  }}
                  onFocus={() => setSearchTarget("dropoff")}
                  placeholder="Enter destination"
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searching && <p className="px-4 py-2 text-xs text-gray-500">Searching…</p>}
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectLocation(result, searchTarget)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium">{result.display_name.split(",")[0]}</p>
                    <p className="text-xs text-gray-500">{result.display_name}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Parcel size (deliveries only — server prices by size_class) */}
            {serviceType === "delivery" && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Parcel size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["small", "medium", "large"] as SizeClass[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSizeClass(s)}
                      className={`p-2 border rounded-md text-center text-sm capitalize transition-colors ${
                        sizeClass === s
                          ? "border-primary-500 bg-primary-50 text-primary-500"
                          : "hover:border-gray-300"
                      }`}
                    >
                      <Bike className="w-4 h-4 mx-auto mb-1" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trip details */}
          {bookingStep === "details" && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Trip Details</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  {serviceType === "ride" ? "Notes for the driver (optional)" : "Package notes (optional)"}
                </label>
                <textarea
                  value={serviceType === "ride" ? specialInstructions : packageNotes}
                  onChange={(e) =>
                    serviceType === "ride"
                      ? setSpecialInstructions(e.target.value)
                      : setPackageNotes(e.target.value)
                  }
                  rows={2}
                  className="w-full border rounded-md p-2"
                  placeholder="Anything the handler should know?"
                />
              </div>
              {fareDisplay && (
                <p className="text-sm text-gray-600">
                  Quoted {serviceType === "ride" ? "fare" : "fee"}:{" "}
                  <span className="font-semibold text-primary-500">{fareDisplay}</span>
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {bookingStep !== "confirm" && (
            <div className="flex gap-3">
              {bookingStep !== "location" && (
                <button
                  onClick={() => setBookingStep("location")}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
              )}

              {bookingStep === "location" && pickup && dropoff && (
                <button
                  onClick={() => setBookingStep("details")}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-md hover:bg-primary-600"
                >
                  Continue
                </button>
              )}

              {bookingStep === "details" && (
                <button
                  onClick={confirmBooking}
                  disabled={loading || estimating || !fareDisplay}
                  className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking…
                    </>
                  ) : (
                    `Confirm ${serviceType === "ride" ? "Ride" : "Delivery"}${fareDisplay ? ` · ${fareDisplay}` : ""}`
                  )}
                </button>
              )}
            </div>
          )}

          {/* Escrow notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              Booking debits your wallet into escrow immediately. Short balance → booking fails, nothing is written.
            </p>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-24">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Trip Route</h3>
              {estimating && <p className="text-xs text-gray-500 mt-1">Getting server quote…</p>}
              {estimate && fareDisplay && (
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-gray-400" />
                    {(estimate.distance_m / 1000).toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    server-quoted
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary-500">
                    {fareDisplay}
                  </span>
                </div>
              )}
            </div>

            <div className="h-96">
              {pickup && dropoff ? (
                <MapContainer
                  center={[pickup.lat, pickup.lng]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[pickup.lat, pickup.lng]}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                  <Marker position={[dropoff.lat, dropoff.lng]}>
                    <Popup>Dropoff Location</Popup>
                  </Marker>
                  <Polyline
                    positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
                    pathOptions={{ color: "#5B2EFF", weight: 4 }}
                  />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Enter pickup and dropoff locations to see route</p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation Screen */}
            {bookingStep === "confirm" && confirmed && (
              <div className="p-4 bg-green-100 border-t text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-green-800">Booking Confirmed!</h3>
                <p className="text-green-700 mt-1">
                  Your {serviceType} is booked and the fare is held in escrow.
                  {"tracking_code" in confirmed && confirmed.tracking_code
                    ? ` Tracking code: ${confirmed.tracking_code}.`
                    : ""}
                </p>
                <button
                  onClick={reset}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Book Another Trip
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

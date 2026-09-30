import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MapPin, Star, Filter, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import ServiceLocation from "@/components/service/ServiceLocation";
import { listings, orders, wallet, ApiError, toNairaString } from "@/api";
import type { ListingResponse } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  "All",
  "Electrician",
  "Plumber",
  "Mechanic",
  "Cleaner",
  "Designer",
  "Beauty",
];

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.isForbidden)
      return "Your account lacks the service_provider role needed to post services. Roles are granted by an admin.";
    return err.description || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<ListingResponse | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [confirmPid, setConfirmPid] = useState<string | null>(null);
  const [post, setPost] = useState({ title: "", description: "", category: "Electrician", location: "", price: "" });

  const onSearchChange = (v: string) => {
    setSearch(v);
    window.clearTimeout((onSearchChange as any)._t);
    (onSearchChange as any)._t = window.setTimeout(() => setDebounced(v.trim()), 400);
  };

  const servicesQuery = useQuery({
    queryKey: ["services", debounced, category],
    queryFn: () => {
      const base = {
        vertical: "service" as const,
        category: category === "All" ? undefined : category,
        page_size: 50,
      };
      return debounced ? listings.search(debounced, base) : listings.browse(base);
    },
  });
  const providers = servicesQuery.data?.items ?? [];

  const balanceQuery = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: wallet.get,
    enabled: !!user && !!confirmPid,
  });

  // Keep the selected card in sync if the list refetches.
  useEffect(() => {
    if (selected) {
      const fresh = providers.find((p) => p.pid === selected.pid);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesQuery.data]);

  const orderMutation = useMutation({
    mutationFn: (pid: string) => orders.create(pid),
    onSuccess: () => {
      toast.success("Service booked — payment held in escrow. Arrange the visit via chat.");
      setConfirmPid(null);
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: (err) => toast.error(apiMsg(err, "Booking failed.")),
  });

  const postMutation = useMutation({
    mutationFn: () => {
      const price = toNairaString(post.price);
      if (!price) throw new Error("Enter a valid price in naira.");
      return listings.create({
        vertical: "service",
        title: post.title.trim(),
        description: post.description.trim(),
        category: post.category,
        location: post.location.trim() || undefined,
        price,
      });
    },
    onSuccess: () => {
      toast.success("Service posted!");
      setShowPost(false);
      setPost({ title: "", description: "", category: "Electrician", location: "", price: "" });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err) => toast.error(apiMsg(err, "Failed to post service.")),
  });

  const selectedAttrs = (selected?.attributes ?? {}) as any;
  const selectedLat = Number(selectedAttrs.latitude);
  const selectedLng = Number(selectedAttrs.longitude);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Find Trusted Service Providers
          </h1>
          <p className="text-gray-600 text-sm">
            Hire verified professionals near you
          </p>
        </div>
        <button
          onClick={() => { if (!user) { toast.error("Please log in to post a service."); return; } setShowPost(true); }}
          className="flex items-center gap-1 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" /> Post a Service
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">

          {/* Search */}
          <div className="flex items-center border rounded-lg px-3 py-2 w-full">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="ml-2 w-full outline-none text-sm"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  category === cat
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* PROVIDERS LIST */}
        <div className="md:col-span-2 space-y-4">
          {servicesQuery.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
          ) : servicesQuery.isError ? (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <p className="text-gray-500">Could not load services.</p>
              <button onClick={() => servicesQuery.refetch()} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
            </div>
          ) : (
            <>
              {providers.length === 0 && (
                <p className="text-gray-500">No services found</p>
              )}

              {providers.map((provider) => {
                const attrs = (provider.attributes ?? {}) as any;
                return (
                  <div
                    key={provider.pid}
                    className="bg-white p-4 rounded-xl shadow-sm flex gap-4 cursor-pointer hover:shadow-md transition"
                    onClick={() => setSelected(provider)}
                  >
                    <img
                      src={(attrs.cover_image as string) || "/images/electrician.jpg"}
                      alt={provider.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">
                          {provider.title}
                        </h3>

                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">
                        {provider.category || "General"}
                      </p>

                      {typeof attrs.rating === "number" && (
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {attrs.rating} ({attrs.reviews ?? 0})
                        </div>
                      )}

                      {provider.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{provider.description}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-purple-600">
                          {provider.price_display ?? "Contact for price"}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) { toast.error("Please log in to book."); return; }
                            setConfirmPid(provider.pid);
                          }}
                          className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* MAP + LOCATION */}
        <div className="md:col-span-1">
          {selected ? (
            Number.isFinite(selectedLat) && Number.isFinite(selectedLng) ? (
              <ServiceLocation
                providerLocation={{
                  latitude: selectedLat,
                  longitude: selectedLng,
                  address: selected.location || "Nigeria",
                }}
                serviceArea={10}
              />
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
                <MapPin className="mx-auto mb-2" />
                {selected.location || "Location arranged via chat after booking"}
              </div>
            )
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
              <MapPin className="mx-auto mb-2" />
              Select a provider to view location
            </div>
          )}
        </div>
      </div>

      {/* Book confirm modal (creation IS payment — escrow) */}
      {confirmPid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900">Confirm booking</h2>
            <p className="text-sm text-gray-600 mt-2">
              Booking debits your wallet into escrow immediately — there is no separate pay step.
              Dates and details are arranged with the provider via chat afterwards.
            </p>
            <div className="mt-4 text-sm bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-semibold">{providers.find((p) => p.pid === confirmPid)?.price_display ?? ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet balance</span>
                <span className="font-semibold">{balanceQuery.data?.balance_display ?? "…"}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmPid(null)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => orderMutation.mutate(confirmPid)}
                disabled={orderMutation.isPending}
                className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {orderMutation.isPending ? "Booking..." : "Confirm & Pay from Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post service modal */}
      {showPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900">Post a Service</h2>
            <p className="text-sm text-gray-600 mt-1">Posting requires the service_provider role — an admin grants it, not self-service.</p>
            <div className="space-y-3 mt-4">
              <input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="Service title"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
              <textarea value={post.description} onChange={(e) => setPost({ ...post, description: e.target.value })} rows={4}
                placeholder="Describe your service..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
              <div className="grid grid-cols-2 gap-3">
                <select value={post.category} onChange={(e) => setPost({ ...post, category: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm">
                  {categories.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={post.price} onChange={(e) => setPost({ ...post, price: e.target.value })} placeholder="Price (₦)"
                  inputMode="decimal" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <input value={post.location} onChange={(e) => setPost({ ...post, location: e.target.value })} placeholder="Location (e.g. Kano)"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPost(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => postMutation.mutate()}
                disabled={postMutation.isPending || !post.title.trim() || !post.description.trim()}
                className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {postMutation.isPending ? "Posting..." : "Post Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

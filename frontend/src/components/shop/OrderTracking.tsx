import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orders, ApiError, type OrderResponse } from "@/api";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Loader2,
  Star,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface OrderTrackingProps {
  /** Order pid to open initially; omit to show the full bought/sold lists. */
  orderId?: string;
  /** No backend equivalent — accepted for backwards compatibility, ignored. */
  shipmentId?: string;
}

/**
 * Order lifecycle. Status comes from `GET /api/orders` (`{bought, sold}`)
 * and `GET /api/orders/{pid}`; actions are split by side — the seller marks
 * delivery, the buyer confirms (releases escrow), cancels pre-delivery,
 * disputes, or reviews a completed order. Money-moving actions ask for an
 * explicit `window.confirm` first. Live shipment tracking has no backend, so
 * delivery is coordinated with the counterparty via chat.
 */
export const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  shipmentId: _shipmentId,
}) => {
  void _shipmentId;
  const queryClient = useQueryClient();
  const [selectedPid, setSelectedPid] = useState<string | null>(orderId ?? null);
  const [tab, setTab] = useState<"bought" | "sold">("bought");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const {
    data: lists,
    isLoading: listsLoading,
    isError: listsError,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orders.list(),
  });

  const bought = lists?.bought ?? [];
  const sold = lists?.sold ?? [];
  const visible = tab === "bought" ? bought : sold;

  const selectedSide: "buyer" | "seller" | null = selectedPid
    ? bought.some((o) => o.pid === selectedPid)
      ? "buyer"
      : sold.some((o) => o.pid === selectedPid)
        ? "seller"
        : null
    : null;

  const {
    data: detail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ["order", selectedPid],
    queryFn: () => orders.get(selectedPid!),
    enabled: !!selectedPid,
  });

  const selected: OrderResponse | undefined = detail?.order;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    if (selectedPid)
      queryClient.invalidateQueries({ queryKey: ["order", selectedPid] });
  };

  const onError = (err: unknown) => {
    toast.error(
      err instanceof ApiError ? `${err.code}: ${err.description}` : "Action failed",
    );
  };

  const deliverMutation = useMutation({
    mutationFn: (pid: string) => orders.markDelivered(pid),
    onSuccess: () => {
      toast.success("Marked as delivered — waiting on buyer confirmation.");
      invalidate();
    },
    onError,
  });

  const confirmMutation = useMutation({
    mutationFn: (pid: string) => orders.confirm(pid),
    onSuccess: () => {
      toast.success("Delivery confirmed — escrow released to the seller.");
      invalidate();
    },
    onError,
  });

  const cancelMutation = useMutation({
    mutationFn: (pid: string) => orders.cancel(pid),
    onSuccess: () => {
      toast.success("Order cancelled — escrow refunded to your wallet.");
      invalidate();
    },
    onError,
  });

  const disputeMutation = useMutation({
    mutationFn: (pid: string) => orders.dispute(pid),
    onSuccess: () => {
      toast.success("Dispute opened — escrow frozen until an admin resolves it.");
      invalidate();
    },
    onError,
  });

  const reviewMutation = useMutation({
    mutationFn: (pid: string) => orders.review(pid, rating, comment || undefined),
    onSuccess: () => {
      toast.success("Review submitted.");
      setShowReviewForm(false);
      setComment("");
      invalidate();
    },
    onError,
  });

  const confirmAnd =
    (message: string, fn: (pid: string) => void) => (pid: string) => {
      if (window.confirm(message)) fn(pid);
    };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "delivered":
        return <Truck className="w-5 h-5 text-purple-500" />;
      case "completed":
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
      case "refunded":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "disputed":
        return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const steps = ["pending", "delivered", "completed"];
  const calculateProgress = (status?: string) => {
    const idx = steps.indexOf(status ?? "");
    if (idx < 0) return status === "confirmed" ? 100 : 0;
    return (idx / (steps.length - 1)) * 100;
  };

  const busy =
    deliverMutation.isPending ||
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    disputeMutation.isPending ||
    reviewMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-2 mb-4">
              {(["bought", "sold"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium capitalize rounded-md transition-colors ${
                    tab === t
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t === "bought" ? "My purchases" : "My sales"}
                </button>
              ))}
            </div>

            {listsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : listsError ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Could not load orders. Please try again.
              </p>
            ) : visible.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No {tab === "bought" ? "purchases" : "sales"} yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {visible.map((o) => (
                  <button
                    key={o.pid}
                    onClick={() => setSelectedPid(o.pid)}
                    className={`w-full text-left border rounded-lg p-3 transition-all ${
                      selectedPid === o.pid
                        ? "border-primary-500 bg-primary-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(o.status)}
                      <p className="font-medium text-sm truncate flex-1">
                        {o.listing_title}
                      </p>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span className="capitalize">{o.status}</span>
                      <span className="font-semibold text-gray-900">
                        {o.amount_display} × {o.quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail + actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {!selectedPid || !selected ? (
              <div className="text-center py-12">
                {detailLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                ) : (
                  <>
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Select an order to see its status</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selected.listing_title}</h3>
                    <p className="text-sm text-gray-500">
                      {selected.amount_display} × {selected.quantity} •{" "}
                      <span className="capitalize">{selected.status}</span>
                    </p>
                  </div>
                  {getStatusIcon(selected.status)}
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${calculateProgress(selected.status)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Ordered</span>
                    <span>Delivered</span>
                    <span>Completed</span>
                  </div>
                </div>

                {/* Item images (GET /api/orders/{pid} -> {order, images}) */}
                {detail?.images && detail.images.length > 0 && (
                  <div className="flex gap-2 mb-6 overflow-x-auto">
                    {detail.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}

                {/* Side-gated actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedSide === "seller" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        confirmAnd(
                          "Mark this order as delivered? The buyer will be asked to confirm receipt.",
                          (pid) => deliverMutation.mutate(pid),
                        )(selected.pid)
                      }
                      className="px-4 py-2 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 disabled:opacity-50"
                    >
                      Mark delivered
                    </button>
                  )}
                  {selectedSide === "buyer" && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() =>
                          confirmAnd(
                            "Confirm delivery? This releases the escrowed funds to the seller and cannot be undone.",
                            (pid) => confirmMutation.mutate(pid),
                          )(selected.pid)
                        }
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50"
                      >
                        Confirm receipt
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          confirmAnd(
                            "Cancel this order? Escrowed funds return to your wallet.",
                            (pid) => cancelMutation.mutate(pid),
                          )(selected.pid)
                        }
                        className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancel order
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          confirmAnd(
                            "Open a dispute? Escrow freezes until an admin resolves it.",
                            (pid) => disputeMutation.mutate(pid),
                          )(selected.pid)
                        }
                        className="px-4 py-2 border border-orange-300 text-orange-600 text-sm rounded-md hover:bg-orange-50 disabled:opacity-50"
                      >
                        Dispute
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setShowReviewForm((s) => !s)}
                        className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Star className="w-4 h-4" /> Review
                      </button>
                    </>
                  )}
                </div>

                {/* Buyer review (completed orders, one per order) */}
                {showReviewForm && selectedSide === "buyer" && (
                  <div className="mt-4 border rounded-lg p-4 space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} onClick={() => setRating(i)} type="button">
                          <Star
                            className={`w-6 h-6 ${
                              i <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you think? (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                    <button
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate(selected.pid)}
                      className="px-4 py-2 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 disabled:opacity-50"
                    >
                      Submit review
                    </button>
                  </div>
                )}

                {/* Delivery coordination */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium">Delivery coordination</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Delivery is coordinated directly with the{" "}
                    {selectedSide === "buyer" ? "seller" : "buyer"} via chat and
                    confirmed here.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

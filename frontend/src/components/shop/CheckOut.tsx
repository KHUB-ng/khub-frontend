import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { orders, wallet, ApiError } from "@/api";
import { Wallet, Check, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

/**
 * Escrow checkout (legacy component path). One real order per cart item via
 * `POST /api/orders` — creation IS payment: the wallet is debited into
 * escrow in the same transaction. Shipping addresses, promo codes, shipment
 * choice and card-gateway steps are backend gaps, so those steps show honest notes
 * instead of fake controls.
 */
export const Checkout: React.FC = () => {
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => wallet.get(),
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: ({ pid, quantity }: { pid: string; quantity: number }) =>
      orders.create(pid, quantity),
  });

  const createOrder = async () => {
    if (!user) {
      toast.error("Please log in to place an order");
      navigate("/login");
      return;
    }
    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    const ok = window.confirm(
      `Place ${items.length === 1 ? "this order" : `these ${items.length} orders`}? ` +
        "Payment leaves your wallet into escrow now.",
    );
    if (!ok) return;

    setLoading(true);
    try {
      for (const item of items) {
        await createOrderMutation.mutateAsync({
          pid: item.pid,
          quantity: item.quantity,
        });
      }
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOrderPlaced(true);
      toast.success("Order placed successfully! Funds held in escrow.");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? `${err.code}: ${err.description}`
          : "Failed to place order",
      );
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Your payment is held in escrow until delivery is confirmed.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Wallet */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Wallet
            </h3>
            <p className="text-2xl font-bold">
              {walletData ? walletData.balance_display : "—"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Orders are paid straight from this wallet into escrow.
            </p>
          </div>

          {/* Delivery: arranged with the seller after purchase */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">Delivery</h3>
            <p className="text-sm text-gray-600">
              Delivery is arranged directly with the seller after purchase, via
              chat and the order page.
            </p>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Review Your Order ({items.length} item{items.length === 1 ? "" : "s"})
            </h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.pid} className="flex gap-4 border-b pb-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                      No image
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-primary-500 font-semibold">
                      {item.priceDisplay}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Final amounts are quoted by the backend when each order is created.
              </p>
            </div>

            <button
              onClick={createOrder}
              disabled={loading || items.length === 0}
              className="mt-6 w-full bg-green-500 text-white py-3 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Pay from Wallet"
              )}
            </button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Items ({items.reduce((s, i) => s + i.quantity, 0)})
                </span>
                <span>{items.length} listing{items.length === 1 ? "" : "s"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet balance</span>
                <span>{walletData ? walletData.balance_display : "—"}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4" />
            <div className="text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                Secure escrow checkout
              </p>
              <p className="mt-1">Funds release only after you confirm delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

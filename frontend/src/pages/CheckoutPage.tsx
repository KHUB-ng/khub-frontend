import { useState } from "react";
import { Shield, ArrowRight, Wallet, Lock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orders, wallet, ApiError } from "@/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Escrow checkout. Placing an order (`POST /api/orders`) debits the buyer's
 * wallet into escrow in the same transaction — there is no separate card
 * charge, no third-party gateway step, no promo codes, no shipping addresses, and no
 * client-computed totals (all backend gaps per docs/BACKEND_SWAP.md).
 */
const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => wallet.get(),
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: ({ pid, quantity }: { pid: string; quantity: number }) =>
      orders.create(pid, quantity),
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to complete checkout");
      navigate("/login");
      return;
    }
    if (items.length === 0) return;

    const confirmed = window.confirm(
      `Place ${items.length === 1 ? "this order" : `these ${items.length} orders`}? ` +
        `Payment leaves your wallet into escrow now and is released to the seller only after you confirm delivery.`,
    );
    if (!confirmed) return;

    setProcessing(true);
    const created: string[] = [];
    try {
      // One real order per cart item — the backend quotes and escrows each.
      for (const item of items) {
        const order = await createOrderMutation.mutateAsync({
          pid: item.pid,
          quantity: item.quantity,
        });
        created.push(order.pid);
      }
      toast.success(
        created.length === 1
          ? "Order placed! Funds held in escrow until delivery is confirmed."
          : `${created.length} orders placed! Funds held in escrow until delivery is confirmed.`,
      );
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate("/dashboard");
    } catch (err) {
      // Short wallet -> 400 {error, description}, nothing written.
      const message =
        err instanceof ApiError
          ? `${err.code}: ${err.description}${
              created.length > 0
                ? ` (${created.length} order${created.length === 1 ? "" : "s"} already placed)`
                : ""
            }`
          : "Could not place order. Please try again.";
      toast.error(message);
      if (created.length > 0) {
        clearCart();
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        navigate("/dashboard");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="text-muted-foreground mt-1">Add items before checking out</p>
        <Link to="/shop">
          <Button className="mt-4 gradient-purple text-primary-foreground">
            Browse Shop
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Secure Checkout</h1>
          <p className="text-xs text-muted-foreground">Powered by Escrow Protection</p>
        </div>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Wallet balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 border border-border rounded-2xl bg-card space-y-2"
        >
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-primary" /> Wallet Balance
          </h2>
          {walletLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading balance...
            </div>
          ) : walletError || !walletData ? (
            <p className="text-sm text-muted-foreground">
              Could not load your wallet balance. You can still place the order —
              the backend will reject it with a clear message if funds are short.
            </p>
          ) : (
            <p className="text-2xl font-bold text-foreground">
              {walletData.balance_display}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Placing an order moves funds from this wallet into escrow immediately.
            Delivery is arranged directly with the seller after purchase.
          </p>
        </motion.div>

        {/* Escrow Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Escrow Protection</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your payment is held securely until delivery is confirmed. Funds are
                only released to the seller after you confirm receipt.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Order Summary — server-sent display strings only, no client totals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-5 border border-border rounded-2xl bg-card"
        >
          <h2 className="font-semibold text-foreground mb-3 text-sm">
            Order Summary ({items.length} item{items.length === 1 ? "" : "s"} →{" "}
            {items.length} order{items.length === 1 ? "" : "s"})
          </h2>
          {items.map((item) => (
            <div key={item.pid} className="flex justify-between text-sm py-1.5 gap-3">
              <span className="text-muted-foreground">
                {item.name} × {item.quantity}
              </span>
              <span className="text-foreground font-medium whitespace-nowrap">
                {item.priceDisplay}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
            </div>
          ))}
          <div className="border-t border-border mt-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Final amounts are quoted by the backend when each order is created.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <Button
          type="submit"
          className="w-full gradient-purple text-primary-foreground h-14 text-base font-semibold rounded-2xl"
          disabled={processing}
        >
          {processing ? (
            <span className="flex items-center gap-2">
              Placing orders...{" "}
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            </span>
          ) : (
            <>
              Confirm & Pay from Wallet <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Funds held in escrow until you confirm delivery
        </p>
      </form>
    </div>
  );
};

export default CheckoutPage;

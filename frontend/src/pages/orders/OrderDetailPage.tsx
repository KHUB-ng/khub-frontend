import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { absoluteUrl, orders } from "@/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Money,
  PageHeader,
  secondaryButtonClass,
  statusTone,
} from "@/components/ui/primitives";
import { OrderActionButtons } from "./OrderActions";

const LIFECYCLE = [
  { key: "pending", label: "Created — funds in escrow" },
  { key: "delivered", label: "Delivered by seller" },
  { key: "completed", label: "Confirmed — escrow released" },
] as const;

function reachedIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === "completed" || s === "confirmed") return 3;
  if (s === "delivered") return 2;
  if (s === "disputed") return 1;
  return 1; // pending / created
}

export default function OrderDetailPage() {
  const { pid = "" } = useParams<{ pid: string }>();

  const orderQ = useQuery({
    queryKey: ["orders", pid],
    queryFn: () => orders.get(pid),
    enabled: pid.length > 0,
  });

  if (!pid) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <ErrorState error={new Error("Missing order id in the URL.")} />
      </div>
    );
  }

  const order = orderQ.data?.order;
  const images = orderQ.data?.images ?? [];
  const done = order ? reachedIndex(order.status) : 0;
  const flagged = order
    ? ["disputed", "cancelled", "refunded", "failed"].includes(order.status.toLowerCase())
    : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <PageHeader
        title="Order"
        subtitle={pid}
        actions={
          <Link to="/orders" className={secondaryButtonClass}>
            <span className="inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" aria-hidden /> All orders
            </span>
          </Link>
        }
      />

      {orderQ.isLoading && <Loading label="Loading order…" />}
      {orderQ.error && <ErrorState error={orderQ.error} />}

      {order && (
        <>
          <Card title={order.listing_title}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
              <span className="text-xs text-muted-foreground">× {order.quantity}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              <Money display={order.amount_display} kobo={order.amount_kobo} />
            </p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground">Buyer</dt>
                <dd className="font-mono text-xs">{order.buyer_pid}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground">Seller</dt>
                <dd className="font-mono text-xs">{order.seller_pid}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground">Listing</dt>
                <dd>
                  <Link
                    to={`/marketplace/${order.listing_pid}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {order.listing_pid}
                  </Link>
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Status timeline">
            <ol className="space-y-2">
              {LIFECYCLE.map((step, i) => {
                const reached = done > i;
                return (
                  <li key={step.key} className="flex items-center gap-3 text-sm">
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                        reached
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {reached ? "✓" : "·"}
                    </span>
                    <span className={reached ? "" : "text-muted-foreground"}>{step.label}</span>
                  </li>
                );
              })}
            </ol>
            {flagged && (
              <p className="mt-3 text-sm">
                <Badge tone="bad">{order.status}</Badge>{" "}
                <span className="text-xs text-muted-foreground">
                  Escrow is {order.status.toLowerCase() === "disputed" ? "frozen for admin review" : "settled via refund/cancellation"}.
                </span>
              </p>
            )}
          </Card>

          {images.length > 0 && (
            <Card title="Listing photos">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {images.map((url, i) => (
                  <img
                    key={`${url}-${i}`}
                    src={absoluteUrl(url)}
                    alt=""
                    className="aspect-square w-full rounded border border-border object-cover"
                  />
                ))}
              </div>
            </Card>
          )}
          {images.length === 0 && (
            <EmptyState title="No photos attached" hint="The listing had no images at order time." />
          )}

          <Card title="Actions">
            <OrderActionButtons orderPid={order.pid} status={order.status} side="both" />
            <p className="mt-3 text-xs text-muted-foreground">
              Buttons are gated by side and state server-side too: only the seller can mark
              delivered, only the buyer can confirm/cancel/review, and either party can dispute.
              A 403 means you are not a party to this order.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

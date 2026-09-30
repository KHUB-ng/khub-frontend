import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ApiError, orders } from "@/api";
import type { OrderResponse } from "@/api";
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

function OrderCard({ order, side }: { order: OrderResponse; side: "bought" | "sold" }) {
  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/orders/${order.pid}`} className="font-medium hover:underline">
          {order.listing_title}
        </Link>
        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
      </div>
      <p className="mt-1 text-sm font-semibold">
        <Money display={order.amount_display} kobo={order.amount_kobo} />
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          × {order.quantity}
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {side === "bought" ? `Seller ${order.seller_pid}` : `Buyer ${order.buyer_pid}`} ·{" "}
        <span className="font-mono">{order.pid}</span>
      </p>
      <div className="mt-3">
        <OrderActionButtons orderPid={order.pid} status={order.status} side={side} />
      </div>
    </li>
  );
}

function OrderSection({
  title,
  hint,
  orders: rows,
  side,
}: {
  title: string;
  hint: string;
  orders: OrderResponse[] | undefined;
  side: "bought" | "sold";
}) {
  return (
    <Card title={title}>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3">
        {!rows ? (
          <Loading label={`Loading ${title.toLowerCase()}…`} />
        ) : rows.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} yet`} hint={hint} />
        ) : (
          <ul className="space-y-3">
            {rows.map((o) => (
              <OrderCard key={o.pid} order={o} side={side} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default function OrdersPage() {
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: orders.list });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <PageHeader
        title="Orders"
        subtitle="Escrow lifecycle: creation debits your wallet; confirm releases it to the seller."
        actions={
          <Link to="/marketplace" className={secondaryButtonClass}>
            Browse marketplace
          </Link>
        }
      />

      {ordersQ.isLoading && <Loading label="Loading orders…" />}
      {ordersQ.error && (
        <>
          <ErrorState error={ordersQ.error} />
          {ordersQ.error instanceof ApiError && ordersQ.error.status === 401 && (
            <p className="text-xs text-muted-foreground">
              You need to sign in to view orders.
            </p>
          )}
        </>
      )}

      {ordersQ.data && (
        <>
          <OrderSection
            title="Bought"
            hint="You are the buyer: confirm receipt to release escrow, cancel pre-delivery for a refund, dispute to freeze funds, review once completed."
            orders={ordersQ.data.bought}
            side="bought"
          />
          <OrderSection
            title="Sold"
            hint="You are the seller: mark orders delivered; either party can dispute to freeze escrow for admin review."
            orders={ordersQ.data.sold}
            side="sold"
          />
          {ordersQ.data.bought.length === 0 && ordersQ.data.sold.length === 0 && (
            <EmptyState
              title="No orders on either side"
              hint="Buy a listing to create an order — creation IS payment, so keep your wallet funded."
            />
          )}
        </>
      )}
    </div>
  );
}

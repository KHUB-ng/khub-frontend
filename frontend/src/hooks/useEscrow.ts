import { useState } from "react";
import { toast } from "sonner";
import { deliveries, orders, rides } from "@/api";
import type { DeliveryResponse, OrderResponse, RideResponse } from "@/api";

interface EscrowReleaseRequest {
  id: string;
  escrow_hold_id: string;
  seller_id: string;
  request_reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

type EscrowedEntity = "ride" | "delivery" | "order" | "rental";
type EscrowFlow = OrderResponse | RideResponse | DeliveryResponse;

const ACTIVE_ORDER = new Set(["paid", "processing", "shipped", "in_transit", "disputed"]);
const ACTIVE_RIDE = new Set(["requested", "accepted", "arriving", "started", "disputed"]);
const ACTIVE_DELIVERY = new Set([
  "requested",
  "accepted",
  "picked_up",
  "in_transit",
  "disputed",
]);

/**
 * Escrow against the REST backend.
 *
 * There is no separate escrow table for users: the backend holds funds
 * inside the order / ride / delivery flow itself (creation IS payment —
 * the fee is debited into escrow in the same transaction) and releases on
 * confirm / completion, refunds on cancel, freezes on dispute. Admin
 * resolution lives behind `src/api/admin.ts`, which the UI cannot call, so
 * admin-side actions are an honest no-op with a message.
 *
 * Kept export shape: AdminEscrowManager consumes
 * `loadPendingEscrowReleases / releaseEscrow / rejectEscrowRelease /
 * pendingReleases / loading`; booking flows consume
 * `createEscrowTransaction / disputeEscrow / getEscrowStatus`.
 */
export const useEscrow = () => {
  const [loading, setLoading] = useState(false);
  const [pendingReleases, setPendingReleases] = useState<EscrowReleaseRequest[]>([]);

  /** Informational only — creation already debits into escrow server-side. */
  const createEscrowTransaction = async (
    _amount: number,
    _entityType: EscrowedEntity,
    _entityId: string,
    _sellerId: string,
  ) => {
    toast.success("Payment secured in escrow. Funds release on completion.");
    return { pid: _entityId } as { pid: string };
  };

  /** Sellers/drivers/agents have no release-request route; completion and
   *  buyer confirmation release funds. Kept so callers compile. */
  const requestEscrowRelease = async (
    _escrowHoldId: string,
    _sellerId: string,
    _reason = "Service completed successfully",
  ) => {
    toast.info("Escrow releases automatically on completion or buyer confirmation.");
    return false;
  };

  /** Admin-only and unwired from userland — needs a backend admin session. */
  const releaseEscrow = async (_escrowHoldId: string, _adminNotes?: string) => {
    toast.error("Escrow release is admin-only and not available in this session.");
    return false;
  };

  /** Admin-only and unwired from userland. */
  const rejectEscrowRelease = async (_escrowHoldId: string, _rejectionReason: string) => {
    toast.error("Escrow rejection is admin-only and not available in this session.");
    return false;
  };

  /** No user-visible pending-release queue exists server-side. */
  const loadPendingEscrowReleases = async () => {
    setLoading(true);
    try {
      setPendingReleases([]);
      return [] as EscrowReleaseRequest[];
    } finally {
      setLoading(false);
    }
  };

  /** Freeze funds for admin review via the owning flow's dispute route. */
  const disputeEscrow = async (entityPid: string, reason: string, entityType?: EscrowedEntity) => {
    if (!window.confirm("File a dispute? Funds will be frozen for admin review.")) return false;
    setLoading(true);
    try {
      const t = entityType ?? "order";
      if (t === "ride") await rides.dispute(entityPid);
      else if (t === "delivery") await deliveries.dispute(entityPid);
      else if (t === "rental") {
        toast.info("Rental disputes are arranged by chat — contact support with your booking reference.");
        return false;
      } else await orders.dispute(entityPid);
      toast.success("Dispute filed. Admin will review your case within 24-48 hours.");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to file dispute");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** Escrow status == the owning flow's status (held while active). */
  const getEscrowStatus = async (
    entityPid: string,
    entityType: EscrowedEntity = "order",
  ): Promise<{ status: string; held: boolean; flow: EscrowFlow } | null> => {
    try {
      let flow: EscrowFlow;
      if (entityType === "ride") flow = await rides.get(entityPid);
      else if (entityType === "delivery") flow = await deliveries.get(entityPid);
      else if (entityType === "rental") return null;
      else flow = (await orders.get(entityPid)).order;
      const active =
        "quantity" in flow
          ? ACTIVE_ORDER.has(flow.status)
          : entityType === "ride"
            ? ACTIVE_RIDE.has(flow.status)
            : ACTIVE_DELIVERY.has(flow.status);
      return { status: flow.status, held: active, flow };
    } catch {
      return null;
    }
  };

  return {
    createEscrowTransaction,
    requestEscrowRelease,
    releaseEscrow,
    rejectEscrowRelease,
    disputeEscrow,
    loadPendingEscrowReleases,
    getEscrowStatus,
    pendingReleases,
    loading,
  };
};

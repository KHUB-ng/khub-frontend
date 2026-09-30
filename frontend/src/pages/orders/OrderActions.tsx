import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, orders } from "@/api";
import {
  buttonClass,
  ErrorState,
  Field,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui/primitives";

export function orderErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `${err.status} ${err.code}: ${err.description}`;
  return err instanceof Error ? err.message : String(err);
}

const TERMINAL = ["completed", "cancelled", "refunded", "failed"];

function useOrderMutation(
  fn: (pid: string) => Promise<unknown>,
  success: string,
  orderPid: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fn(orderPid),
    onSuccess: () => {
      toast.success(success);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", orderPid] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => toast.error(orderErrorMessage(err)),
  });
}

export function ReviewForm({ orderPid }: { orderPid: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const reviewM = useMutation({
    mutationFn: () => orders.review(orderPid, Number(rating), comment.trim() || undefined),
    onSuccess: () => {
      toast.success("Review submitted");
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["orders", orderPid] });
    },
    onError: (err) => toast.error(orderErrorMessage(err)),
  });

  return (
    <div className="mt-3 rounded-lg border border-border p-3">
      <p className="text-xs font-medium">Leave a review (one per order)</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr]">
        <Field label="Rating (1–5)">
          <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}>
            {["5", "4", "3", "2", "1"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Comment (optional)">
          <input
            className={inputClass}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did it go?"
          />
        </Field>
      </div>
      <button
        type="button"
        className={`${buttonClass} mt-2`}
        disabled={reviewM.isPending}
        onClick={() => reviewM.mutate()}
      >
        {reviewM.isPending ? "Submitting…" : "Submit review"}
      </button>
      {reviewM.error && (
        <div className="mt-2">
          <ErrorState error={reviewM.error} />
        </div>
      )}
    </div>
  );
}

export function OrderActionButtons({
  orderPid,
  status,
  side,
}: {
  orderPid: string;
  status: string;
  /** "bought" = current user is buyer, "sold" = seller, "both" = show everything applicable. */
  side: "bought" | "sold" | "both";
}) {
  const s = status.toLowerCase();
  const isBuyer = side === "bought" || side === "both";
  const isSeller = side === "sold" || side === "both";
  const terminal = TERMINAL.includes(s);
  const [showReview, setShowReview] = useState(false);

  const deliverM = useOrderMutation(orders.markDelivered, "Marked as delivered", orderPid);
  const confirmM = useOrderMutation(
    orders.confirm,
    "Order confirmed — escrow released to the seller",
    orderPid,
  );
  const cancelM = useOrderMutation(orders.cancel, "Order cancelled — refunded", orderPid);
  const disputeM = useOrderMutation(
    orders.dispute,
    "Order disputed — escrow frozen for admin review",
    orderPid,
  );

  const mutationError =
    deliverM.error ?? confirmM.error ?? cancelM.error ?? disputeM.error;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {isSeller && !terminal && s !== "delivered" && s !== "disputed" && (
          <button
            type="button"
            className={buttonClass}
            disabled={deliverM.isPending}
            onClick={() => {
              if (window.confirm("Mark this order as delivered?")) deliverM.mutate();
            }}
          >
            {deliverM.isPending ? "Marking…" : "Mark delivered"}
          </button>
        )}
        {isBuyer && s === "delivered" && (
          <button
            type="button"
            className={buttonClass}
            disabled={confirmM.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Confirm receipt? This releases the escrowed funds to the seller and cannot be undone.",
                )
              ) {
                confirmM.mutate();
              }
            }}
          >
            {confirmM.isPending ? "Confirming…" : "Confirm receipt"}
          </button>
        )}
        {isBuyer && !terminal && s !== "delivered" && s !== "disputed" && (
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={cancelM.isPending}
            onClick={() => {
              if (window.confirm("Cancel this order? You will be refunded atomically.")) {
                cancelM.mutate();
              }
            }}
          >
            {cancelM.isPending ? "Cancelling…" : "Cancel order"}
          </button>
        )}
        {(isBuyer || isSeller) && !terminal && s !== "disputed" && (
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={disputeM.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Open a dispute? The escrow will be frozen until an admin resolves it.",
                )
              ) {
                disputeM.mutate();
              }
            }}
          >
            {disputeM.isPending ? "Filing…" : "Dispute"}
          </button>
        )}
        {isBuyer && s === "completed" && (
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setShowReview((v) => !v)}
          >
            {showReview ? "Hide review form" : "Write a review"}
          </button>
        )}
      </div>
      {mutationError && (
        <div className="mt-2">
          <ErrorState error={mutationError} />
        </div>
      )}
      {isBuyer && s === "completed" && showReview && <ReviewForm orderPid={orderPid} />}
    </div>
  );
}

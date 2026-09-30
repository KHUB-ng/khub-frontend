import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listings } from "@/api";
import {
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  buttonClass,
} from "@/components/ui/primitives";
import { koboToNaira } from "@/api";

/**
 * GET /api/my/wishlist — the saved list.
 *
 * Returns `[{pid, title, vertical, price_kobo}]`, i.e. kobo integers with no
 * `price_display`, so rendering goes through `koboToNaira` rather than the
 * display string the browse surface normally carries.
 *
 * Removal is `POST /api/wishlist/{pid}` — the same idempotent toggle the
 * listing detail page uses; it flips, so calling it on a saved item unsaves it.
 */
export default function WishlistPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: listings.wishlist,
  });

  const toggle = useMutation({
    mutationFn: (pid: string) => listings.toggleWishlist(pid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader
        title="Wishlist"
        subtitle="Items you saved. Tapping remove calls the same idempotent toggle the listing page uses."
      />

      <div className="mt-6">
        {query.isLoading && <Loading label="Loading wishlist…" />}
        {query.error && <ErrorState error={query.error} />}

        {query.data && items.length === 0 && (
          <EmptyState
            title="Nothing saved yet"
            hint="Open any listing and tap Save to keep it here."
          />
        )}

        {items.length > 0 && (
          <Card>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={item.pid}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/marketplace/${item.pid}`)}
                      className="block truncate text-left font-medium hover:underline"
                    >
                      {item.title}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {item.vertical}
                      {typeof item.price_kobo === "number"
                        ? ` · ${koboToNaira(item.price_kobo)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={toggle.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove "${item.title}" from your wishlist?`)) {
                        toggle.mutate(item.pid);
                      }
                    }}
                    className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {toggle.error && (
          <div className="mt-4">
            <ErrorState error={toggle.error} />
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className={buttonClass}
          >
            Browse the marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

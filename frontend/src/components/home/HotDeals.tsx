import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Flame, ShoppingBag } from "lucide-react";
import { listings, koboToNaira } from "@/api";
import { Money } from "@/components/ui/primitives";

/**
 * Discounted listings, straight from the backend: `discount_percent` is a
 * real field on ListingResponse, so "deals" are listings the seller actually
 * marked down — filtered client-side from the live browse feed. No mock data.
 */
export default function HotDeals() {
  const dealsQ = useQuery({
    queryKey: ["listings", "deals"],
    queryFn: () => listings.browse({ page: 1, page_size: 24, sort: "newest" }),
  });

  const deals = (dealsQ.data?.items ?? []).filter(
    (l) => typeof l.discount_percent === "number" && l.discount_percent > 0,
  );

  if (dealsQ.isLoading) {
    return (
      <section className="py-10">
        <div className="container-custom">
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        </div>
      </section>
    );
  }

  if (deals.length === 0) return null;

  return (
    <section className="py-10">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold inline-flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" /> Hot Deals
          </h2>
          <Link to="/shop" className="text-primary hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deals.slice(0, 8).map((l) => (
            <Link key={l.pid} to={`/shop/${l.pid}`} className="card group">
              <div className="relative h-40 bg-gradient-to-br from-orange-50 to-primary-50 flex items-center justify-center overflow-hidden">
                <ShoppingBag className="h-10 w-10 text-primary/30" />
                <span className="absolute top-3 right-3 rounded-full bg-orange-500 text-white px-2.5 py-0.5 text-xs font-bold">
                  -{l.discount_percent}%
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{l.title}</h3>
                <div className="flex items-baseline gap-2">
                  <Money kobo={l.price_kobo} display={l.price_display} className="text-primary font-bold" />
                  {typeof l.discount_percent === "number" &&
                    l.discount_percent > 0 &&
                    typeof l.price_kobo === "number" &&
                    l.price_kobo > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        {koboToNaira(Math.round(l.price_kobo / (1 - l.discount_percent / 100)))}
                      </span>
                    )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

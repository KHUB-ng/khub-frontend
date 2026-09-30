import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingCart, Package } from "lucide-react";
import { listings } from "@/api";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductCatalogProps {
  category?: string;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  category,
  searchQuery: propSearchQuery,
}) => {
  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const { addToCart } = useCart();

  const q = propSearchQuery?.trim() || "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog", category, q, minPrice, maxPrice, sort, page],
    queryFn: () =>
      q
        ? listings.search(q, {
            vertical: "product",
            category,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            sort,
            page,
            page_size: PAGE_SIZE,
          })
        : listings.browse({
            vertical: "product",
            category,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            sort,
            page,
            page_size: PAGE_SIZE,
          }),
  });

  const products = data?.items ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {category ? category : "All Products"}
          </h1>
          <p className="text-muted-foreground mt-1">{totalItems} products found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(1);
          }}
          placeholder="Min price (₦)"
          inputMode="decimal"
          className="input-field w-36"
        />
        <input
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
          placeholder="Max price (₦)"
          inputMode="decimal"
          className="input-field w-36"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as typeof sort);
            setPage(1);
          }}
          className="input-field w-44"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="font-medium text-foreground">Could not load products</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again in a moment.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-foreground">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.pid}
                className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all"
              >
                <Link to={`/shop/${product.pid}`} className="block">
                  <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                </Link>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {[product.category, product.location].filter(Boolean).join(" • ") ||
                      "Marketplace"}
                  </p>
                  <Link to={`/shop/${product.pid}`}>
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-base font-bold text-foreground">
                      {product.price_display ?? ""}
                    </p>
                    <button
                      onClick={() => {
                        addToCart({
                          pid: product.pid,
                          id: product.pid,
                          name: product.title,
                          priceDisplay: product.price_display ?? "",
                          image: "",
                          seller: product.category ?? "",
                        });
                        toast.success(`${product.title} added to cart!`);
                      }}
                      className="btn-primary h-8 text-xs px-3 flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center py-8">
              <button onClick={() => setPage((p) => p + 1)} className="btn-primary px-6 py-2">
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

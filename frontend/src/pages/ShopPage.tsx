import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search, Loader2, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { listings } from "@/api";
import { toast } from "sonner";

const categories = ["All", "Phones", "Fashion", "Computing", "Electronics", "Home & Office", "Groceries"];

const PAGE_SIZE = 20;

const ShopPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const categoryParam = selectedCategory === "All" ? undefined : selectedCategory;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shop-listings", categoryParam, submittedQuery, page],
    queryFn: () =>
      submittedQuery
        ? listings.search(submittedQuery, {
            vertical: "product",
            category: categoryParam,
            page,
            page_size: PAGE_SIZE,
          })
        : listings.browse({
            vertical: "product",
            category: categoryParam,
            page,
            page_size: PAGE_SIZE,
          }),
  });

  const products = data?.items ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const pickCategory = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query.trim());
    setPage(1);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("shop")}</h1>
        <span className="text-sm text-muted-foreground">{totalItems} products</span>
      </div>

      {/* Search (server-side FTS) */}
      <form onSubmit={submitSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => pickCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "gradient-purple text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-foreground font-medium">Could not load products</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again in a moment.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground font-medium">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or category.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.pid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.05 }}
                className="group border border-border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all"
              >
                <Link to={`/shop/${product.pid}`} className="block">
                  <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                </Link>
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {[product.category, product.location].filter(Boolean).join(" • ") || "Marketplace"}
                    </span>
                  </div>
                  <Link to={`/shop/${product.pid}`}>
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-base font-bold text-foreground">
                      {product.price_display ?? ""}
                    </p>
                    <Button
                      size="sm"
                      className="gradient-purple text-primary-foreground h-8 text-xs"
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
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShopPage;

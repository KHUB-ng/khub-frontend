import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Star,
  Shield,
  Truck,
  Share2,
  Heart,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { listings, ApiError } from "@/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);

  const {
    data: detail,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["listing", productId],
    queryFn: () => listings.get(productId!),
    enabled: !!productId,
  });

  const { data: reviews } = useQuery({
    queryKey: ["listing-reviews", productId],
    queryFn: () => listings.reviews(productId!),
    enabled: !!productId,
  });

  const wishlistMutation = useMutation({
    mutationFn: (pid: string) => listings.toggleWishlist(pid),
    onSuccess: (res) => {
      toast.success(res.saved ? "Added to wishlist" : "Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.description : "Could not update wishlist",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
        <Link to="/shop" className="text-primary mt-4 inline-block">
          ← Back to Shop
        </Link>
      </div>
    );
  }

  const { listing, images } = detail;

  const handleAddToCart = () => {
    addToCart({
      pid: listing.pid,
      id: listing.pid,
      name: listing.title,
      priceDisplay: listing.price_display ?? "",
      image: images[0] ?? "",
      seller: listing.category ?? "",
    });
    toast.success(`${listing.title} added to cart!`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Product link copied!");
  };

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="container py-6 max-w-4xl">
      <Link
        to="/shop"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Images from GET /api/listings/{pid} -> {listing, images} */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border shrink-0 ${
                    i === activeImage ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">
                {[listing.category, listing.location].filter(Boolean).join(" • ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
            {avgRating !== null && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-medium text-foreground">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({reviews!.length} reviews)
                </span>
              </div>
            )}
          </div>

          <p className="text-3xl font-bold text-foreground">
            {listing.price_display ?? ""}
          </p>

          {listing.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {listing.description}
            </p>
          )}

          {/* Trust indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Escrow Protected — Pay safely</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="w-4 h-4 text-primary" />
              <span>Delivery arranged with the seller after purchase</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddToCart}
              className="flex-1 gradient-purple text-primary-foreground"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={!user || wishlistMutation.isPending}
              onClick={() => wishlistMutation.mutate(listing.pid)}
              className="border-border text-foreground"
              title={user ? "Toggle wishlist" : "Log in to save items"}
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleShare}
              className="border-border text-foreground"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Reviews (public read: GET /api/listings/{pid}/reviews) */}
      <div className="mt-10 p-6 border border-border rounded-xl bg-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Customer Reviews
        </h2>
        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first to buy and review this item.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.pid} className="border-b border-border pb-3 last:border-0">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i <= r.rating
                          ? "fill-warning text-warning"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-sm text-foreground mt-1">{r.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;

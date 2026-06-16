import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore }     from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import { useAuthStore }     from "../store/AuthStore";

// ─── placeholder until real cloud URLs provided ────────────────────────
const PH = "https://placehold.co/400x400/92400e/fef3c7?text=🐟";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/*
  ProductCard — reusable grid card
  Receives a product object from the API:
  {
    id, slug, nameEn, nameTa, categoryName,
    primaryImage, minPrice, minComparePrice,
    isBestseller, isNew, avgRating, reviewCount,
    variants[]: [{ id, price, comparePrice, weightLabel, stockQty }]
  }
*/
export default function ProductCard({ product }) {
  const { addItem }              = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const { token }                = useAuthStore();

  const wishlisted = isWishlisted(product.id);
  const firstV     = product.variants?.[0];
  const price      = firstV?.price       ?? product.minPrice        ?? 0;
  const compare    = firstV?.comparePrice ?? product.minComparePrice ?? 0;
  const hasDisc    = compare > price;
  const disc       = hasDisc ? Math.round(((compare - price) / compare) * 100) : 0;
  const image      = product.primaryImage || PH;
  const inStock    = (firstV?.stockQty ?? 1) > 0;

  const handleCart = (e) => {
    e.preventDefault();
    if (!firstV || !inStock) return;
    addItem({
      variantId:    firstV.id,
      productId:    product.id,
      productName:  product.nameEn,
      nameTa:       product.nameTa,
      image,
      price:        firstV.price,
      comparePrice: firstV.comparePrice,
      weight:       firstV.weightLabel,
    });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggle(product.id, token);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="card-hover">

        {/* ── Image ─────────────────────────────────────────────── */}
        <div className="relative aspect-square overflow-hidden bg-brand-50 rounded-t-2xl">
          <img
            src={image}
            alt={product.nameEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PH; }}
          />

          {/* discount badge */}
          {hasDisc && (
            <span className="absolute top-2 left-2 badge-red">−{disc}%</span>
          )}

          {/* label badge */}
          {product.isBestseller && (
            <span className="absolute top-2 right-9 badge-amber">Best Seller</span>
          )}
          {product.isNew && !product.isBestseller && (
            <span className="absolute top-2 right-9 badge-green">New</span>
          )}

          {/* out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-t-2xl">
              <span className="badge-gray px-3 py-1">Out of Stock</span>
            </div>
          )}

          {/* wishlist heart */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 transition-colors ${
                wishlisted
                  ? "fill-rose-500 stroke-rose-500"
                  : "fill-none stroke-amber-400 hover:stroke-rose-400"
              }`}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* ── Info ──────────────────────────────────────────────── */}
        <div className="p-3">
          <p className="font-body text-[10px] text-amber-500 uppercase tracking-wider font-medium mb-0.5">
            {product.categoryName}
          </p>

          <h3 className="font-body text-sm font-semibold text-brand-900 leading-snug line-clamp-2 mb-0.5">
            {product.nameEn}
          </h3>

          {product.nameTa && (
            <p className="font-tamil text-[11px] text-amber-400 mb-1.5 line-clamp-1">
              {product.nameTa}
            </p>
          )}

          {/* stars */}
          {product.avgRating > 0 && (
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={10}
                  className={
                    s <= Math.round(product.avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-amber-100 text-amber-200"
                  }
                />
              ))}
              <span className="font-num text-[10px] text-amber-500 ml-0.5">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* price + cart button */}
          <div className="flex items-end justify-between gap-1">
            <div>
              <span className="font-num text-base font-bold text-brand-900">
                {rupee(price)}
              </span>
              {hasDisc && (
                <span className="font-num text-xs text-amber-400 line-through ml-1.5">
                  {rupee(compare)}
                </span>
              )}
              {firstV?.weightLabel && (
                <p className="font-body text-[10px] text-amber-500 mt-0.5">
                  {firstV.weightLabel}
                </p>
              )}
            </div>

            <button
              onClick={handleCart}
              disabled={!inStock}
              aria-label="Add to cart"
              className="bg-brand-800 hover:bg-brand-900 disabled:bg-amber-200 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors shrink-0 active:scale-90"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>

      </div>
    </Link>
  );
}
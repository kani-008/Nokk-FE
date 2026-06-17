import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore }     from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import { useAuthStore }     from "../store/AuthStore";

import comboImg from "../../assets/products/combo.jpg";

// ─── placeholder until real cloud URLs provided ────────────────────────
const PH = comboImg;

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
    <Link to={`/products/${product.slug}`} className="group block h-full">
      <div className="card-hover overflow-hidden h-full flex flex-col justify-between">
        <div>
          {/* ── Image ─────────────────────────────────────────────── */}
          <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-2xl">
            <img
              src={image}
              alt={product.nameEn}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.src = PH; }}
            />

            {/* discount badge */}
            {hasDisc && (
              <span className="absolute top-2.5 left-2.5 badge-red shadow-sm">−{disc}%</span>
            )}

            {/* label badge */}
            {product.isBestseller && (
              <span className="absolute top-2.5 right-10 badge-amber shadow-sm">Best Seller</span>
            )}
            {product.isNew && !product.isBestseller && (
              <span className="absolute top-2.5 right-10 badge-green shadow-sm">New</span>
            )}

            {/* out of stock overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-t-2xl">
                <span className="badge-gray px-3 py-1.5 font-bold shadow-sm">Out of Stock</span>
              </div>
            )}

            {/* wishlist heart */}
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-2.5 right-2.5 w-7.5 h-7.5 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 transition-colors ${
                  wishlisted
                    ? "fill-rose-500 stroke-rose-500"
                    : "fill-none stroke-sandal-500 hover:stroke-rose-500"
                }`}
                strokeWidth="2.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* ── Info ──────────────────────────────────────────────── */}
          <div className="p-4.5">
            <p className="font-body text-[10px] text-sandal-600 uppercase tracking-widest font-extrabold mb-1">
              {product.categoryName}
            </p>

            <h3 className="font-body text-[15px] font-bold text-gray-800 leading-snug line-clamp-2 mb-1 group-hover:text-sandal-700 transition-colors">
              {product.nameEn}
            </h3>

            {product.nameTa && (
              <p className="font-tamil text-xs text-sandal-500 font-semibold mb-2 line-clamp-1">
                {product.nameTa}
              </p>
            )}

            {/* stars */}
            {product.avgRating > 0 && (
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={
                      s <= Math.round(product.avgRating)
                        ? "fill-sandal-400 text-sandal-400"
                        : "fill-gray-100 text-gray-300"
                    }
                  />
                ))}
                <span className="font-num text-[10px] text-gray-500 font-bold ml-1">
                  {product.avgRating} ({product.reviewCount})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* price + cart button */}
        <div className="px-4.5 pb-4.5 pt-0 flex items-center justify-between gap-2 border-t border-gray-50 mt-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-num text-base font-extrabold text-gray-800">
                {rupee(price)}
              </span>
              {hasDisc && (
                <span className="font-num text-xs text-gray-400 line-through">
                  {rupee(compare)}
                </span>
              )}
            </div>
            {firstV?.weightLabel && (
              <p className="font-body text-[11px] text-gray-500 font-medium mt-0.5">
                {firstV.weightLabel}
              </p>
            )}
          </div>

          <button
            onClick={handleCart}
            disabled={!inStock}
            aria-label="Add to cart"
            className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-sandal-100 p-2.5 rounded-xl transition-all duration-300 shrink-0 active:scale-95 group-hover:bg-sandal-600 group-hover:text-white"
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </Link>
  );
}
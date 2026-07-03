import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import { useAuthStore } from "../store/AuthStore";

// ─── placeholder until real cloud URLs provided ────────────────────────
const PH = "";

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
import API from "../../ApiCall/Api.jsx";

export default function ProductCard({ product, selectedWeights = [] }) {
  const { items } = useCartStore();
  const { isWishlisted } = useWishlistStore();
  const { token, isAuthenticated } = useAuthStore();

  const [shakeKey, setShakeKey] = useState(0);

  const wishlisted = isWishlisted(product.id);

  const normWeight = (w) => String(w || "").toLowerCase().replace(/\s+/g, "");

  // When a weight filter is active, show the matching variant's price/weight.
  // Falls back to first variant when no filter is set or no match found.
  const firstV = (
    selectedWeights.length > 0
      ? product.variants?.find((v) =>
          selectedWeights.some((sw) => normWeight(sw) === normWeight(v.weightLabel))
        )
      : null
  ) ?? product.variants?.[0];

  const price = firstV?.price ?? product.minPrice ?? 0;
  const compare = firstV?.comparePrice ?? product.minComparePrice ?? 0;
  const hasDisc = compare > price;
  const disc = hasDisc ? Math.round(((compare - price) / compare) * 100) : 0;
  const image = product.primaryImage || PH;
  const inStock = firstV?.inStock ?? true;
  const cartItem = firstV ? items.find((i) => i.variantId === firstV.id) : null;
  const inCart = !!cartItem;

  // Fires a quick side-to-side shake on the cart icon — only for items
  // already in cart. Bumping a counter (used as a key below) guarantees
  // the CSS animation restarts even on rapid repeat clicks.
  const shake = () => setShakeKey((k) => k + 1);

  const handleCart = async (e) => {
    e.preventDefault();
    if (!firstV || !inStock) return;

    // Already in cart: just replay the shake feedback, don't add again.
    // Quantity changes for items already in the cart happen on the Cart page.
    if (inCart) {
      shake();
      return;
    }

    const itemData = {
      variantId: firstV.id,
      productId: product.id,
      productName: product.nameEn,
      nameTa: product.nameTa,
      image,
      price: firstV.price,
      comparePrice: firstV.comparePrice,
      weight: firstV.weightLabel,
      quantity: 1,
    };

    if (isAuthenticated && token) {
      try {
        const response = await API.post("/cart/add-item", {
          variantId: firstV.id,
          quantity: 1,
        });
        console.log(response.data);
        const serverItems = (response.data.cart?.items ?? []).map((i) => ({
          itemId:       i.itemId,
          variantId:    i.variantId,
          productId:    i.productId,
          productName:  i.nameEn ?? i.name,
          nameTa:       i.nameTa,
          image:        i.primaryImage,
          price:        i.price,
          comparePrice: i.comparePrice,
          weight:       i.weightLabel,
          quantity:     i.quantity,
        }));
        useCartStore.getState().setItems(serverItems);
      } catch (err) {
        console.error("addItem server sync failed:", err);
      }
    } else {
      useCartStore.getState().addItemLocal(itemData);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    const already = wishlisted;
    // optimistic local update
    if (already) {
      useWishlistStore.getState().removeId(product.id);
    } else {
      useWishlistStore.getState().addId(product.id);
    }

    if (isAuthenticated && token) {
      try {
        if (already) {
          await API.delete("/wishlist/remove-item", { data: { productId: product.id } });
        } else {
          await API.post("/wishlist/add-item", { productId: product.id });
        }
      } catch (err) {
        console.error("wishlist sync failed, reverting:", err);
        // revert local change
        if (already) {
          useWishlistStore.getState().addId(product.id);
        } else {
          useWishlistStore.getState().removeId(product.id);
        }
      }
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block h-full">
      <div className="card-hover overflow-hidden h-full flex flex-col justify-between">
        <div>
          {/* ── Image ─────────────────────────────────────────────── */}
          <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-md">
            <img
              src={image}
              alt={product.nameEn}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.src = PH; }}
            />

            {/* Best Seller / New labels */}
            {product.isBestseller && (
              <span className="absolute top-2.5 left-2.5 badge-amber shadow-sm">Best Seller</span>
            )}
            {/* {product.isNew && !product.isBestseller && (
              <span className="absolute top-2.5 left-2.5 badge-green shadow-sm">New</span>
            )} */}

            {/* out of stock overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-t-md">
                <span className="badge-gray px-3 py-1.5 font-bold shadow-sm">Out of Stock</span>
              </div>
            )}

            {/* wishlist heart */}
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-1.5 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-4.5 h-4.5 transition-colors ${wishlisted
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

            <h3 className="font-body text-[15px] font-bold text-gray-800 leading-snug line-clamp-2 mb-1 group-hover:text-sandal-700 transition-colors prod-card-title-fluid">
              {product.nameEn}
            </h3>

            {product.nameTa && (
              <p className="font-tamil text-xs text-sandal-500 font-semibold mb-2 line-clamp-1">
                {product.nameTa}
              </p>
            )}



            {/* stars */}
            {product.avgRating > 0 && (
              <div className="flex items-center gap-0.5  mt-1 -mb-2">
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
              <span className="font-num text-base font-extrabold text-gray-800 prod-card-price-fluid">
                {rupee(price)}
              </span>
              {hasDisc && (
                <span className="font-num text-xs text-gray-400 line-through">
                  {rupee(compare)}
                </span>
              )}
            </div>
            {firstV?.weightLabel ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-body text-[11px] text-gray-500 font-medium">
                  {firstV.weightLabel}
                </span>
                {hasDisc && (
                  <span className="text-red-600 font-semibold !border-none !px-1.5 !py-0.5 !text-[11px]">
                    −{disc}%
                  </span>
                )}
              </div>
            ) : (
              hasDisc && (
                <span className="badge-red !border-none !px-1.5 !py-0.5 !text-[9px] mt-0.5 w-fit">
                  −{disc}%
                </span>
              )
            )}
          </div>

          {/*
            Single cart button, no -/+ stepper.
            - Default (not in cart): sandal-colored, matches existing palette.
            - In cart: shifts to the navbar's dark/gray "active" color.
            - Every click (even repeats on an in-cart item) replays a shake.
          */}
          <button
            onClick={handleCart}
            disabled={!inStock}
            aria-label={inCart ? "Already in cart" : "Add to cart"}
            className={`px-3 py-2 rounded-xl  transition-colors duration-300 shrink-0 cursor-pointer overflow-hidden
              ${!inStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : inCart
                  ? "bg-gray-800 text-white"
                  : "bg-sandal-500 text-white hover:bg-sandal-600 group-hover:bg-sandal-600"
              }`}
          >
            <span key={shakeKey} className={`inline-flex ${shakeKey > 0 ? "animate-cart-shake" : ""}`}>
              <ShoppingCart size={15} />
            </span>
          </button>

          {/* scoped keyframes for the cart-icon shake feedback */}
          <style>{`
            @keyframes cart-shake {
              0%   { transform: translateX(0) rotate(0); }
              15%  { transform: translateX(-3px) rotate(-8deg); }
              30%  { transform: translateX(3px) rotate(8deg); }
              45%  { transform: translateX(-3px) rotate(-6deg); }
              60%  { transform: translateX(3px) rotate(6deg); }
              75%  { transform: translateX(-2px) rotate(-3deg); }
              100% { transform: translateX(0) rotate(0); }
            }
            .animate-cart-shake {
              animation: cart-shake 0.4s ease-in-out;
            }
          `}</style>
        </div>
      </div>
    </Link>
  );
}
import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore }  from "../components/store/CartStore";
import { useAuthStore }  from "../components/store/AuthStore";
import { useBuyNowStore } from "../components/store/BuyNowStore";
import { useDeliverySettings } from "../hookqueries/useHome";
import { useToast } from "../components/useToast";
import API from "../ApiCall/Api";

import comboImg from "../assets/products/combo.jpg";
const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// Shared mapper — always include slug so product links don't break after mutations
const mapServerItems = (raw = []) =>
  raw.map((i) => ({
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
    slug:         i.slug,
    inStock:      i.inStock,
  }));

// ══════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <ShoppingBag size={56} className="text-amber-200 mb-4" />
      <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Your cart is empty</h2>
      <p className="font-body text-amber-600 text-sm mb-7 max-w-xs">
        Add some dry fish or pickles to get started!
      </p>
      <Link to="/products" className="btn-lg btn-primary">
        Browse Products <ArrowRight size={16} />
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ORDER SUMMARY CARD
// Coupon entry has moved to the Payment step of checkout.
// This widget shows the coupon effect (discount line) if one is applied,
// but does not provide an input to enter new coupon codes.
// ══════════════════════════════════════════════════════════════════════
function OrderSummary({ subtotal, discount, shipping, total, coupon, onCheckout, loading, freeShippingThreshold }) {
  return (
    <div className="card p-5 sticky top-24">
      <h2 className="font-display text-base font-bold text-brand-900 mb-4">Order Summary</h2>

      <div className="space-y-2.5 text-sm mb-4">
        <div className="flex justify-between font-body text-amber-800">
          <span>Subtotal</span>
          <span className="font-num">{rupee(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-body text-green-600">
            <span>Coupon ({coupon?.code})</span>
            <span className="font-num">−{rupee(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-body text-amber-800">
          <span>Delivery</span>
          <span className={`font-num ${shipping === 0 ? "text-green-600 font-semibold" : ""}`}>
            {shipping === 0 ? "FREE" : rupee(shipping)}
          </span>
        </div>
        {shipping > 0 && (
          <p className="font-body text-[11px] text-amber-500">
            Add {rupee(freeShippingThreshold - subtotal)} more for free delivery
          </p>
        )}
      </div>

      <div className="border-t border-amber-100 pt-3 flex justify-between items-center mb-5">
        <span className="font-body text-base font-bold text-brand-900">Total</span>
        <span className="font-num text-lg font-extrabold text-brand-900">{rupee(total)}</span>
      </div>

      <button onClick={onCheckout} disabled={loading} className="btn-lg btn-primary w-full">
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
          : <>Proceed to Checkout <ArrowRight size={16} /></>
        }
      </button>

      <Link to="/products" className="font-body text-xs text-amber-500 hover:text-brand-700 text-center block mt-3 transition-colors">
        ← Continue Shopping
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CART ITEM ROW
// ══════════════════════════════════════════════════════════════════════
function CartItem({ item, onQty, onRemove, syncing }) {
  const disc = item.comparePrice > item.price
    ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
    : 0;

  return (
    <div className="card p-4 flex gap-3 sm:gap-4">
      <Link to={`/products/${item.slug || ""}`} className="shrink-0">
        <img
          src={item.image || PH}
          alt={item.productName}
          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-amber-50"
          onError={(e) => { e.target.src = PH; }}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/products/${item.slug || ""}`}>
              <h3 className="font-body text-sm font-semibold text-brand-900 leading-snug line-clamp-2 hover:text-brand-700">
                {item.productName}
              </h3>
              {item.nameTa && (
                <p className="font-tamil text-[11px] text-amber-400 mt-0.5">{item.nameTa}</p>
              )}
            </Link>
            <p className="font-body text-xs text-amber-500 mt-1">{item.weight}</p>
            {item.inStock === false && (
              <span className="inline-block mt-1 font-body text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Out of stock
              </span>
            )}
          </div>
          <button
            onClick={() => onRemove(item.variantId)}
            className="shrink-0 p-1.5 text-amber-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div>
            <span className="font-num text-base font-bold text-brand-900">{rupee(item.price)}</span>
            {item.comparePrice > item.price && (
              <>
                <span className="font-num text-xs text-amber-400 line-through ml-1.5">{rupee(item.comparePrice)}</span>
                <span className="badge-red ml-1.5">−{disc}%</span>
              </>
            )}
          </div>

          {/* qty stepper */}
          <div className="flex items-center border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => onQty(item.variantId, item.quantity - 1)}
              className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.25rem,1vw,0.375rem)] text-brand-700 hover:bg-amber-50 transition-colors active:bg-amber-100"
              aria-label="Decrease quantity"
            >
              <Minus size="clamp(12px,1.5vw,16px)" />
            </button>
            <span className="px-[clamp(0.5rem,2vw,0.75rem)] font-num text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold text-brand-900 min-w-[clamp(1.5rem,3vw,2rem)] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onQty(item.variantId, item.quantity + 1)}
              className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.25rem,1vw,0.375rem)] text-brand-700 hover:bg-amber-50 transition-colors active:bg-amber-100"
              aria-label="Increase quantity"
            >
              <Plus size="clamp(12px,1.5vw,16px)" />
            </button>
          </div>
        </div>

        <p className="font-body text-xs text-amber-500 mt-1.5 text-right">
          Line total: <span className="font-num font-semibold text-amber-700">{rupee(item.price * item.quantity)}</span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CART PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Cart() {
  const navigate = useNavigate();

  const {
    items,
    coupon,
    subtotal,
    discount,
    shipping,
    total,
    setItems,
    updateQtyLocal,
    removeItemLocal,
    addItemLocal,
    setDeliveryConfig,
    freeShippingThreshold,
  } = useCartStore();

  const { isAuthenticated } = useAuthStore();
  const { setError, displayedError, displayedType, toastVisible } = useToast();

  // Sync delivery config from backend into the cart store
  const { data: deliverySettings } = useDeliverySettings();
  useEffect(() => {
    if (deliverySettings) {
      setDeliveryConfig(deliverySettings.freeShippingThreshold, deliverySettings.flatDeliveryCharge);
    }
  }, [deliverySettings]);

  // Clear any buy-now item when entering the cart page
  useEffect(() => {
    useBuyNowStore.getState().clearItem();
  }, []);

  // per-item syncing flag — shows spinner, disables buttons while API call is in-flight
  const [syncingItems, setSyncingItems] = useState({});

  // debounce state for qty updates (prevents a request per tap)
  const debounceRef  = useRef({}); // variantId → timeoutId
  const pendingQty   = useRef({}); // variantId → latest desired qty

  const setSyncing = (variantId, val) =>
    setSyncingItems((prev) => ({ ...prev, [variantId]: val }));

  // ── remove: optimistic remove + background server sync ────────────
  const handleRemoveItem = useCallback(async (variantId) => {
    // Cancel any pending qty debounce for this item
    clearTimeout(debounceRef.current[variantId]);
    delete pendingQty.current[variantId];

    // Save snapshot for potential revert
    const snapshot = useCartStore.getState().items.find((i) => i.variantId === variantId);

    // 1. Remove immediately from UI
    removeItemLocal(variantId);

    if (!isAuthenticated || !snapshot?.itemId) return;

    try {
      const res = await API.delete("/cart/remove-item", { data: { itemId: snapshot.itemId } });
      setItems(mapServerItems(res.data.cart?.items));
    } catch {
      try {
        const res = await API.get("/cart/get-cart");
        setItems(mapServerItems(res.data.cart?.items));
      } catch {
        addItemLocal(snapshot);
      }
    }
  }, [isAuthenticated, removeItemLocal, addItemLocal, setItems]);

  const handleUpdateQty = useCallback((variantId, quantity) => {
    if (quantity < 1) {
      handleRemoveItem(variantId);
      return;
    }

    // 1. Update UI immediately (zero perceived lag)
    updateQtyLocal(variantId, quantity);

    if (!isAuthenticated) return;

    // 2. Track latest desired qty across rapid taps
    pendingQty.current[variantId] = quantity;

    // 3. Debounce: only send API call 400ms after last tap
    clearTimeout(debounceRef.current[variantId]);
    debounceRef.current[variantId] = setTimeout(async () => {
      const target = pendingQty.current[variantId];
      const item = useCartStore.getState().items.find((i) => i.variantId === variantId);
      if (!item?.itemId) return;

      setSyncing(variantId, true);
      try {
        const res = await API.put("/cart/update-item", { itemId: item.itemId, quantity: target });
        setItems(mapServerItems(res.data.cart?.items));
      } catch (err) {
        // Server rejected (e.g. stock exceeded) — show message and revert
        const msg = err?.response?.data?.message || "Could not update quantity";
        setError(msg);
        try {
          const res = await API.get("/cart/get-cart");
          setItems(mapServerItems(res.data.cart?.items));
        } catch { /* silent */ }
      } finally {
        setSyncing(variantId, false);
      }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, updateQtyLocal, setItems, handleRemoveItem]);

  // ── checkout ───────────────────────────────────────────────────────
  const handleCheckout = () => {
    useBuyNowStore.getState().clearItem();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    if (items.every((i) => i.inStock === false)) return;
    navigate("/checkout");
  };

  // ── derived ────────────────────────────────────────────────────────
  const sub  = subtotal();
  const disc = discount();
  const ship = shipping();
  const tot  = total();

  if (items.length === 0) return <EmptyCart />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-6">
        My Cart
        <span className="font-num text-base font-normal text-amber-500 ml-2">
          ({items.reduce((n, i) => n + i.quantity, 0)} items)
        </span>
      </h1>

      {/* Toast notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        {displayedError && (
          <div className={`px-4 py-2.5 rounded-xl shadow-lg text-sm font-body font-medium ${displayedType === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"}`}>
            {displayedError}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Cart items list ───────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {items.map((item) => (
            <CartItem
              key={item.variantId}
              item={item}
              onQty={handleUpdateQty}
              onRemove={handleRemoveItem}
              syncing={!!syncingItems[item.variantId]}
            />
          ))}

          <div className="lg:hidden">
            <OrderSummary
              subtotal={sub} discount={disc} shipping={ship} total={tot}
              coupon={coupon}
              onCheckout={handleCheckout} loading={false} freeShippingThreshold={freeShippingThreshold}
            />
          </div>
        </div>

        {/* ── Sticky summary (desktop) ──────────────────────────── */}
        <div className="hidden lg:block w-80 shrink-0">
          <OrderSummary
            subtotal={sub} discount={disc} shipping={ship} total={tot}
            coupon={coupon}
            onCheckout={handleCheckout} loading={false} freeShippingThreshold={freeShippingThreshold}
          />
        </div>
      </div>
    </div>
  );
}

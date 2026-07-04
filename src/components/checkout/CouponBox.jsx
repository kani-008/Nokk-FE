import { useState } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { useCartStore } from "../store/CartStore";
import { usePublicCoupons } from "../../hookqueries/useCoupons";
import API from "../../ApiCall/Api";

export default function CouponBox() {
  const { coupon, setCoupon, removeCoupon, subtotal } = useCartStore();
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Load public coupons from backend
  const { data: publicCoupons = [], isLoading: couponsLoading, isError: couponsError } = usePublicCoupons();
  console.log("[CouponBox] STATUS: public coupons fetch —", couponsLoading ? "loading" : couponsError ? "error" : `ok (${publicCoupons.length} coupons)`, publicCoupons.map(c => c.code));

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      console.warn("[CouponBox] STATUS 400 — empty coupon code, aborted");
      return;
    }
    setError("");
    setLoading(true);
    const sub = subtotal();
    console.log("[CouponBox] REQUEST — POST /coupons/validate | code:", trimmed, "| subtotal: ₹" + sub);
    try {
      const res = await API.post("/coupons/validate", { code: trimmed, subtotal: sub });
      console.log("[CouponBox] STATUS", res.status, "— validate success | response:", res.data);
      if (!res.data.coupon) {
        console.warn("[CouponBox] STATUS 200 but no coupon object in response:", res.data);
        setError("Coupon could not be applied. Please try again.");
        return;
      }
      setCoupon(res.data.coupon);
      console.log("[CouponBox] STATUS 200 — coupon applied to store:", {
        code: res.data.coupon.code,
        discountPercent: res.data.coupon.discountPercent,
        discountFlat: res.data.coupon.discountFlat,
        discountAmount: res.data.discountAmount,
        freeShipping: res.data.freeShipping,
      });
      setCode("");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || "Invalid coupon code";
      console.error("[CouponBox] STATUS", status, "— validate failed | message:", msg, "| full error:", err.response?.data || err.message);
      if (status === 401) {
        setError("Please log in to apply a coupon.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-green-600" />
          <div>
            <p className="font-num text-sm font-bold text-green-800 tracking-wider">{coupon.code}</p>
            <p className="font-body text-xs text-green-600">
              {coupon.discountType === "percentage"
                ? `${coupon.discountValue}% off applied`
                : `₹${coupon.discountValue} off applied`}
            </p>
          </div>
        </div>
        <button onClick={removeCoupon} className="text-green-600 hover:text-red-500 transition-colors p-1" aria-label="Remove coupon">
          <X size={16} />
        </button>
      </div>
    );
  }

  const hasCode = !!code.trim();

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder="Enter coupon code"
          className="field-input flex-1 tracking-wider py-2 px-3.5 text-xs"
        />
        <button
          onClick={handleApply}
          disabled={loading || !hasCode}
          className={`btn-sm font-semibold border-[1.5px] rounded-2xl shrink-0 transition-all duration-200 ${
            hasCode
              ? "bg-transparent text-gray-800 border-gray-800 hover:bg-gray-100 cursor-pointer"
              : "bg-transparent text-gray-300 border-gray-200 cursor-not-allowed"
          }`}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="font-body text-xs text-red-500 mt-1.5">{error}</p>}

      {publicCoupons.length > 0 && (
        <div className="mt-2.5">
          <p className="font-body text-[10px] text-amber-500 font-bold tracking-wider mb-1">
            Available Coupon Codes
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {publicCoupons.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { setCode(o.code); setError(""); console.log("[CouponBox] Chip selected — coupon code set to:", o.code); }}
                className="inline-flex items-center gap-1 font-num text-xs font-bold bg-[#fdfaf2] text-[#ac8345] border border-[#f5eedf] hover:bg-amber-50 hover:border-amber-200 transition-colors px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Tag size={10} />
                <span>{o.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

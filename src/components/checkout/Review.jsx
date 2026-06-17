import { useState } from "react";
import { MapPin, CreditCard, Truck, ArrowLeft, Loader2, Check } from "lucide-react";
import { PAYMENT_METHODS } from "./Payment";
import { orderApi } from "../../ApiCall/Api.jsx";

import comboImg from "../../assets/products/combo.jpg";

// ─── placeholder ──────────────────────────────────────────────────────
const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Single order item row ──────────────────────────────────────────────
function ReviewItem({ item }) {
  return (
    <div className="flex gap-3 items-center py-3 border-b border-amber-50 last:border-0">
      <img
        src={item.image || PH}
        alt={item.productName}
        className="w-12 h-12 rounded-xl object-cover bg-brand-50 shrink-0"
        onError={(e) => { e.target.src = PH; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-medium text-brand-900 line-clamp-1">
          {item.productName}
        </p>
        <p className="font-body text-xs text-amber-500">
          {item.weight} · Qty {item.quantity}
        </p>
      </div>
      <span className="font-num text-sm font-semibold text-brand-900 shrink-0">
        {rupee(item.price * item.quantity)}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ReviewStep
// ══════════════════════════════════════════════════════════════════════
export default function Review({
  address,
  payMethod,
  items,
  total,
  placing,
  error,
  placedOrderId = null,
  token,
  onBack,
  onChangeAddress,
  onChangePayment,
  onPlaceOrder,
}) {
  const payLabel = PAYMENT_METHODS.find((m) => m.key === payMethod)?.label ?? payMethod;

  const [upiRefId, setUpiRefId] = useState("");
  const [submittingRef, setSubmittingRef] = useState(false);
  const [refSuccess, setRefSuccess] = useState(false);
  const [refError, setRefError] = useState("");

  const handleSubmitRef = async () => {
    if (!upiRefId.trim()) { setRefError("Please enter the 12-digit transaction reference ID."); return; }
    setSubmittingRef(true);
    setRefError("");
    setRefSuccess(false);
    try {
      await orderApi.submitUpiReference(placedOrderId, upiRefId.trim(), token);
      setRefSuccess(true);
    } catch (err) {
      setRefError(err.message || "Failed to submit UPI reference ID");
    } finally {
      setSubmittingRef(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Delivery address summary ─────────────────────────────── */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body text-sm font-bold text-brand-900 flex items-center gap-2">
            <MapPin size={15} className="text-brand-600" /> Delivering to
          </h3>
          {!placedOrderId && (
            <button
              onClick={onChangeAddress}
              className="font-body text-xs text-brand-700 hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {address && (
          <div>
            <p className="font-body text-sm font-semibold text-brand-900">{address.name}</p>
            <p className="font-body text-xs text-amber-600 mt-0.5 leading-relaxed">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""},&nbsp;
              {address.city}, {address.state} – {address.pincode}
            </p>
            <p className="font-body text-xs text-amber-500 mt-0.5">{address.phone}</p>
          </div>
        )}
      </div>

      {/* ── Payment method summary ───────────────────────────────── */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-body text-sm font-bold text-brand-900 flex items-center gap-2">
            <CreditCard size={15} className="text-brand-600" /> Payment
          </h3>
          {!placedOrderId && (
            <button
              onClick={onChangePayment}
              className="font-body text-xs text-brand-700 hover:underline"
            >
              Change
            </button>
          )}
        </div>
        <p className="font-body text-sm text-amber-700">{payLabel}</p>
      </div>

      {/* ── Items list ───────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-body text-sm font-bold text-brand-900 mb-3 flex items-center gap-2">
          <Truck size={15} className="text-brand-600" />
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </h3>
        {items.map((item) => (
          <ReviewItem key={item.variantId} item={item} />
        ))}
      </div>

      {/* ── UPI Reference Submission Card (only if order is placed via UPI) ── */}
      {placedOrderId && (
        <div className="card p-4 sm:p-5 border-brand-700 bg-brand-50/20 space-y-4">
          <h3 className="font-body text-sm font-bold text-brand-900">
            Submit UPI Reference ID
          </h3>
          <p className="font-body text-xs text-amber-600 leading-relaxed">
            Please enter the 12-digit transaction reference ID from your UPI app (GPay/PhonePe/Paytm/etc.) below so we can verify your payment and process your order.
          </p>

          {refSuccess ? (
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl space-y-2">
              <Check size={24} className="text-green-600" />
              <p className="font-body text-sm font-semibold text-center">Reference Submitted Successfully!</p>
              <p className="font-body text-xs text-green-600 text-center">We will verify your payment shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                maxLength={12}
                value={upiRefId}
                onChange={(e) => {
                  setUpiRefId(e.target.value.replace(/\D/g, ""));
                  setRefError("");
                }}
                placeholder="12-digit transaction reference"
                className="field-input"
              />
              {refError && (
                <div className="bg-red-50 border border-red-200 text-red-700 font-body text-xs rounded-xl px-3 py-2.5">
                  {refError}
                </div>
              )}
              <button
                onClick={handleSubmitRef}
                disabled={submittingRef}
                className="btn-md btn-primary w-full"
              >
                {submittingRef ? (
                  <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                ) : (
                  "Submit Reference ID"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
      {!placedOrderId && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={onBack} className="btn-md btn-outline">
            <ArrowLeft size={15} /> Back
          </button>
          <button
            onClick={onPlaceOrder}
            disabled={placing}
            className="btn-lg btn-primary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? (
              <><Loader2 size={16} className="animate-spin" /> Placing order…</>
            ) : (
              `Place Order · ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total)}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
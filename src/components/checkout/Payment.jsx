import { CreditCard, Smartphone, Banknote, ShieldCheck, ArrowLeft, ChevronRight } from "lucide-react";

export const PAYMENT_METHODS = [
  {
    key:   "upi",
    label: "UPI",
    sub:   "GPay, PhonePe, Paytm & more",
    icon:  <Smartphone size={20} />,
  },
  {
    key:   "card",
    label: "Credit / Debit Card",
    sub:   "Visa, Mastercard, RuPay",
    icon:  <CreditCard size={20} />,
  },
  {
    key:   "cod",
    label: "Cash on Delivery",
    sub:   "Pay when you receive",
    icon:  <Banknote size={20} />,
  },
];

// ══════════════════════════════════════════════════════════════════════
// PaymentStep
//
// Props:
//   selected   {string}  — "upi" | "card" | "cod"
//   onSelect   {fn}      — (key) => void
//   onBack     {fn}      — go back to address step
//   onNext     {fn}      — advance to review step
// ══════════════════════════════════════════════════════════════════════
export default function Payment({ selected, onSelect, onBack, onNext }) {
  return (
    <div className="card p-5 sm:p-6">
      {/* header */}
      <div className="flex items-center gap-2 mb-5">
        <CreditCard size={18} className="text-brand-700" />
        <h2 className="font-display text-lg font-bold text-brand-900">Payment Method</h2>
      </div>

      {/* method cards */}
      <div className="space-y-3 mb-6">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-colors ${
              selected === m.key
                ? "border-brand-700 bg-brand-50"
                : "border-amber-100 hover:border-amber-300 bg-white"
            }`}
          >
            {/* radio dot */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              selected === m.key
                ? "border-brand-700 bg-brand-700"
                : "border-amber-300"
            }`}>
              {selected === m.key && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>

            {/* icon */}
            <span className={selected === m.key ? "text-brand-700" : "text-amber-400"}>
              {m.icon}
            </span>

            {/* label */}
            <div>
              <p className="font-body text-sm font-semibold text-brand-900">{m.label}</p>
              <p className="font-body text-xs text-amber-500">{m.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* security note */}
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 mb-6">
        <ShieldCheck size={15} className="text-green-600 shrink-0" />
        <p className="font-body text-xs text-green-700">
          Your payment information is safe &amp; encrypted
        </p>
      </div>

      {/* navigation */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={onBack} className="btn-md btn-outline">
          <ArrowLeft size={15} /> Back
        </button>
        <button onClick={onNext} className="btn-lg btn-primary flex-1 sm:flex-none">
          Review Order <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
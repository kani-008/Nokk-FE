import { Check } from "lucide-react";

const STEPS = [
  { key: "address", label: "Address"       },
  { key: "summary", label: "Order Summary" },
  { key: "payment", label: "Payment"       },
];

// Props:
//   current {string} — "address" | "summary" | "payment"
export default function StepBar({ current }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              {/* circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done   ? "bg-green-500 text-white"  :
                active ? "bg-brand-800 text-white"  :
                         "bg-amber-100 text-amber-400"
              }`}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              {/* label */}
              <span className={`font-body text-[11px] font-medium whitespace-nowrap ${
                active ? "text-brand-900"  :
                done   ? "text-green-600"  :
                         "text-amber-400"
              }`}>
                {step.label}
              </span>
            </div>

            {/* connector line */}
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 transition-colors ${
                done ? "bg-green-400" : "bg-amber-100"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
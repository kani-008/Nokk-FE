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
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;

        return (
          <div key={step.key} className="flex-1 relative flex flex-col items-center">
            {/* connector line */}
            {i < STEPS.length-1 && (
              <div className={`absolute left-[45%] right-[-45%] top-4 h-0.5 -translate-y-1/2 transition-colors ${
                done ? "bg-green-400" : "bg-amber-100"
              }`} />
            )}

            {/* circle */}
            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              done   ? "bg-green-500 text-white"  :
              active ? "bg-brand-800 text-white"  :
                       "bg-amber-100 text-amber-400"
            }`}>
              {done ? <Check size={14} /> : i + 1}
            </div>

            {/* label */}
            <span className={`z-10 mt-1 font-body text-[11px] font-medium whitespace-nowrap ${
              active ? "text-brand-900"  :
              done   ? "text-green-600"  :
                       "text-amber-400"
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
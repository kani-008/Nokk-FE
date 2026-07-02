import { Check, Clock, ArrowRight } from "lucide-react";

const TERMINAL_STATUSES = new Set([
  "cancelled", "replacement_requested", "replacement_approved",
  "replacement_rejected", "replacement_completed",
]);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : null;

// ── Courier banner ───────────────────────────────────────────────────
function CourierBanner({ order }) {
  if (!order.trackingNumber && !order.courierName) return null;
  return (
    <div className="flex gap-2.5 items-start bg-amber-50/70 rounded-xl p-3 border border-amber-100/50">
      <Clock size={14} className="text-amber-500 mt-0.5 shrink-0" />
      <div className="text-xs text-amber-800">
        {(order.courierName || order.trackingNumber) && (
          <p>
            {order.courierName && <span className="font-bold">{order.courierName}</span>}
            {order.courierName && order.trackingNumber && " · "}
            {order.trackingNumber && <span className="font-mono">{order.trackingNumber}</span>}
          </p>
        )}
        {order.trackingUrl && (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-brand-700 hover:underline font-semibold"
          >
            Track Shipment <ArrowRight size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Activity list ────────────────────────────────────────────────────
function ActivityList({ timeline }) {
  if (!timeline?.length) {
    return (
      <p className="font-body text-sm text-gray-400 text-center py-4">No activity yet.</p>
    );
  }
  return (
    <ol className="relative border-l-2 border-amber-100 ml-3 pl-4 space-y-5">
      {timeline.map((t, i) => {
        const isLatest = i === timeline.length - 1;
        return (
          <li key={i} className="relative">
            <span className={`absolute -left-[21px] top-0.5 flex items-center justify-center rounded-full w-4 h-4 ${
              isLatest ? "bg-brand-700 ring-2 ring-brand-100" : "bg-amber-300"
            }`}>
              <Check size={9} className="text-white" strokeWidth={3} />
            </span>
            <p className="font-body text-sm font-bold text-brand-900 capitalize leading-snug">
              {String(t.status).replace(/_/g, " ")}
            </p>
            {t.note && <p className="font-body text-xs text-amber-500 mt-0.5">{t.note}</p>}
            {fmtDate(t.createdAt) && (
              <p className="font-body text-[10px] text-gray-400 mt-0.5">{fmtDate(t.createdAt)}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TRACKING VIEW — activity list only, shown inside popup
// ══════════════════════════════════════════════════════════════════════
export function TrackingView({ order }) {
  return (
    <div className="flex flex-col gap-4">
      <CourierBanner order={order} />
      <ActivityList timeline={order.timeline} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TRACKING STATUS CARD — clickable row card in OrderDetail
// ══════════════════════════════════════════════════════════════════════
export function TrackingStatusCard({ order, onClick }) {
  const isTerminal   = TERMINAL_STATUSES.has(order.status);
  const latestEvent  = order.timeline?.[order.timeline.length - 1];
  const statusLabel  = String(order.status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full card p-4 flex items-center gap-4 hover:bg-amber-50/60 transition-colors cursor-pointer text-left group"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        order.status === "delivered"
          ? "bg-green-100 text-green-600"
          : isTerminal
          ? "bg-red-100 text-red-500"
          : "bg-brand-50 text-brand-700"
      }`}>
        {order.status === "delivered"
          ? <Check size={16} strokeWidth={2.5} />
          : <Clock size={16} strokeWidth={2} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-bold text-brand-900">{statusLabel}</p>
        {latestEvent?.note && (
          <p className="font-body text-xs text-amber-600 mt-0.5 line-clamp-1">{latestEvent.note}</p>
        )}
        {latestEvent?.createdAt && (
          <p className="font-body text-[10px] text-gray-400 mt-0.5">{fmtDate(latestEvent.createdAt)}</p>
        )}
      </div>

      <ArrowRight
        size={15}
        className="text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
      />
    </button>
  );
}

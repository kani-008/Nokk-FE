import { useNavigate } from "react-router-dom";
import {
  Bell, RefreshCw, CheckCheck, X,
  ShoppingCart, ShoppingBag, AlertCircle, RotateCcw,
  Tag, MessageSquare, Warehouse, UserPlus
} from "lucide-react";
import {
  useNotificationsList,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../../hooks/queries/useNotifications";

// ── Notification helpers ───────────────────────────────────────────────
export const NOTIF_ICONS = {
  new_order:               { Icon: ShoppingCart,   color: "text-amber-500",  bg: "bg-amber-50"  },
  order_status_changed:    { Icon: ShoppingBag,    color: "text-blue-500",   bg: "bg-blue-50"   },
  payment_failed:          { Icon: AlertCircle,    color: "text-red-500",    bg: "bg-red-50"    },
  replacement_requested:   { Icon: RotateCcw,      color: "text-pink-500",   bg: "bg-pink-50"   },
  replacement_completed:   { Icon: RotateCcw,      color: "text-teal-600",   bg: "bg-teal-50"   },
  upi_reference_submitted: { Icon: Tag,            color: "text-indigo-500", bg: "bg-indigo-50" },
  new_review:              { Icon: MessageSquare,  color: "text-purple-500", bg: "bg-purple-50" },
  stock_changed:           { Icon: Warehouse,      color: "text-orange-500", bg: "bg-orange-50" },
  new_signup:              { Icon: UserPlus,       color: "text-green-500",  bg: "bg-green-50"  },
  coupon_limit_near:       { Icon: Tag,            color: "text-yellow-600", bg: "bg-yellow-50" },
  default:                 { Icon: Bell,           color: "text-gray-500",   bg: "bg-gray-100"  },
};

export const fmtRelative = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// ── NotificationPanel ──────────────────────────────────────────────────
// open         — animation state (true = slid in, false = slid out)
// onClose       — called immediately by backdrop / close button; parent unmounts after 300 ms
// onCountChange — called with latest unread count after load / mark-read actions
export default function NotificationPanel({ open, onClose, onCountChange }) {
  const navigate = useNavigate();

  const { data: items = [], isLoading: loading, refetch } = useNotificationsList();
  const markAllReadMutation   = useMarkAllNotificationsRead();
  const markReadMutation      = useMarkNotificationRead();

  // Propagate unread count to parent whenever items change
  const unreadCount = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      onCountChange?.(0);
    } catch { /* */ }
  };

  const handleClick = async (item) => {
    if (!item.isRead) {
      try {
        await markReadMutation.mutateAsync(item.id);
        onCountChange?.((c) => Math.max(0, c - 1));
      } catch { /* */ }
    }
    if (item.link) navigate(item.link);
    onClose();
  };

  // ── shared inner content ──────────────────────────────────────────────
  const panelHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-bold text-gray-900">Notifications</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white font-num text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{unreadCount}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => refetch()} title="Refresh" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw size={13} />
        </button>
        {unreadCount > 0 && (
          <button onClick={markAllRead} title="Mark all read" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <CheckCheck size={13} />
          </button>
        )}
        <button onClick={onClose} className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1" aria-label="Close">
          <X size={15} />
        </button>
      </div>
    </div>
  );

  const panelList = (
    <div className="flex-1 overflow-y-auto md:max-h-80">
      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <RefreshCw size={16} className="animate-spin mr-2" />
          <span className="font-body text-sm">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <Bell size={24} className="mx-auto text-gray-200 mb-2" />
          <p className="font-body text-sm text-gray-400">All caught up!</p>
        </div>
      ) : (
        items.map((item) => {
          const { Icon, color, bg } = NOTIF_ICONS[item.eventType] ?? NOTIF_ICONS.default;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-50 last:border-0 ${!item.isRead ? "bg-blue-50/30" : ""}`}
            >
              <div className={`mt-0.5 p-2 rounded-xl ${bg} shrink-0`}>
                <Icon size={14} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`font-body text-xs text-gray-900 ${!item.isRead ? "font-bold" : "font-semibold"}`}>{item.title}</p>
                  <span className="font-num text-[10px] text-gray-400 shrink-0">{fmtRelative(item.createdAt)}</span>
                </div>
                <p className="font-body text-[11px] text-gray-500 mt-0.5 truncate">{item.message}</p>
              </div>
              {!item.isRead && <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
            </button>
          );
        })
      )}
    </div>
  );

  const panelFooter = (
    <div className="border-t border-gray-100 px-4 py-3 shrink-0">
      <button
        onClick={() => { navigate("/admin/orders"); onClose(); }}
        className="w-full text-center font-body text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
      >
        View all orders →
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile: full-height slide drawer from the right ── */}
      <div className="md:hidden">
        <div
          aria-hidden="true"
          onClick={onClose}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        />
        <div
          className={`fixed inset-y-0 right-0 z-50 w-3/4 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          {panelHeader}
          {panelList}
          {panelFooter}
        </div>
      </div>

      {/* ── Desktop: absolute dropdown ── */}
      <div className="hidden md:block absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="flex flex-col">
          {panelHeader}
          {panelList}
          {panelFooter}
        </div>
      </div>
    </>
  );
}

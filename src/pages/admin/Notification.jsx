import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, RefreshCw, CheckCheck,
  ShoppingCart, ShoppingBag, AlertCircle, RotateCcw,
  Tag, MessageSquare, Warehouse, UserPlus
} from "lucide-react";
import {
  useNotificationsList,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../../hookqueries/useNotifications";
import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";

export const NOTIF_ICONS = {
  new_order:               { Icon: ShoppingCart,   color: "text-amber-600",  bg: "bg-amber-100/70"  },
  order_status_changed:    { Icon: ShoppingBag,    color: "text-blue-600",   bg: "bg-blue-100/70"   },
  payment_failed:          { Icon: AlertCircle,    color: "text-red-600",    bg: "bg-red-100/70"    },
  replacement_requested:   { Icon: RotateCcw,      color: "text-pink-600",   bg: "bg-pink-100/70"   },
  replacement_completed:   { Icon: RotateCcw,      color: "text-teal-600",   bg: "bg-teal-100/70"   },
  upi_reference_submitted: { Icon: Tag,            color: "text-indigo-600", bg: "bg-indigo-100/70" },
  new_review:              { Icon: MessageSquare,  color: "text-purple-600", bg: "bg-purple-100/70" },
  stock_changed:           { Icon: Warehouse,      color: "text-orange-600", bg: "bg-orange-100/70" },
  new_signup:              { Icon: UserPlus,       color: "text-green-600",  bg: "bg-green-100/70"  },
  coupon_limit_near:       { Icon: Tag,            color: "text-yellow-600", bg: "bg-yellow-100/70" },
  default:                 { Icon: Bell,           color: "text-gray-600",   bg: "bg-gray-100"  },
};

export const fmtRelative = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ── Full Page Notification Center for Desktop & Mobile ─────────────────
export default function NotificationPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const { data: items = [], isLoading: loading, refetch } = useNotificationsList();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch { /* */ }
  };

  const handleClick = async (item) => {
    if (!item.isRead) {
      try {
        await markReadMutation.mutateAsync(item.id);
      } catch { /* */ }
    }
    if (item.link) navigate(item.link);
  };

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((i) => !i.isRead);
    if (filter === "orders") return items.filter((i) => i.eventType?.includes("order") || i.eventType?.includes("payment") || i.eventType?.includes("replacement"));
    if (filter === "users") return items.filter((i) => i.eventType === "new_signup" || i.eventType === "new_review");
    return items;
  }, [items, filter]);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-2.5">
      <AdminPage
        // title="Notification Center" strictly don't enable this comment 
        actions={
          <div className="flex items-center gap-1.5">
            <AdminButton variant="outline" size="sm" onClick={() => refetch()} className="px-2 py-1 text-xs">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </AdminButton>
            {unreadCount > 0 && (
              <AdminButton size="sm" onClick={markAllRead} className="px-2 py-1 text-xs">
                <CheckCheck size={13} /> Mark Read ({unreadCount})
              </AdminButton>
            )}
          </div>
        }
      >
        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-xl overflow-x-auto w-full sm:w-auto scrollbar-hide">
            {[
              { id: "all", label: `All (${items.length})` },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "orders", label: "Orders" },
              { id: "users", label: "Customers" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-body font-semibold transition-all shrink-0 ${
                  filter === t.id ? "bg-surface text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main List */}
        <AdminCard className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2 font-body text-xs">
              <RefreshCw size={15} className="animate-spin text-amber-500" />
              <span>Loading notifications...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 px-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                <Bell size={20} />
              </div>
              <h3 className="font-display text-sm font-bold text-gray-800">No notifications found</h3>
              <p className="font-body text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto">
                You are all caught up! New order alerts and system notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const { Icon, color, bg } = NOTIF_ICONS[item.eventType] ?? NOTIF_ICONS.default;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className={`flex items-start gap-2 px-2 py-2 sm:px-3 sm:py-2.5 hover:bg-amber-50/40 cursor-pointer transition-colors ${
                      !item.isRead ? "bg-amber-50/20" : ""
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${bg} shrink-0 shadow-2xs mt-0.5`}>
                      <Icon size={15} className={color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className={`font-body text-xs sm:text-sm whitespace-nowrap truncate min-w-0 ${!item.isRead ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 ml-auto" title="Unread" />
                        )}
                      </div>
                      <p className="font-body text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-snug break-words">{item.message}</p>
                      <div className="flex justify-end mt-0.5">
                        <span className="font-num text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">{fmtRelative(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      </AdminPage>
    </div>
  );
}

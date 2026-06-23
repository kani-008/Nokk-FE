import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee, ShoppingBag, Package, Users,
  TrendingUp, Clock, CheckCircle2, XCircle,
  ArrowRight, RefreshCw,
} from "lucide-react";
import { apiFetch, API_URL } from "../../ApiCall/Api.jsx";
import { useAuthStore }           from "../../components/store/AuthStore";

const DASHBOARD_BASE = `${API_URL}/dashboard`;
const ORDER_BASE = `${API_URL}/orders`;

const dashboardApi = {
  kpis: (token) =>
    apiFetch(`${DASHBOARD_BASE}/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  charts: (token) =>
    apiFetch(`${DASHBOARD_BASE}/charts`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

const orderApi = {
  all: (params = "", token) =>
    apiFetch(`${ORDER_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
import {
  StatCard, AdminPage, DataTable, StatusBadge, AdminCard,
} from "../../components/admin/AdminUI.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function MiniBarChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-sm text-gray-400 font-body">No chart data yet</div>
  );
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-t-md bg-brand-700 group-hover:bg-brand-900 transition-all duration-200"
            style={{ height: `${Math.max((d.value / max) * 88, 4)}px` }}
            title={`${d.label}: ${rupee(d.value)}`}
          />
          <span className="font-body text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdown({ breakdown = {} }) {
  const items = [
    { label: "Delivered",  key: "delivered",  color: "bg-green-500"  },
    { label: "Processing", key: "processing", color: "bg-indigo-500" },
    { label: "Shipped",    key: "shipped",    color: "bg-purple-500" },
    { label: "Cancelled",  key: "cancelled",  color: "bg-red-400"    },
    { label: "Pending",    key: "pending",    color: "bg-yellow-400" },
  ];
  const total = items.reduce((s, i) => s + (breakdown[i.key] || 0), 0) || 1;
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const val = breakdown[item.key] || 0;
        const pct = Math.round((val / total) * 100);
        return (
          <div key={item.key}>
            <div className="flex justify-between mb-1">
              <span className="font-body text-xs text-gray-600">{item.label}</span>
              <span className="font-num text-xs font-semibold text-gray-800">{val} <span className="text-gray-400 font-normal">({pct}%)</span></span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuthStore();
  const [kpis,         setKpis]         = useState(null);
  const [charts,       setCharts]       = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [kRes, cRes, oRes] = await Promise.allSettled([
        dashboardApi.kpis(token),
        dashboardApi.charts(token),
        orderApi.all("limit=8&sort=newest", token),
      ]);
      if (kRes.status === "fulfilled") setKpis(kRes.value?.kpis   || kRes.value || {});
      if (cRes.status === "fulfilled") setCharts(cRes.value?.charts || cRes.value || {});
      if (oRes.status === "fulfilled") setRecentOrders(oRes.value?.orders || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [token]);

  const KPI_CARDS = [
    { label: "Total Revenue",   key: "totalRevenue",  icon: IndianRupee, color: "green",  currency: true },
    { label: "Total Orders",    key: "totalOrders",   icon: ShoppingBag, color: "blue"                   },
    { label: "Active Products", key: "totalProducts", icon: Package,     color: "purple"                 },
    { label: "Total Users",     key: "totalUsers",    icon: Users,       color: "amber"                  },
  ];

  const QUICK_STATS = [
    { label: "Orders Today", value: kpis?.ordersToday ?? "—", icon: <Clock        size={15} className="text-amber-500"  /> },
    { label: "Pending",      value: kpis?.pending      ?? "—", icon: <Clock        size={15} className="text-yellow-500" /> },
    { label: "Delivered",    value: kpis?.delivered    ?? "—", icon: <CheckCircle2 size={15} className="text-green-500"  /> },
    { label: "Cancelled",    value: kpis?.cancelled    ?? "—", icon: <XCircle      size={15} className="text-red-400"    /> },
  ];

  const ORDER_COLS = [
    {
      key: "id", label: "Order ID",
      render: (r) => <span className="font-num text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">#{String(r.id).slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: "customerName", label: "Customer",
      render: (r) => (
        <div>
          <p className="font-body text-sm font-medium text-gray-900">{r.customerName || r.user?.name || "—"}</p>
          <p className="font-body text-xs text-gray-400">{r.customerPhone || r.user?.phone || ""}</p>
        </div>
      ),
    },
    { key: "total",         label: "Amount",  render: (r) => <span className="font-num text-sm font-semibold text-gray-900">{rupee(r.total)}</span> },
    { key: "paymentMethod", label: "Payment", render: (r) => <span className="font-num text-xs uppercase text-gray-500">{r.paymentMethod || "—"}</span> },
    { key: "status",        label: "Status",  render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt",     label: "Date",    render: (r) => <span className="font-body text-xs text-gray-400">{fmtDate(r.createdAt)}</span> },
  ];

  return (
    <AdminPage
      title="Dashboard"
      sub="Your store at a glance"
      action={
        <button onClick={() => load(true)} disabled={refreshing} className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((cfg) => (
          <StatCard key={cfg.key} label={cfg.label} value={loading ? "—" : (kpis?.[cfg.key] ?? 0)}
            icon={cfg.icon} color={cfg.color} currency={cfg.currency} trend={kpis?.[`${cfg.key}Trend`]} />
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_STATS.map((q) => (
          <AdminCard key={q.label} className="flex items-center gap-3 py-3.5">
            <div className="p-2 rounded-xl bg-gray-50">{q.icon}</div>
            <div>
              <p className="font-num text-lg font-bold text-gray-900 leading-none">{q.value}</p>
              <p className="font-body text-xs text-gray-500 mt-0.5">{q.label}</p>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-body text-sm font-bold text-gray-900">Revenue Trend</p>
              <p className="font-body text-xs text-gray-400 mt-0.5">Last 7 days</p>
            </div>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <MiniBarChart data={charts?.revenueByDay || []} />
        </AdminCard>

        <AdminCard>
          <p className="font-body text-sm font-bold text-gray-900 mb-4">Order Status</p>
          <StatusBreakdown breakdown={charts?.ordersByStatus || {}} />
        </AdminCard>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm font-bold text-gray-900">Recent Orders</p>
          {/* router Link — keeps SPA state, no full page reload */}
          <Link to="/admin/orders" className="font-body text-xs text-brand-700 font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <DataTable columns={ORDER_COLS} rows={recentOrders} loading={loading} emptyText="No orders yet." />
      </div>
    </AdminPage>
  );
}
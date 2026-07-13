import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee, ShoppingBag, Package, Users,
  TrendingUp, Clock, CheckCircle2, XCircle,
  ArrowRight, RefreshCw,
} from "lucide-react";
import {
  StatCard, AdminPage, DataTable, StatusBadge, AdminCard, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import {
  useDashboardSummary,
  useDashboardRevenueChart,
  useRecentOrders,
} from "../../hookqueries/useAdminDashboard";

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
    <div className="flex items-end gap-1.5 h-24 mt-15">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          {/* Custom Tooltip */}
          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center z-10 pointer-events-none">
            <div className="bg-gray-900 text-white text-[13px] font-semibold font-num px-3 py-1 rounded shadow-md whitespace-nowrap">
              {rupee(d.value)}
            </div>
            <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
          </div>

          <div
            className="w-full rounded-t-md bg-brand-700 group-hover:bg-brand-900 transition-all duration-200"
            style={{ height: `${Math.max((d.value / max) * 88, 4)}px` }}
          />
          <span className="font-body text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function YearlyRevenueList({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-sm text-gray-400 font-body">No chart data yet</div>
  );
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="font-body text-[10px] text-gray-500 w-7 shrink-0 text-right">{d.label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
            <div
              className="h-full bg-brand-700 group-hover:bg-brand-900 rounded-sm transition-all duration-300"
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` }}
              title={`${d.label}: ${rupee(d.value)}`}
            />
          </div>
          <span className="font-num text-[10px] text-gray-500 w-16 shrink-0 text-right">{rupee(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

const PERIOD_OPTIONS = [
  { value: "weekly",  label: "Week"  },
  { value: "monthly", label: "Month" },
  { value: "yearly",  label: "Year"  },
];

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
  const [chartPeriod, setChartPeriod] = useState("weekly");

  const { data: kpis,         isLoading: kpisLoading,    refetch: refetchKpis    } = useDashboardSummary();
  const { data: chartData,    isLoading: chartsLoading,  refetch: refetchCharts  } = useDashboardRevenueChart(chartPeriod);
  const { data: recentOrders, isLoading: ordersLoading,  refetch: refetchOrders  } = useRecentOrders(8);

  const loading    = kpisLoading || chartsLoading || ordersLoading;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchKpis(), refetchCharts(), refetchOrders()]);
    setRefreshing(false);
  };

  const charts = chartData ? { revenueByDay: chartData } : null;


  const KPI_CARDS = [
    { label: "Total Revenue",   key: "totalRevenue",  icon: IndianRupee, color: "green",  currency: true },
    { label: "Total Orders",    key: "totalOrders",   icon: ShoppingBag, color: "blue"                   },
    { label: "Active Products", key: "totalProducts", icon: Package,     color: "purple"                 },
    { label: "Total Users",     key: "totalUsers",    icon: Users,       color: "amber"                  },
  ];

  const QUICK_STATS = [
    { label:"Today's Order", value: kpis?.ordersToday ?? "—", icon: <Clock        size={15} className="text-amber-500"  /> },
    { label: "Pending Order",      value: kpis?.pending      ?? "—", icon: <Clock        size={15} className="text-yellow-500" /> },
    { label: "Order Delivered",    value: kpis?.delivered    ?? "—", icon: <CheckCircle2 size={15} className="text-green-500"  /> },
    { label: "Cancelled Order",    value: kpis?.cancelled    ?? "—", icon: <XCircle      size={15} className="text-red-400"    /> },
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
      action={
        <AdminButton variant="ghost" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </AdminButton>
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
              <p className="font-body text-xs text-gray-400 mt-0.5">
                {chartPeriod === "weekly" ? "This week" : chartPeriod === "monthly" ? "This month" : "This year"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setChartPeriod(opt.value)}
                    className={`px-2.5 py-1 font-body text-xs transition-colors ${
                      chartPeriod === opt.value
                        ? "bg-brand-800 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <TrendingUp size={16} className="text-green-500" />
            </div>
          </div>
          {chartPeriod === "yearly"
            ? <YearlyRevenueList data={charts?.revenueByDay || []} />
            : <MiniBarChart data={charts?.revenueByDay || []} />
          }
        </AdminCard>

        <AdminCard>
          <p className="font-body text-sm font-bold text-gray-900 mb-4">Order Status</p>
          <StatusBreakdown breakdown={kpis?.breakdown || {}} />
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
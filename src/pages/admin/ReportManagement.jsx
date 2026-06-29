import { useState } from "react";
import {
  IndianRupee, ShoppingBag, TrendingUp, TrendingDown,
  Download, RefreshCw, BarChart2,
} from "lucide-react";
import { useReportsData } from "../../hooks/queries/useReports";
import {
  AdminPage, AdminCard, StatCard, DataTable, AdminButton,
} from "../../components/admin/AdminUI.jsx";

const rupee = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);


const PERIODS = [
  { key: "7d",   label: "Last 7 days"  },
  { key: "30d",  label: "Last 30 days" },
  { key: "90d",  label: "Last 90 days" },
  { key: "365d", label: "Last year"    },
];

// ── Horizontal bar chart ───────────────────────────────────────────────
function HBarChart({ data = [], valueKey = "value", labelKey = "label", color = "bg-brand-700" }) {
  if (!data.length) return <p className="font-body text-sm text-gray-400 py-4 text-center">No data available</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((item, i) => {
        const pct = Math.round(((item[valueKey] || 0) / max) * 100);
        return (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="font-body text-xs text-gray-700 truncate max-w-[60%]">{item[labelKey]}</span>
              <span className="font-num text-xs font-semibold text-gray-900">{typeof item[valueKey] === "number" && item[valueKey] > 100 ? rupee(item[valueKey]) : item[valueKey]}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function ReportManagement() {
  const [period, setPeriod] = useState("30d");

  const { data: rawReport, isLoading: loading, isFetching, refetch } = useReportsData(period);
  const report = rawReport?.report || rawReport || null;
  const refreshing = isFetching && !loading;

  const handleExport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `report-${period}-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const TOP_PRODUCT_COLS = [
    { key: "rank",        label: "#",        width: "40px", render: (_, i) => <span className="font-num text-sm font-bold text-gray-400">{i + 1}</span> },
    { key: "productName", label: "Product",  render: (r) => <span className="font-body text-sm font-medium text-gray-900 line-clamp-1">{r.productName || r.name}</span> },
    { key: "totalQty",    label: "Units",    width: "80px",  render: (r) => <span className="font-num text-sm font-bold text-gray-900">{r.totalQty || r.qty || 0}</span> },
    { key: "totalRev",    label: "Revenue",  width: "120px", render: (r) => <span className="font-num text-sm font-semibold text-green-700">{rupee(r.totalRevenue || r.revenue || 0)}</span> },
  ];

  const CATEGORY_COLS = [
    { key: "categoryName", label: "Category", render: (r) => <span className="font-body text-sm font-medium text-gray-900">{r.categoryName || r.name}</span> },
    { key: "orders",       label: "Orders",   render: (r) => <span className="font-num text-sm text-gray-900">{r.orders || r.count || 0}</span> },
    { key: "revenue",      label: "Revenue",  render: (r) => <span className="font-num text-sm font-semibold text-green-700">{rupee(r.revenue || 0)}</span> },
  ];

  return (
    <AdminPage
      action={
        <div className="flex gap-2">
          <AdminButton variant="outline" size="sm" onClick={() => refetch()} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </AdminButton>
          <AdminButton variant="outline" size="sm" onClick={handleExport} disabled={!report}>
            <Download size={14} /> Export
          </AdminButton>
        </div>
      }
    >
      {/* period selector */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
            className={`font-body text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors ${period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}</div>
        </div>
      ) : !report ? (
        <AdminCard className="text-center py-16">
          <BarChart2 size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-body text-gray-400">No report data available for this period.</p>
        </AdminCard>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue"    value={report.totalRevenue    || 0} icon={IndianRupee} color="green"  currency trend={report.revenueTrend} />
            <StatCard label="Total Orders"     value={report.totalOrders     || 0} icon={ShoppingBag} color="blue"            trend={report.ordersTrend} />
            <StatCard label="Avg Order Value"  value={report.avgOrderValue   || 0} icon={TrendingUp}  color="purple" currency />
            <StatCard label="Returns/Refunds"  value={report.totalReturns    || 0} icon={TrendingDown} color="red" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Top products */}
            <AdminCard>
              <p className="font-body text-sm font-bold text-gray-900 mb-4">Top Selling Products</p>
              {(report.topProducts?.length > 0) ? (
                <DataTable
                  columns={TOP_PRODUCT_COLS}
                  rows={report.topProducts}
                  emptyText="No product data"
                />
              ) : (
                <HBarChart data={[]} />
              )}
            </AdminCard>

            {/* Revenue by category */}
            <AdminCard>
              <p className="font-body text-sm font-bold text-gray-900 mb-4">Revenue by Category</p>
              <HBarChart
                data={report.revenueByCategory || []}
                valueKey="revenue"
                labelKey="categoryName"
                color="bg-purple-500"
              />
            </AdminCard>

          </div>

          {/* second row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Revenue by day */}
            <AdminCard>
              <p className="font-body text-sm font-bold text-gray-900 mb-4">Daily Revenue</p>
              {(report.revenueByDay?.length > 0) ? (
                <div className="flex items-end gap-1 h-32">
                  {report.revenueByDay.map((d, i) => {
                    const max = Math.max(...report.revenueByDay.map((x) => x.value || x.revenue || 0), 1);
                    const val = d.value || d.revenue || 0;
                    const pct = Math.max((val / max) * 100, 4);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t-md bg-brand-700 group-hover:bg-brand-900 transition-all"
                          style={{ height: `${pct}%` }}
                          title={`${d.label || d.date}: ${rupee(val)}`}
                        />
                        <span className="font-body text-[8px] text-gray-400 truncate w-full text-center">{d.label || d.date}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <HBarChart data={[]} />}
            </AdminCard>

            {/* Category breakdown */}
            {report.categoryBreakdown?.length > 0 && (
              <AdminCard>
                <p className="font-body text-sm font-bold text-gray-900 mb-4">Category Breakdown</p>
                <DataTable columns={CATEGORY_COLS} rows={report.categoryBreakdown} emptyText="No data" />
              </AdminCard>
            )}

          </div>
        </>
      )}
    </AdminPage>
  );
}
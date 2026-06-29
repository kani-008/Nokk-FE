import { useQuery } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const res = await API.get("/dashboard/summary");
      const s = res.data?.summary ?? {};
      return {
        totalRevenue:  s.allTime?.revenue       ?? 0,
        totalOrders:   s.allTime?.orders        ?? 0,
        totalProducts: s.products?.total        ?? 0,
        totalUsers:    s.customers?.total       ?? 0,
        ordersToday:   s.today?.orders          ?? 0,
        pending:       s.orderStatus?.pending   ?? 0,
        delivered:     s.orderStatus?.delivered ?? 0,
        cancelled:     s.orderStatus?.cancelled ?? 0,
        breakdown:     s.orderStatus            ?? {},
      };
    },
  });
}

export function useDashboardRevenueChart(period = "weekly") {
  return useQuery({
    queryKey: ["dashboard", "revenue-chart", period],
    queryFn: async () => {
      const res = await API.get("/dashboard/revenue-chart", { params: { period } });
      const raw = res.data?.chart ?? [];

      if (period === "weekly") {
        return raw.map((r) => ({
          label: new Date(r.period).toLocaleDateString("en-IN", { weekday: "short" }),
          value: r.revenue,
          orders: r.orders,
          discount: r.discount,
        }));
      }
      if (period === "monthly") {
        return raw.map((r, i) => ({
          label: `Wk ${i + 1}`,
          value: r.revenue,
          orders: r.orders,
          discount: r.discount,
        }));
      }
      // yearly
      return raw.map((r) => ({
        label: new Date(r.period).toLocaleDateString("en-IN", { month: "short" }),
        value: r.revenue,
        orders: r.orders,
        discount: r.discount,
      }));
    },
  });
}

export function useRecentOrders(limit = 8) {
  return useQuery({
    queryKey: ["orders", "recent", limit],
    queryFn: async () => {
      const res = await API.get("/orders/admin/get-all", { params: { limit } });
      return res.data?.orders || [];
    },
  });
}

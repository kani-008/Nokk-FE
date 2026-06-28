import { useQuery } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

const calculateDateRange = (period) => {
  const toDate = new Date();
  const fromDate = new Date();

  if (period === "7d") {
    fromDate.setDate(toDate.getDate() - 7);
  } else if (period === "90d") {
    fromDate.setDate(toDate.getDate() - 90);
  } else if (period === "365d") {
    fromDate.setDate(toDate.getDate() - 365);
  } else {
    // default/fallback to 30d
    fromDate.setDate(toDate.getDate() - 30);
  }

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return { from: formatDate(fromDate), to: formatDate(toDate) };
};

export function useReportsData(period) {
  return useQuery({
    queryKey: ["reports", period],
    queryFn: async () => {
      const { from, to } = calculateDateRange(period);

      // Fetch revenue and product reports concurrently
      const [revenueRes, productsRes] = await Promise.all([
        API.get(`/reports/revenue?from=${from}&to=${to}&period=daily`),
        API.get(`/reports/products?from=${from}&to=${to}&limit=100`),
      ]);

      const revenueData = revenueRes.data || {};
      const productsData = productsRes.data || {};

      const totals = revenueData.totals || {};
      const breakdown = revenueData.breakdown || [];
      const productsList = productsData.report || [];

      // Map products to topProducts
      const topProducts = productsList.map((p) => ({
        productName: p.name,
        totalQty: p.unitsSold,
        totalRevenue: p.revenue,
      }));

      // Calculate category breakdown from product data
      const categoryMap = {};
      productsList.forEach((p) => {
        const catName = p.category || "Uncategorized";
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            categoryName: catName,
            orders: 0,
            revenue: 0,
          };
        }
        categoryMap[catName].orders += p.orderCount || 0;
        categoryMap[catName].revenue += p.revenue || 0;
      });

      const categoryBreakdown = Object.values(categoryMap);
      const revenueByCategory = categoryBreakdown.map((c) => ({
        categoryName: c.categoryName,
        revenue: c.revenue,
      }));

      // Map daily breakdown to revenueByDay
      const revenueByDay = breakdown.map((b) => {
        const dObj = new Date(b.period);
        return {
          label: dObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          date: b.period,
          revenue: b.revenue,
        };
      });

      return {
        success: true,
        report: {
          totalRevenue: totals.revenue || 0,
          totalOrders: totals.orders || 0,
          avgOrderValue: totals.orders > 0 ? totals.revenue / totals.orders : 0,
          totalReturns: 0, // Fallback placeholder since returns are not separately aggregated
          revenueTrend: 0,
          ordersTrend: 0,
          topProducts,
          revenueByCategory,
          revenueByDay,
          categoryBreakdown,
        },
      };
    },
    enabled: !!period,
  });
}

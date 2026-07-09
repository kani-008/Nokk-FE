import { useQuery } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

export function useDeliverySettings() {
  return useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const res = await API.get("/settings/get-all");
      const s = res.data.settings || {};
      return {
        // shippingCharge is the canonical key saved by Settings page;
        // flatDeliveryCharge is the legacy key — support both
        flatDeliveryCharge:    Number(s.shippingCharge || s.flatDeliveryCharge) || 60,
        freeShippingThreshold: Number(s.freeShippingThreshold) || 499,
        minOrderValue:         Number(s.minOrderValue)         || 0,
        maxCartItems:          Number(s.maxCartItems)          || 20,
      };
    },
    staleTime: 5 * 60_000,
  });
}

export function useHomeBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const res = await API.get("/banners/get-banners");
      const banners = res.data.banners || [];
      try {
        const payload = { data: banners, cachedAt: Date.now() };
        localStorage.setItem("nokk_home_banners", JSON.stringify(payload));
      } catch (err) {
        console.error("Failed to save banners to localStorage:", err);
      }
      return banners;
    },
    staleTime: 10 * 60_000,
    initialData: () => {
      try {
        const cached = localStorage.getItem("nokk_home_banners");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed)) {
              return parsed;
            }
            return parsed.data;
          }
        }
        return undefined;
      } catch (err) {
        console.error("Failed to parse cached banners:", err);
        return undefined;
      }
    },
    initialDataUpdatedAt: () => {
      try {
        const cached = localStorage.getItem("nokk_home_banners");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed)) {
              return 0;
            }
            return parsed.cachedAt || 0;
          }
        }
        return 0;
      } catch {
        return 0;
      }
    },
  });
}

export function useHomeCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await API.get("/categories/get-all");
      return res.data.categories || [];
    },
    staleTime: 10 * 60_000,
  });
}

export function useHomeBestsellers() {
  return useQuery({
    queryKey: ["products", "bestsellers"],
    queryFn: async () => {
      const res = await API.get("/products/get-all?isBestseller=true&limit=8");
      return res.data.products || [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useHomeNewArrivals() {
  return useQuery({
    queryKey: ["products", "newest"],
    queryFn: async () => {
      const res = await API.get("/products/get-all?sort=newest&limit=8");
      return res.data.products || [];
    },
    staleTime: 5 * 60_000,
  });
}

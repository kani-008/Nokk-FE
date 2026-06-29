import { useQuery } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

export function useDeliverySettings() {
  return useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const res = await API.get("/settings/get-all");
      const s = res.data.settings || {};
      return {
        flatDeliveryCharge:    Number(s.flatDeliveryCharge)    || 50,
        freeShippingThreshold: Number(s.freeShippingThreshold) || 499,
      };
    },
    staleTime: 5 * 60_000, // settings rarely change — cache 5 min
  });
}

export function useHomeBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const res = await API.get("/banners/get-banners");
      const banners = res.data.banners || [];
      try {
        localStorage.setItem("nokk_home_banners", JSON.stringify(banners));
      } catch (err) {
        console.error("Failed to save banners to localStorage:", err);
      }
      return banners;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem("nokk_home_banners");
        return cached ? JSON.parse(cached) : undefined;
      } catch (err) {
        console.error("Failed to parse cached banners:", err);
        return undefined;
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
  });
}

export function useHomeBestsellers() {
  return useQuery({
    queryKey: ["products", "bestsellers"],
    queryFn: async () => {
      const res = await API.get("/products/get-all?isBestseller=true&limit=8");
      return res.data.products || [];
    },
  });
}

export function useHomeNewArrivals() {
  return useQuery({
    queryKey: ["products", "newest"],
    queryFn: async () => {
      const res = await API.get("/products/get-all?sort=newest&limit=8");
      return res.data.products || [];
    },
  });
}

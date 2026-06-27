import { useQuery } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

export function useHomeBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const res = await API.get("/banners/get-banners");
      return res.data.banners || [];
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

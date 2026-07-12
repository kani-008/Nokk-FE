import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── QUERIES ─────────────────────────────────────────────────────────

export function useAdminBanners() {
  return useQuery({
    queryKey: ["banners", "all"],
    queryFn: async () => {
      console.log("[useAdminBanners] queryFn called — fetching all banners");
      const res = await API.get("/banners/get-all");
      console.log("[useAdminBanners] queryFn finished — banners count:", res.data.banners?.length);
      return res.data.banners || [];
    },
  });
}

export function useBannerTextOverlays(bannerId) {
  return useQuery({
    queryKey: ["btext", bannerId],
    queryFn: async () => {
      if (!bannerId) return [];
      const res = await API.get(`/btext/get-for-banner?bannerId=${bannerId}`);
      return res.data.btexts || [];
    },
    enabled: !!bannerId,
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useUploadBannerImage() {
  return useMutation({
    mutationFn: async (body) => {
      const res = await API.post("/upload/banner", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      console.log("[useCreateBanner] POST /banners/create-banner payload:", payload);
      const res = await API.post("/banners/create-banner", payload);
      return res.data;
    },
    onSuccess: () => {
      console.log("[useCreateBanner] onSuccess — invalidating and refetching banners cache");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "all"] });
      queryClient.refetchQueries({ queryKey: ["banners"] });
      queryClient.refetchQueries({ queryKey: ["banners", "all"] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      console.log("[useUpdateBanner] PUT /banners/update-banner payload:", payload);
      const res = await API.put("/banners/update-banner", payload);
      return res.data;
    },
    onSuccess: () => {
      console.log("[useUpdateBanner] onSuccess — clearing localStorage, invalidating and refetching banners cache");
      localStorage.removeItem("nokk_home_banners");
      localStorage.removeItem("nokk_all_banner_slides");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "all"] });
      queryClient.refetchQueries({ queryKey: ["banners"] });
      queryClient.refetchQueries({ queryKey: ["banners", "all"] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      console.log("[useDeleteBanner] DELETE /banners/delete-banner ID:", id);
      const res = await API.delete("/banners/delete-banner", { data: { id } });
      return res.data;
    },
    onSuccess: () => {
      console.log("[useDeleteBanner] onSuccess — clearing localStorage, invalidating and refetching banners cache");
      localStorage.removeItem("nokk_home_banners");
      localStorage.removeItem("nokk_all_banner_slides");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "all"] });
      queryClient.refetchQueries({ queryKey: ["banners"] });
      queryClient.refetchQueries({ queryKey: ["banners", "all"] });
    },
  });
}

export function useCreateBannerText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/btext/create-btext", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["btext", variables.bannerId] });
    },
  });
}

export function useUpdateBannerText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/btext/update-btext", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["btext", variables.bannerId] });
    },
  });
}

export function useDeleteBannerText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bannerId }) => {
      const res = await API.delete("/btext/delete-btext", { data: { id } });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["btext", variables.bannerId] });
    },
  });
}

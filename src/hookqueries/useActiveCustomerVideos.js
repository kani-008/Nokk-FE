import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── PUBLIC QUERY ────────────────────────────────────────────────────
export function useActiveCustomerVideos() {
  return useQuery({
    queryKey: ["customer-videos", "public"],
    queryFn: async () => {
      console.log("[useActiveCustomerVideos] REQUEST — GET /customer-videos/get-active");
      try {
        const res = await API.get("/customer-videos/get-active");
        console.log(`[useActiveCustomerVideos] STATUS ${res.status} — loaded ${res.data.videos?.length || 0} videos`);
        return res.data.videos || [];
      } catch (err) {
        console.error(`[useActiveCustomerVideos] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
  });
}

// ── ADMIN QUERIES & MUTATIONS ───────────────────────────────────────
export function useAdminCustomerVideoList() {
  return useQuery({
    queryKey: ["customer-videos", "admin"],
    queryFn: async () => {
      console.log("[useAdminCustomerVideoList] REQUEST — GET /customer-videos/get-all");
      try {
        const res = await API.get("/customer-videos/get-all");
        console.log(`[useAdminCustomerVideoList] STATUS ${res.status} — loaded ${res.data.videos?.length || 0} videos`);
        return res.data.videos || [];
      } catch (err) {
        console.error(`[useAdminCustomerVideoList] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
  });
}

export function useUploadCustomerVideoFile() {
  return useMutation({
    mutationFn: async (body) => {
      const res = await API.post("/upload/customer-video", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });
}

export function useCreateCustomerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      console.log("[useCreateCustomerVideo] REQUEST — POST /customer-videos/create");
      try {
        const res = await API.post("/customer-videos/create", payload);
        console.log(`[useCreateCustomerVideo] STATUS ${res.status} — created:`, res.data.video);
        return res.data;
      } catch (err) {
        console.error(`[useCreateCustomerVideo] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[useCreateCustomerVideo] onSuccess — invalidating customer-videos cache");
      queryClient.invalidateQueries({ queryKey: ["customer-videos"] });
    },
  });
}

export function useUpdateCustomerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      console.log("[useUpdateCustomerVideo] REQUEST — PUT /customer-videos/update");
      try {
        const res = await API.put("/customer-videos/update", payload);
        console.log(`[useUpdateCustomerVideo] STATUS ${res.status} — updated:`, res.data.video);
        return res.data;
      } catch (err) {
        console.error(`[useUpdateCustomerVideo] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[useUpdateCustomerVideo] onSuccess — invalidating customer-videos cache");
      queryClient.invalidateQueries({ queryKey: ["customer-videos"] });
    },
  });
}

export function useDeleteCustomerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      console.log(`[useDeleteCustomerVideo] REQUEST — DELETE /customer-videos/delete | id: ${id}`);
      try {
        const res = await API.delete("/customer-videos/delete", { data: { id } });
        console.log(`[useDeleteCustomerVideo] STATUS ${res.status} — deleted video id: ${id}`);
        return res.data;
      } catch (err) {
        console.error(`[useDeleteCustomerVideo] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[useDeleteCustomerVideo] onSuccess — invalidating customer-videos cache");
      queryClient.invalidateQueries({ queryKey: ["customer-videos"] });
    },
  });
}

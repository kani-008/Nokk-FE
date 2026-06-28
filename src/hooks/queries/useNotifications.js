import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

// ── QUERIES ─────────────────────────────────────────────────────────

export function useNotificationsList() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await API.get("/notifications/list", { params: { limit: 20, page: 1 } });
      return res.data.notifications || [];
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await API.patch("/notifications/mark-all-read");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId) => {
      const res = await API.patch("/notifications/mark-read", { notificationId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

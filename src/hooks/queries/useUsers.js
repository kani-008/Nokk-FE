import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

// ── QUERIES ─────────────────────────────────────────────────────────

export function useUserList(params) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const res = await API.get("/users/get-all", { params });
      return res.data;
    },
  });
}

export function useUserDetails(userId) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await API.get(`/users/get-by-id?id=${userId}`);
      return res.data.user;
    },
    enabled: !!userId,
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await API.patch("/users/toggle-status", { id, status });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await API.delete("/users/delete-user", { data: { id } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

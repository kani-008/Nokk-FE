import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";
import { useAuthStore } from "../components/store/AuthStore.jsx";

// ── QUERIES ─────────────────────────────────────────────────────────

export function useMyOrders() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["orders", "my"],
    enabled: isAuthenticated,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await API.get("/orders/get-my-orders");
      return (res.data.orders || []).map(o => ({
        ...o,
        items: (o.items || []).map(item => ({
          ...item,
          productName: item.name,
          weightLabel: item.weight
        })),
        timeline: (o.timeline || []).map(t => ({
          ...t,
          note: t.notes,
          createdAt: t.date
        }))
      }));
    },
  });
}

export function useAdminOrders(params) {
  return useQuery({
    queryKey: ["orders", "admin", params],
    queryFn: async () => {
      const res = await API.get("/orders/admin/get-all", { params });
      const data = res.data;
      return {
        ...data,
        orders: (data.orders || []).map(o => ({
          ...o,
          items: (o.items || []).map(item => ({
            ...item,
            productName: item.name,
            weightLabel: item.weight,
          })),
          timeline: (o.timeline || []).map(t => ({
            ...t,
            note: t.notes,
            createdAt: t.date,
          })),
        })),
      };
    },
  });
}

export function useAdminReplacements(params) {
  return useQuery({
    queryKey: ["replacements", params],
    queryFn: async () => {
      const res = await API.get("/orders/admin/get-replacements", { params });
      return res.data;
    },
  });
}

export function useAdminOrderDetail(id) {
  return useQuery({
    queryKey: ["orders", "admin", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await API.get(`/orders/admin/get-order?id=${id}`);
      const o = res.data.order;
      if (!o) return null;
      return {
        ...o,
        items: (o.items || []).map(item => ({
          ...item,
          productName: item.name,
          weightLabel: item.weight
        })),
        timeline: (o.timeline || []).map(t => ({
          ...t,
          note: t.notes,
          createdAt: t.date
        }))
      };
    },
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/orders/checkout", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await API.post("/orders/cancel-my-order", { id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRequestReplacement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/orders/request-replacement", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useSubmitUpiReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, upiRefId }) => {
      const res = await API.post("/orders/submit-upi-reference", { id, upiRefId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/orders/admin/update-status", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateReplacementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/orders/admin/update-replacement", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replacements"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/orders/razorpay/create-order", payload);
      return res.data;
    },
  });
}

export function useVerifyRazorpayPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/orders/razorpay/verify-payment", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

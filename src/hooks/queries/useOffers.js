import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

// ── Helpers for Coupon Mapping ────────────────────────────────────────

const mapCouponToFrontend = (c) => {
  if (!c) return null;
  return {
    ...c,
    discountType: c.discountPercent > 0 ? "percentage" : "flat",
    discountValue: c.discountPercent > 0 ? c.discountPercent : c.discountFlat,
    minOrderValue: c.minOrder,
    maxUsageCount: c.maxUses,
    expiresAt: c.expiryDate
  };
};

const mapCouponToBackend = (form) => {
  const payload = {
    code: form.code,
    description: form.description || null,
    isActive: form.isActive,
    minOrder: Number(form.minOrderValue) || 0,
    maxUses: form.maxUsageCount ? Number(form.maxUsageCount) : null,
    expiryDate: form.expiresAt || null,
    freeShipping: form.freeShipping || false
  };
  if (form.discountType === "percentage") {
    payload.discountPercent = Number(form.discountValue) || 0;
    payload.discountFlat = 0;
  } else {
    payload.discountFlat = Number(form.discountValue) || 0;
    payload.discountPercent = 0;
  }
  return payload;
};

// ── QUERIES ─────────────────────────────────────────────────────────

export function useActiveOffers() {
  return useQuery({
    queryKey: ["offers", "active"],
    queryFn: async () => {
      const res = await API.get("/offers/get-active");
      return res.data.offers || [];
    },
  });
}

export function useAdminOffers() {
  return useQuery({
    queryKey: ["offers", "admin"],
    queryFn: async () => {
      const res = await API.get("/offers/get-all");
      return res.data.offers || [];
    },
  });
}

export function useAdminOfferList() {
  return useQuery({
    queryKey: ["offers", "admin"],
    queryFn: async () => {
      const res = await API.get("/offers/get-all");
      return res.data.offers || [];
    },
  });
}

export function useAdminOfferDetail(id) {
  return useQuery({
    queryKey: ["offer", "admin", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await API.get(`/offers/get-by-id?id=${id}`);
      return res.data.offer;
    },
    enabled: !!id,
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ["coupons", "admin"],
    queryFn: async () => {
      const res = await API.get("/coupons/get-all");
      return (res.data.coupons || []).map(mapCouponToFrontend);
    },
  });
}

export function useAdminCouponList() {
  return useQuery({
    queryKey: ["coupons", "admin"],
    queryFn: async () => {
      const res = await API.get("/coupons/get-all");
      return (res.data.coupons || []).map(mapCouponToFrontend);
    },
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useSaveOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }) => {
      const res = id
        ? await API.put("/offers/update-offer", { id, ...form })
        : await API.post("/offers/create-offer", form);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form) => {
      const res = await API.post("/offers/create-offer", form);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }) => {
      const res = await API.put("/offers/update-offer", { id, ...form });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await API.delete("/offers/delete-offer", { data: { id } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useSaveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }) => {
      const payload = mapCouponToBackend(form);
      const res = id
        ? await API.put("/coupons/update-coupon", { id, ...payload })
        : await API.post("/coupons/create-coupon", payload);
      return {
        ...res.data,
        coupon: mapCouponToFrontend(res.data.coupon)
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form) => {
      const payload = mapCouponToBackend(form);
      const res = await API.post("/coupons/create-coupon", payload);
      return {
        ...res.data,
        coupon: mapCouponToFrontend(res.data.coupon)
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }) => {
      const payload = mapCouponToBackend(form);
      const res = await API.put("/coupons/update-coupon", { id, ...payload });
      return {
        ...res.data,
        coupon: mapCouponToFrontend(res.data.coupon)
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await API.delete("/coupons/delete-coupon", { data: { id } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

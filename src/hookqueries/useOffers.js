import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── Helpers for Coupon Mapping ────────────────────────────────────────

const mapCouponToFrontend = (c) => {
  if (!c) return null;
  
  let discountType = "flat";
  if (c.discountPercent > 0) {
    discountType = "percentage";
  } else if (c.freeShipping && c.discountFlat === 0) {
    discountType = "free_shipping";
  }

  return {
    ...c,
    discountType,
    discountValue: discountType === "percentage" ? c.discountPercent : (discountType === "free_shipping" ? 0 : c.discountFlat),
    minOrderValue: c.minOrder,
    maxUsageCount: c.maxUses,
    maxUsesPerUser: c.maxUsesPerUser !== null && c.maxUsesPerUser !== undefined ? Number(c.maxUsesPerUser) : null,
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
    maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
    expiryDate: form.expiresAt || null,
    freeShipping: form.freeShipping || form.discountType === "free_shipping" || false
  };

  if (form.discountType === "percentage") {
    payload.discountPercent = Number(form.discountValue) || 0;
    payload.discountFlat = 0;
  } else if (form.discountType === "free_shipping") {
    payload.discountPercent = 0;
    payload.discountFlat = 0;
    payload.freeShipping = true;
  } else {
    payload.discountFlat = Number(form.discountValue) || 0;
    payload.discountPercent = 0;
  }
  return payload;
};

// ── Helpers for Offer Mapping ──────────────────────────────────────────

const mapOfferToFrontend = (o) => {
  if (!o) return null;
  return {
    ...o,
    id: o.id,
    title: o.name,
    name: o.name,
    description: o.description,
    offerType: o.offerType || "percentage",
    value: o.discountValue,
    discountValue: o.discountValue,
    code: o.code || "",
    appliesTo: o.appliesTo || "all",
    productId: o.productId || "",
    productName: o.productName || null,
    categoryId: o.categoryId || "",
    categoryName: o.categoryName || null,
    minOrderValue: o.minOrderValue,
    maxDiscount: o.maxDiscount,
    startDate: o.startDate ? new Date(o.startDate).toISOString().split('T')[0] : "",
    endDate: o.endDate ? new Date(o.endDate).toISOString().split('T')[0] : "",
    isActive: o.isActive,
    isLive: o.isLive,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
};

const mapOfferToBackend = (form) => {
  return {
    name: form.title,
    description: form.description || null,
    discountValue: Number(form.value) || 0,
    offerType: form.offerType || "percentage",
    code: form.code ? form.code.trim().toUpperCase() : null,
    appliesTo: form.appliesTo || "all",
    productId: form.appliesTo === "product" ? (form.productId || null) : null,
    categoryId: form.appliesTo === "category" ? (form.categoryId || null) : null,
    minOrderValue: Number(form.minOrderValue) || 0,
    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    isActive: form.isActive ?? true
  };
};

// ── QUERIES ─────────────────────────────────────────────────────────

export function useActiveOffers() {
  return useQuery({
    queryKey: ["offers", "active"],
    queryFn: async () => {
      const res = await API.get("/offers/get-active");
      return (res.data.offers || []).map(mapOfferToFrontend);
    },
  });
}

export function useAdminOfferList() {
  return useQuery({
    queryKey: ["offers", "admin"],
    queryFn: async () => {
      const res = await API.get("/offers/get-all");
      return (res.data.offers || []).map(mapOfferToFrontend);
    },
  });
}

export function useAdminOfferDetail(id) {
  return useQuery({
    queryKey: ["offer", "admin", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await API.get(`/offers/get-by-id?id=${id}`);
      return mapOfferToFrontend(res.data.offer);
    },
    enabled: !!id,
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

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form) => {
      const payload = mapOfferToBackend(form);
      const res = await API.post("/offers/create-offer", payload);
      return {
        ...res.data,
        offer: mapOfferToFrontend(res.data.offer)
      };
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
      const payload = mapOfferToBackend(form);
      const res = await API.put("/offers/update-offer", { id, ...payload });
      return {
        ...res.data,
        offer: mapOfferToFrontend(res.data.offer)
      };
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

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
    expiresAt: c.expiryDate,
    showOnHomepage: c.showOnHomepage ?? false
  };
};

const mapCouponToBackend = (form) => {
  const payload = {
    id: form.id,
    code: form.code,
    description: form.description || null,
    isActive: form.isActive,
    showOnHomepage: form.showOnHomepage || false,
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

// ── QUERIES ─────────────────────────────────────────────────────────

export function useAdminCouponList() {
  return useQuery({
    queryKey: ["coupons", "admin"],
    queryFn: async () => {
      console.log("[useAdminCouponList] REQUEST — GET /coupons/get-all");
      try {
        const res = await API.get("/coupons/get-all");
        const mapped = (res.data.coupons || []).map(mapCouponToFrontend);
        console.log(`[useAdminCouponList] STATUS ${res.status} — loaded ${mapped.length} coupons`);
        return mapped;
      } catch (err) {
        console.error(`[useAdminCouponList] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
  });
}

export function usePublicCoupons() {
  return useQuery({
    queryKey: ["coupons", "public"],
    queryFn: async () => {
      console.log("[usePublicCoupons] REQUEST — GET /coupons/get-public");
      try {
        const res = await API.get("/coupons/get-public");
        const mapped = (res.data.coupons || []).map(mapCouponToFrontend);
        console.log(`[usePublicCoupons] STATUS ${res.status} — loaded ${mapped.length} coupons:`, mapped.map(c => c.code));
        return mapped;
      } catch (err) {
        console.error(`[usePublicCoupons] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form) => {
      const payload = mapCouponToBackend(form);
      console.log("[useCreateCoupon] REQUEST — POST /coupons/create-coupon | payload:", payload);
      try {
        const res = await API.post("/coupons/create-coupon", payload);
        console.log(`[useCreateCoupon] STATUS ${res.status} — created:`, res.data.coupon);
        return { ...res.data, coupon: mapCouponToFrontend(res.data.coupon) };
      } catch (err) {
        console.error(`[useCreateCoupon] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[useCreateCoupon] onSuccess — invalidating coupons cache");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }) => {
      const payload = mapCouponToBackend(form);
      console.log(`[useUpdateCoupon] REQUEST — PUT /coupons/update-coupon | id: ${id} | payload:`, payload);
      try {
        const res = await API.put("/coupons/update-coupon", { id, ...payload });
        console.log(`[useUpdateCoupon] STATUS ${res.status} — updated:`, res.data.coupon);
        return { ...res.data, coupon: mapCouponToFrontend(res.data.coupon) };
      } catch (err) {
        console.error(`[useUpdateCoupon] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[useUpdateCoupon] onSuccess — invalidating coupons cache");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      console.log(`[useDeleteCoupon] REQUEST — DELETE /coupons/delete-coupon | id: ${id}`);
      try {
        const res = await API.delete("/coupons/delete-coupon", { data: { id } });
        console.log(`[useDeleteCoupon] STATUS ${res.status} — deleted coupon id: ${id}`);
        return res.data;
      } catch (err) {
        console.error(`[useDeleteCoupon] STATUS ${err.response?.status} — failed:`, err.response?.data?.message || err.message);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[useDeleteCoupon] onSuccess — invalidating coupons cache");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

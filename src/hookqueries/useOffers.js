import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── Helpers for Offer Mapping ──────────────────────────────────────────

const mapOfferToFrontend = (o) => {
  if (!o) return null;
  return {
    ...o,
    id: o.id,
    title: o.name,
    name: o.name,
    description: o.description,
    imageUrl: o.imageUrl || "",
    offerType: o.offerType || "percentage",
    value: o.discountValue,
    discountValue: o.discountValue,
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

export function useActiveStoreWideOffer() {
  return useQuery({
    queryKey: ["offers", "active-storewide"],
    queryFn: async () => {
      const res = await API.get("/offers/active-storewide");
      return res.data.offer || null;
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

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form) => {
      const payload = mapOfferToBackend(form);
      let res;
      if (form.imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v != null) fd.append(k, v); });
        fd.append("imageFile", form.imageFile);
        res = await API.post("/offers/create-offer", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        res = await API.post("/offers/create-offer", payload);
      }
      return { ...res.data, offer: mapOfferToFrontend(res.data.offer) };
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
      let res;
      if (form.imageFile) {
        const fd = new FormData();
        fd.append("id", id);
        Object.entries(payload).forEach(([k, v]) => { if (v != null) fd.append(k, v); });
        fd.append("imageFile", form.imageFile);
        res = await API.put("/offers/update-offer", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        res = await API.put("/offers/update-offer", { id, ...payload });
      }
      return { ...res.data, offer: mapOfferToFrontend(res.data.offer) };
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

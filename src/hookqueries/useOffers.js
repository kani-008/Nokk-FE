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
    showInAnnouncement: o.showInAnnouncement ?? false,
    showAsBanner: o.showAsBanner ?? false,
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
    isActive: form.isActive ?? true,
    showInAnnouncement: form.showInAnnouncement ?? false,
    showAsBanner: form.showAsBanner ?? false,
  };
};

// Builds a multipart FormData from a mapped offer payload, converting
// null/undefined to "" so falsy-coalescing on the backend (`x || null`)
// still clears the field the same way it did when this was sent as JSON.
const buildOfferFormData = (payload, imageFile) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    fd.append(key, value === null || value === undefined ? "" : value);
  });
  if (imageFile) fd.append("imageFile", imageFile);
  return fd;
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
    mutationFn: async ({ form, imageFile }) => {
      const payload = mapOfferToBackend(form);
      const fd = buildOfferFormData(payload, imageFile);
      // Content-Type must be null (not a literal "multipart/form-data" string,
      // and not simply omitted) — the API instance defaults to
      // "application/json" (Api.jsx), and axios's transformRequest JSON-encodes
      // any FormData body whenever the active Content-Type contains
      // "application/json". Setting it to null here overrides that instance
      // default so the browser computes the real header (with boundary) itself.
      const res = await API.post("/offers/create-offer", fd, {
        headers: { "Content-Type": null },
      });
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
    mutationFn: async ({ id, form, imageFile }) => {
      const payload = mapOfferToBackend(form);
      const fd = buildOfferFormData(payload, imageFile);
      fd.append("id", id);
      // See useCreateOffer for why this must be null rather than a literal
      // "multipart/form-data" string or an omitted header.
      const res = await API.put("/offers/update-offer", fd, {
        headers: { "Content-Type": null },
      });
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

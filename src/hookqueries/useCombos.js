import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── Helpers for Combo Mapping ──────────────────────────────────────────
// Kept even though most field names already match directly — this is the
// same seam that made the earlier coupon-field mismatch easy to fix in one
// place instead of scattered across components.

const mapComboToFrontend = (c) => {
  if (!c) return null;
  return {
    ...c,
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl || "",
    comboPrice: c.comboPrice,
    isActive: c.isActive,
    isLive: c.isLive,
    startDate: c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : "",
    endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
    items: c.items || [],
    inStock: c.inStock,
    individualTotal: c.individualTotal,
    savings: c.savings,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

const mapComboToBackend = (form) => {
  return {
    name: form.name,
    description: form.description || null,
    comboPrice: Number(form.comboPrice) || 0,
    isActive: form.isActive ?? true,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    items: JSON.stringify(
      (form.items || []).map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: Number(i.quantity) || 1,
      }))
    ),
  };
};

// ── QUERIES ─────────────────────────────────────────────────────────

export function useActiveCombos() {
  return useQuery({
    queryKey: ["combos", "active"],
    queryFn: async () => {
      const res = await API.get("/combos/get-active");
      return (res.data.combos || []).map(mapComboToFrontend);
    },
  });
}

export function useAdminComboList() {
  return useQuery({
    queryKey: ["combos", "admin"],
    queryFn: async () => {
      const res = await API.get("/combos/get-all");
      return (res.data.combos || []).map(mapComboToFrontend);
    },
  });
}

export function useAdminComboDetail(id) {
  return useQuery({
    queryKey: ["combo", "admin", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await API.get(`/combos/get-by-id?id=${id}`);
      return mapComboToFrontend(res.data.combo);
    },
    enabled: !!id,
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useCreateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form) => {
      const payload = mapComboToBackend(form);
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => { if (v != null) fd.append(k, v); });
      if (form.imageFile) fd.append("imageFile", form.imageFile);
      const res = await API.post("/combos/create-combo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      return { ...res.data, combo: mapComboToFrontend(res.data.combo) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}

export function useUpdateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }) => {
      const payload = mapComboToBackend(form);
      const fd = new FormData();
      fd.append("id", id);
      Object.entries(payload).forEach(([k, v]) => { if (v != null) fd.append(k, v); });
      if (form.imageFile) fd.append("imageFile", form.imageFile);
      const res = await API.put("/combos/update-combo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      return { ...res.data, combo: mapComboToFrontend(res.data.combo) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await API.delete("/combos/delete-combo", { data: { id } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}

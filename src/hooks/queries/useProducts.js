import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

// ── QUERIES ─────────────────────────────────────────────────────────

export function useProductCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await API.get("/categories/get-all");
      return res.data.categories || [];
    },
  });
}

export function useWeightLabels() {
  return useQuery({
    queryKey: ["weightLabels"],
    queryFn: async () => {
      const res = await API.get("/products/weight-labels");
      return res.data.weightLabels || [];
    },
  });
}

export function useProductList(params, options = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await API.get("/products/get-all", { params });
      return res.data;
    },
    ...options,
  });
}

export function useProductDetail(slug) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await API.get(`/products/get-by-slug?slug=${slug}`);
      return res.data.product;
    },
    enabled: !!slug,
  });
}

export function useAdminProductList(params) {
  return useQuery({
    queryKey: ["products", "admin", params],
    queryFn: async () => {
      const res = await API.get("/products/get-all", { params });
      return res.data;
    },
  });
}

export function useAdminProductDetail(slug) {
  return useQuery({
    queryKey: ["product", "admin", slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await API.get(`/products/get-by-slug?slug=${slug}`);
      return res.data.product;
    },
    enabled: !!slug,
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useAddReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/products/add-review", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific product details query to load the new review list
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/products/create-product", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/products/update-product", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await API.delete("/products/delete-product", { data: { id } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAddProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/products/add-variant", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/products/update-variant", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantId }) => {
      const res = await API.delete("/products/delete-variant", { data: { productId, variantId } });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useAddProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body }) => {
      const res = await API.post("/products/add-images", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }) => {
      const res = await API.delete("/products/delete-image", { data: { productId, imageId } });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
    },
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: async (body) => {
      const res = await API.post("/upload/product", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });
}

export function useDeleteUploadedFile() {
  return useMutation({
    mutationFn: async (url) => {
      const res = await API.delete("/upload/delete-file", { data: { url } });
      return res.data;
    },
  });
}

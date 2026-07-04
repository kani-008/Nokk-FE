import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";
import { useAuthStore } from "../components/store/AuthStore";

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

export function useSimilarProducts(productId, options = {}) {
  return useQuery({
    queryKey: ["products", "similar", productId],
    queryFn: async () => {
      const res = await API.get("/products/similar", { params: { productId, limit: 8 } });
      return res.data.products || [];
    },
    enabled: !!productId,
    ...options,
  });
}

export function useSimilarProductsMulti(productIds, options = {}) {
  return useQuery({
    queryKey: ["products", "similar-multi", productIds],
    queryFn: async () => {
      const res = await API.get("/products/similar-multi", { params: { productIds, limit: 8 } });
      return res.data.products || [];
    },
    enabled: !!productIds,
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
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.productId && variables.orderId) {
        queryClient.invalidateQueries({ queryKey: ["my-review", variables.productId, variables.orderId] });
      }
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/products/update-review", payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.productId && variables.orderId) {
        queryClient.invalidateQueries({ queryKey: ["my-review", variables.productId, variables.orderId] });
      }
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.delete("/products/delete-my-review", { data: payload });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.productId && variables.orderId) {
        queryClient.invalidateQueries({ queryKey: ["my-review", variables.productId, variables.orderId] });
      }
    },
  });
}

export function useMyReview(productId, orderId) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["my-review", productId, orderId],
    queryFn: async () => {
      if (!productId || !orderId) return null;
      const res = await API.get(`/products/get-my-review?productId=${productId}&orderId=${orderId}`);
      return res.data.review;
    },
    enabled: !!productId && !!orderId && !!token,
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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

export function useUploadReviewImage() {
  return useMutation({
    mutationFn: async (body) => {
      // body must be a FormData containing `file` (binary) and `slug` (string).
      // The caller must verify slug is non-empty before calling mutateAsync —
      // the backend rejects the request without it.
      const res = await API.post("/upload/review-image", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data; // expected: { url: "..." }
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

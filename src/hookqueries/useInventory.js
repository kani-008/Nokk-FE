import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── QUERIES ─────────────────────────────────────────────────────────

export function useInventoryList(params) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: async () => {
      const res = await API.get("/inventory/get-inventory", { params });
      return res.data;
    },
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useUpdateStock(params) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, inStock }) => {
      const res = await API.put("/inventory/update-stock", { variantId, inStock });
      return res.data;
    },
    onMutate: async ({ variantId, inStock }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["inventory", params] });

      // Snapshot previous data
      const previousInventory = queryClient.getQueryData(["inventory", params]);

      // Optimistically toggle stockQty (1 = In Stock, 0 = Out of Stock)
      queryClient.setQueryData(["inventory", params], (old) => {
        if (!old) return old;
        return {
          ...old,
          inventory: (old.inventory || []).map((item) =>
            item.variantId === variantId ? { ...item, stockQty: inStock ? 1 : 0 } : item
          ),
        };
      });

      return { previousInventory };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousInventory) {
        queryClient.setQueryData(["inventory", params], context.previousInventory);
      }
    },
    onSettled: () => {
      // Invalidate to sync server state
      queryClient.invalidateQueries({ queryKey: ["inventory", params] });
    },
  });
}

export function useBulkUpdateStock(params) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ updates }) => {
      const res = await API.post("/inventory/bulk-update", { updates });
      return res.data;
    },
    onMutate: async ({ updates }) => {
      await queryClient.cancelQueries({ queryKey: ["inventory", params] });
      const previousInventory = queryClient.getQueryData(["inventory", params]);

      queryClient.setQueryData(["inventory", params], (old) => {
        if (!old) return old;
        const updateMap = new Map(updates.map(u => [u.variantId, u.inStock]));
        return {
          ...old,
          inventory: (old.inventory || []).map((item) => {
            if (updateMap.has(item.variantId)) {
              return { ...item, stockQty: updateMap.get(item.variantId) ? 1 : 0 };
            }
            return item;
          }),
        };
      });

      return { previousInventory };
    },
    onError: (err, variables, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(["inventory", params], context.previousInventory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", params] });
    },
  });
}

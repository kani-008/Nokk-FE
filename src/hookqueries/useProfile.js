import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// ── Address shape helper ─────────────────────────────────────────────
function mapAddr(addr) {
  return {
    id:           addr.id,
    label:        addr.label,
    name:         addr.full_name,
    phone:        addr.phone,
    addressLine1: addr.address_line1,
    addressLine2: addr.address_line2 || "",
    taluk:        addr.taluk || "",
    city:         addr.city,
    state:        addr.state,
    pincode:      addr.pincode,
    isDefault:    addr.is_default,
  };
}

// ── QUERIES ─────────────────────────────────────────────────────────

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await API.get("/users/me/addresses");
      return (res.data.addresses || []).map(mapAddr);
    },
    staleTime: 60_000,
  });
}

// ── Pincode lookup (not a query — called imperatively from forms) ────
export async function lookupPincode(pincode) {
  /*
  const res = await API.get(`/pincode/get-by-pincode?pincode=${pincode}`);
  return res.data.data; // { pincode, district, state, taluk, offices }
  */

  const apiKey = "579b464db66ec23bdd000001f5f5495c8f4f4d27412f3be4880d9b57";
  const resourceId = "6176ee09-3d56-4a3b-8115-21841576b2f6";
  const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&filters[pincode]=${pincode}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch pincode details from government API");
  }
  const result = await response.json();
  const records = result.records || [];
  if (records.length === 0) {
    throw new Error("Pincode not found");
  }

  let bestRecord = records.find(r => r.deliverystatus === "Delivery" && r.taluk && r.taluk !== "NA");
  if (!bestRecord) {
    bestRecord = records.find(r => r.taluk && r.taluk !== "NA");
  }
  if (!bestRecord) {
    bestRecord = records.find(r => r.deliverystatus === "Delivery");
  }
  if (!bestRecord) {
    bestRecord = records[0];
  }

  const formatState = (str) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return {
    pincode: pincode,
    district: bestRecord.districtname || "",
    state: formatState(bestRecord.statename) || "",
    taluk: bestRecord.taluk && bestRecord.taluk !== "NA" ? bestRecord.taluk : "",
  };
}

// ── MUTATIONS ───────────────────────────────────────────────────────

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/users/me/update", payload);
      return res.data;
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/users/me/password", payload);
      return res.data;
    },
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.post("/users/me/add-address", payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Optimistic-style: push the new address into cache immediately
      queryClient.setQueryData(["addresses"], (old = []) => [
        ...old,
        mapAddr(data.address),
      ]);
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await API.put("/users/me/update-address", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["addresses"], (old = []) =>
        old.map((a) => (a.id === data.address.id ? mapAddr(data.address) : a))
      );
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (addressId) => {
      const res = await API.delete("/users/me/delete-address", { data: { addressId } });
      return res.data;
    },
    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: ["addresses"] });
      const previous = queryClient.getQueryData(["addresses"]);
      queryClient.setQueryData(["addresses"], (old = []) =>
        old.filter((a) => a.id !== addressId)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["addresses"], ctx.previous);
    },
  });
}

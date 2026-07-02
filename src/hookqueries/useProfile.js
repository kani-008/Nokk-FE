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

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await API.get("/users/me");
      return res.data.user;
    },
    staleTime: 2 * 60_000,
  });
}

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
// Proxied through the backend (/api/location/pincode) so the gov API key
// never ships to the client.
export async function lookupPincode(pincode) {
  try {
    const res = await API.get("/location/pincode", { params: { pincode } });
    return res.data.data; // { pincode, district, state, taluk }
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("Pincode request timed out. Please try again or fill fields manually.");
    }
    if (err.response?.status === 404) {
      throw new Error("Pincode not found");
    }
    throw new Error(err.response?.data?.message || "Failed to fetch pincode details");
  }
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

// ── Geolocation Reverse Geocoding ──
// Proxied through the backend (/api/location/reverse-geocode), which also
// enriches the result via the gov pincode directory server-side.
export async function reverseGeocode(lat, lng) {
  try {
    const res = await API.get("/location/reverse-geocode", { params: { lat, lng } });
    return res.data.data; // { pincode, city, taluk, state }
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("Location detection timed out. Please try again or fill fields manually.");
    }
    throw new Error(err.response?.data?.message || "Failed to detect location details");
  }
}

export async function detectAddressFromCoords(lat, lng) {
  return reverseGeocode(lat, lng);
}

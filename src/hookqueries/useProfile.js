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
export async function lookupPincode(pincode) {
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    throw new Error("A valid 6-digit pincode is required");
  }

  try {
    console.log(`[FE] lookupPincode → backend /location/pincode for: ${pincode}`);
    const res = await API.get("/location/pincode", { params: { pincode } });
    console.log(`[FE] lookupPincode response:`, res.data);
    return res.data.data; // { pincode, district, state, taluk }
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    console.error(`[FE] lookupPincode failed: status ${status}, message: ${message}`);
    if (status === 404) throw new Error("Pincode not found");
    if (status === 504) throw new Error("Pincode request timed out. Please try again or fill fields manually.");
    throw new Error(message || "Failed to fetch pincode details");
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
export async function reverseGeocode(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Valid lat and lng are required");
  }

  try {
    console.log(`[FE] reverseGeocode → backend /location/reverse-geocode: lat=${latitude}, lng=${longitude}`);
    const res = await API.get("/location/reverse-geocode", { params: { lat: latitude, lng: longitude } });
    console.log(`[FE] reverseGeocode response:`, res.data);
    return res.data.data; // { pincode, city, taluk, state }
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    console.error(`[FE] reverseGeocode failed: status ${status}, message: ${message}`);
    if (status === 504) throw new Error("Location detection timed out. Please try again or fill fields manually.");
    throw new Error(message || "Failed to detect location details");
  }
}

export async function detectAddressFromCoords(lat, lng) {
  return reverseGeocode(lat, lng);
}

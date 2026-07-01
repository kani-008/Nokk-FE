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
  /*
  const res = await API.get(`/pincode/get-by-pincode?pincode=${pincode}`);
  return res.data.data; // { pincode, district, state, taluk, offices }
  */

  const apiKey = import.meta.env.VITE_GOV_API_KEY;
  const resourceId = import.meta.env.VITE_GOV_PINCODE_RESOURCE_ID;
  const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&filters[pincode]=${pincode}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
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
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("Pincode request timed out. Please try again or fill fields manually.");
    }
    throw err;
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
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error("Failed to detect location details");
    }
    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error("Location details not found");
    }

    const properties = data.features[0].properties || {};
    return {
      pincode: properties.postcode || "",
      city: properties.city || properties.county || "",
      taluk: properties.suburb || properties.district || "",
      state: properties.state || ""
    };
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("Location detection timed out. Please try again or fill fields manually.");
    }
    throw err;
  }
}

export async function detectAddressFromCoords(lat, lng) {
  const geo = await reverseGeocode(lat, lng);
  if (geo.pincode && /^\d{6}$/.test(geo.pincode)) {
    try {
      const gov = await lookupPincode(geo.pincode);
      return {
        pincode: geo.pincode,
        city: gov.district || geo.city,
        taluk: gov.taluk && gov.taluk !== "NA" ? gov.taluk : geo.taluk,
        state: gov.state || geo.state
      };
    } catch {
      // fallback to raw OSM values
    }
  }
  return geo;
}

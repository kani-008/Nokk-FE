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

// Helper for formatting state names (e.g. "TAMIL NADU" -> "Tamil Nadu")
const formatState = (str) => {
  if (!str) return "";
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Pincode lookup (not a query — called imperatively from forms) ────
export async function lookupPincode(pincode) {
  const apiKey = import.meta.env.VITE_GOV_API_KEY;
  const resourceId = import.meta.env.VITE_GOV_PINCODE_RESOURCE_ID;
  
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    throw new Error("A valid 6-digit pincode is required");
  }

  const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&filters[pincode]=${pincode}`;
  
  try {
    console.log(`[FE] Direct lookupPincode requesting India Gov API for pincode: ${pincode}`);
    const response = await fetchWithTimeout(url, 6000);
    console.log(`[FE] Direct lookupPincode Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const err = new Error("Failed to fetch pincode details");
      err.status = response.status;
      throw err;
    }
    
    const result = await response.json();
    const records = result.records || [];
    console.log(`[FE] India Gov API Records Found: ${records.length}`);
    
    if (records.length === 0) {
      const err = new Error("Pincode not found");
      err.status = 404;
      throw err;
    }

    let bestRecord = records.find((r) => r.deliverystatus === "Delivery" && r.taluk && r.taluk !== "NA");
    if (!bestRecord) bestRecord = records.find((r) => r.taluk && r.taluk !== "NA");
    if (!bestRecord) bestRecord = records.find((r) => r.deliverystatus === "Delivery");
    if (!bestRecord) bestRecord = records[0];

    const data = {
      pincode,
      district: bestRecord.districtname || "",
      state: formatState(bestRecord.statename) || "",
      taluk: bestRecord.taluk && bestRecord.taluk !== "NA" ? bestRecord.taluk : "",
    };

    return data;
  } catch (err) {
    const timedOut = err.name === "AbortError";
    const status = timedOut ? 504 : (err.status || 500);
    console.error(`[FE] lookupPincode failed: status ${status}, message: ${err.message}`);
    
    if (timedOut) {
      throw new Error("Pincode request timed out. Please try again or fill fields manually.");
    }
    if (status === 404) {
      throw new Error("Pincode not found");
    }
    throw new Error(err.message || "Failed to fetch pincode details");
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

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${apiKey}`;

  try {
    console.log(`[FE] Direct reverseGeocode requesting Geoapify API with coords: lat=${lat}, lng=${lng}`);
    const response = await fetchWithTimeout(url, 7000);
    console.log(`[FE] Direct reverseGeocode Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const err = new Error("Failed to detect location details");
      err.status = response.status;
      throw err;
    }
    
    const geoData = await response.json();
    const features = geoData.features || [];
    console.log(`[FE] Geoapify Features Found: ${features.length}`);
    
    if (features.length === 0) {
      const err = new Error("Location details not found");
      err.status = 404;
      throw err;
    }

    const properties = features[0].properties || {};
    const data = {
      pincode: properties.postcode || "",
      city: properties.city || properties.county || "",
      taluk: properties.suburb || properties.district || "",
      state: properties.state || "",
    };

    return data;
  } catch (err) {
    const timedOut = err.name === "AbortError";
    const status = timedOut ? 504 : (err.status || 500);
    console.error(`[FE] reverseGeocode failed: status ${status}, message: ${err.message}`);
    
    if (timedOut) {
      throw new Error("Location detection timed out. Please try again or fill fields manually.");
    }
    throw new Error(err.message || "Failed to detect location details");
  }
}

export async function detectAddressFromCoords(lat, lng) {
  return reverseGeocode(lat, lng);
}

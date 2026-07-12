import { useQuery } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

// Fetches all public settings from GET /settings/get-all.
// Used by Payment.jsx (payment method gating), CustomerLayout (maintenance mode),
// NavBar (announcement banner), and Register.jsx (registration gate).
export function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await API.get("/settings/get-all");
      return res.data.settings || {};
    },
    staleTime: 5 * 60_000, // settings change rarely — cache 5 mins
  });
}

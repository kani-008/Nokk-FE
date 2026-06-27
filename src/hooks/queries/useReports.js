import { useQuery } from "@tanstack/react-query";
import API from "../../ApiCall/Api.jsx";

export function useReportsData(period) {
  return useQuery({
    queryKey: ["reports", period],
    queryFn: async () => {
      const res = await API.get(`/dashboard/reports?period=${period}`);
      return res.data;
    },
    enabled: !!period,
  });
}

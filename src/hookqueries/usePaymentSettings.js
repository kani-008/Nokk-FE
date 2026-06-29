import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

export function usePaymentSettingsPublic() {
  return useQuery({
    queryKey: ["payment-settings", "public"],
    queryFn: async () => {
      const res = await API.get("/settings/get-all");
      const settings = res.data.settings || {};
      return {
        upiId: settings.upiId || "",
        payeeName: settings.payeeName || "",
        qrCodeUrl: settings.qrCodeUrl || "",
      };
    },
  });
}

export function usePaymentSettingsAdmin() {
  return useQuery({
    queryKey: ["payment-settings", "admin"],
    queryFn: async () => {
      const res = await API.get("/settings/get-all");
      const settings = res.data.settings || {};
      return {
        upiId: settings.upiId || "",
        payeeName: settings.payeeName || "",
        accountHolderName: settings.accountHolderName || "",
        accountNumber: settings.accountNumber || "",
        ifscCode: settings.ifscCode || "",
        bankName: settings.bankName || "",
        qrCodeUrl: settings.qrCodeUrl || "",
      };
    },
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await API.put("/settings/update", data);
      return res.data.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
    },
  });
}

export function useUploadQrCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "image");
      const res = await API.post("/upload/banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { success: true, qrCodeUrl: res.data.url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
    },
  });
}

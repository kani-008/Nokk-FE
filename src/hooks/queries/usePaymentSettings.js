import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PAYMENT_KEY = "nok-mock-payment-settings";
const PAYMENT_DEFAULTS = {
  upiId: "nammaoor@upi",
  payeeName: "Namma Oor Karuvattu Kadai",
  accountHolderName: "Namma Oor Store",
  accountNumber: "123456789012",
  ifscCode: "SBIN0001234",
  bankName: "State Bank of India",
  qrCodeUrl: ""
};

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const getLS = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k)) || def; } catch { return def; }
};

const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export function usePaymentSettingsPublic() {
  return useQuery({
    queryKey: ["payment-settings", "public"],
    queryFn: async () => {
      await delay();
      const settings = getLS(PAYMENT_KEY, PAYMENT_DEFAULTS);
      return {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        qrCodeUrl: settings.qrCodeUrl,
      };
    },
  });
}

export function usePaymentSettingsAdmin() {
  return useQuery({
    queryKey: ["payment-settings", "admin"],
    queryFn: async () => {
      await delay();
      return getLS(PAYMENT_KEY, PAYMENT_DEFAULTS);
    },
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      await delay();
      const merged = { ...getLS(PAYMENT_KEY, PAYMENT_DEFAULTS), ...data };
      setLS(PAYMENT_KEY, merged);
      return merged;
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
      await delay(300);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const s = { ...getLS(PAYMENT_KEY, PAYMENT_DEFAULTS), qrCodeUrl: reader.result };
          setLS(PAYMENT_KEY, s);
          resolve({ success: true, qrCodeUrl: reader.result });
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
    },
  });
}

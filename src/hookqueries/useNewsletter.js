import { useMutation } from "@tanstack/react-query";
import API from "../ApiCall/Api.jsx";

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (email) => {
      console.log(`[useSubscribeNewsletter] REQUEST — POST /newsletter/subscribe | email: "${email}"`);
      try {
        const res = await API.post("/newsletter/subscribe", { email });
        console.log(`[useSubscribeNewsletter] STATUS ${res.status} — success`);
        return res.data;
      } catch (err) {
        console.error(
          `[useSubscribeNewsletter] STATUS ${err.response?.status} — failed:`,
          err.response?.data?.message || err.message
        );
        throw err;
      }
    },
  });
}
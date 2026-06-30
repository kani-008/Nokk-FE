import { useState, useEffect } from "react";

export function useRazorpayScript() {
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!window.Razorpay);

  useEffect(() => {
    if (ready) return;

    const scriptId = "razorpay-checkout-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setReady(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay SDK");
        setReady(false);
      };
      document.body.appendChild(script);
    } else {
      const handleLoad = () => setReady(true);
      script.addEventListener("load", handleLoad);
      return () => {
        script.removeEventListener("load", handleLoad);
      };
    }
  }, [ready]);

  return ready;
}

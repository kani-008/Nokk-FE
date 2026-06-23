import { useState, useEffect } from "react";

/**
 * Reusable hook to handle showing/hiding message toasts with fade-out delay.
 * Supports both "error" and "success" types.
 */
export function useToast() {
    const [toast, setToast] = useState({ message: "", type: "error" });
    const [displayedToast, setDisplayedToast] = useState({ message: "", type: "error" });
    const [toastVisible, setToastVisible] = useState(false);

    useEffect(() => {
        let active = true;
        if (toast.message) {
            const t = setTimeout(() => {
                if (!active) return;
                setDisplayedToast(toast);
                setToastVisible(true);
            }, 0);
            return () => {
                active = false;
                clearTimeout(t);
            };
        } else {
            const t1 = setTimeout(() => {
                if (!active) return;
                setToastVisible(false);
            }, 0);
            const t2 = setTimeout(() => {
                if (!active) return;
                setDisplayedToast({ message: "", type: "error" });
            }, 300); // Matches duration-300 transition duration
            return () => {
                active = false;
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [toast]);

    return {
        // Backward compatibility mapping
        error: toast.message,
        setError: (msg) => setToast({ message: msg, type: "error" }),
        setSuccess: (msg) => setToast({ message: msg, type: "success" }),
        clearToast: () => setToast({ message: "", type: "error" }),
        displayedError: displayedToast.message,
        displayedType: displayedToast.type,
        toastVisible,
    };
}

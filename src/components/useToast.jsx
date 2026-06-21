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
        if (toast.message) {
            setDisplayedToast(toast);
            setToastVisible(true);
        } else {
            setToastVisible(false);
            const t = setTimeout(() => {
                setDisplayedToast({ message: "", type: "error" });
            }, 300); // Matches duration-300 transition duration
            return () => clearTimeout(t);
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

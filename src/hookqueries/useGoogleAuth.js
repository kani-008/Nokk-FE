import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../ApiCall/Api";
import { useAuthStore } from "../components/store/AuthStore";

/**
 * Shared Google Sign-In handler used by both Login.jsx and Register.jsx.
 *
 * Returns:
 *  - handleGoogleCredential(credential)  — call from GoogleAuthButton's onCredential
 *  - needsPasswordConfirm    — true when the server returned NEEDS_PASSWORD_CONFIRM
 *  - pendingCredential       — the Google ID token held for the confirm step
 *  - handlePasswordConfirm(password) — submit password to /auth/google-link-confirm
 *  - clearConfirm()          — dismiss the password-confirm panel
 *  - googleLoading           — loading state for the Google flow
 *
 * @param {Object} opts
 * @param {string} opts.redirectTo       — where to go after login (role-based override still applies for admins)
 * @param {Function} opts.setError       — toast error setter
 * @param {Function} opts.setLoading     — parent loading setter (external to the hook)
 * @param {"login"|"register"} opts.page — which page is using this hook
 */
export function useGoogleAuth({ redirectTo = "/", setError, setLoading, page = "login" }) {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [needsPasswordConfirm, setNeedsPasswordConfirm] = useState(false);
    const [pendingCredential, setPendingCredential] = useState(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const signInAndRedirect = useCallback((data) => {
        login(data.user, data.accessToken, data.refreshToken);
        navigate(data.user?.role === "admin" ? "/admin" : redirectTo, { replace: true });
    }, [login, navigate, redirectTo]);

    const handleGoogleCredential = useCallback(async (credential) => {
        setGoogleLoading(true);
        setLoading(true);
        setNeedsPasswordConfirm(false);
        setPendingCredential(null);

        try {
            const res = await API.post("/auth/google-login", { credential });
            const data = res.data;

            if (data.success) {
                signInAndRedirect(data);
                return;
            }

            if (data.code === "DEACTIVATED") {
                if (page === "register") {
                    navigate("/login", {
                        replace: true,
                        state: { googleDeactivated: true, credential },
                    });
                    return;
                }
                // Login page handles DEACTIVATED via its own view + reactivateCreds,
                // but with Google the reactivation goes through google-link-confirm
                // (which now also reactivates on successful password match).
                // Return the code so the caller can wire its own deactivated view.
                setPendingCredential(credential);
                setError("");
                return data;
            }

            if (data.code === "NEEDS_PASSWORD_CONFIRM") {
                setPendingCredential(credential);
                setNeedsPasswordConfirm(true);
                setError("");
                return;
            }

            setError(data.message || "Google sign-in failed. Please try again.");
        } catch (err) {
            setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
        } finally {
            setGoogleLoading(false);
            setLoading(false);
        }
    }, [setError, setLoading, signInAndRedirect, navigate, page]);

    const handlePasswordConfirm = useCallback(async (password) => {
        if (!pendingCredential || !password) return;
        setGoogleLoading(true);
        setLoading(true);

        try {
            const res = await API.post("/auth/google-link-confirm", {
                credential: pendingCredential,
                password,
            });
            if (res.data.success) {
                signInAndRedirect(res.data);
                return;
            }
            setError(res.data.message || "Could not link account. Please try again.");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid password. Please try again.");
        } finally {
            setGoogleLoading(false);
            setLoading(false);
        }
    }, [pendingCredential, setError, setLoading, signInAndRedirect]);

    const clearConfirm = useCallback(() => {
        setNeedsPasswordConfirm(false);
        setPendingCredential(null);
    }, []);

    return {
        handleGoogleCredential,
        needsPasswordConfirm,
        pendingCredential,
        handlePasswordConfirm,
        clearConfirm,
        googleLoading,
    };
}

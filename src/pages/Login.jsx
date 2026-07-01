import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Eye, EyeOff, Phone, Mail, Lock, ArrowRight, Loader2, KeyRound, ShieldCheck,
} from "lucide-react";
import API from "../ApiCall/Api";
import { useAuthStore } from "../components/store/AuthStore";
import { useToast } from "../components/useToast";
import AuthLayout, { StepDots, OtpBoxes, fieldClass } from "../components/layout/AuthLayout";

const OTP_LENGTH = 6;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");

// a bare 10-digit number (optionally with spaces) is treated as a phone number,
// anything else is sent as email — single field, no separate phone/email tabs
const isPhoneLike = (value) => /^\d{10}$/.test(value.replace(/\s+/g, ""));
const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v.trim());


export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const redirectTo = location.state?.from || "/";

    // ── Custom Toast Hook (supports error & success) ──
    const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();

    // ── Login Form State ──
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // ── View States ──
    const [view, setView] = useState("login"); // "login" | "deactivated" | "forgot-phone" | "forgot-otp" | "forgot-reset"

    // ── Reactivation credentials (saved from login attempt) ──
    const [reactivateCreds, setReactivateCreds] = useState(null);

    // ── Forgot Password Form State ──
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(EMPTY_OTP);
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showFpPw, setShowFpPw] = useState(false);
    const [showFpCf, setShowFpCf] = useState(false);
    const [forgotErrors, setForgotErrors] = useState({});
    const [otpExpiryTime, setOtpExpiryTime] = useState(0);

    const clearForgotErrors = useCallback(() => {
        setForgotErrors({});
        setError("");
    }, [setError]);

    const goToOtpStep = useCallback(() => {
        setView("forgot-phone");
        setOtp(EMPTY_OTP);
        clearForgotErrors();
    }, [clearForgotErrors]);

    // ── OTP Expiration background check (3 minutes) ──
    useEffect(() => {
        if (view !== "forgot-otp" || otpExpiryTime === 0) return;

        const checkExpiry = setInterval(() => {
            if (Date.now() >= otpExpiryTime) {
                clearInterval(checkExpiry);
                setError("OTP expired. Please try again.");
                goToOtpStep();
            }
        }, 1000);

        return () => clearInterval(checkExpiry);
    }, [view, otpExpiryTime, setError, goToOtpStep]);

    const set = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setError("");
    };

    // ── Login Handler ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.identifier.trim()) { setError("Please enter your phone number or email"); return; }
        if (!form.password.trim()) { setError("Please enter your password"); return; }

        const trimmedId = form.identifier.trim().replace(/\s+/g, "");

        // ── DEV BYPASS — remove before production ─────────────────────
        const devAccounts = [
            { id: "9999999999", pw: "admin123",    role: "admin",    name: "Dev Admin",    to: "/admin"   },
            { id: "8888888888", pw: "customer123", role: "customer", name: "Dev Customer", to: redirectTo },
        ];
        const dev = devAccounts.find((a) => trimmedId === a.id && form.password === a.pw);
        if (dev) {
            login({ id: `dev-${dev.role}`, phone: dev.id, role: dev.role, name: dev.name }, `dev-token-${dev.role}`, null);
            navigate(dev.to, { replace: true });
            return;
        }
        // ─────────────────────────────────────────────────────────────

        setLoading(true);
        try {
            const payload = isPhoneLike(trimmedId)
                ? { identifier: trimmedId, password: form.password }
                : { identifier: trimmedId.toLowerCase(), password: form.password };
            console.log("[FE] POST /auth/user-login", { identifier: payload.identifier });
            const response = await API.post("/auth/user-login", payload);
            console.log("[FE] POST /auth/user-login →", response.status, { userId: response.data.user?.id, role: response.data.user?.role });
            const res = response.data;
            if (res.code === "DEACTIVATED") {
                setReactivateCreds(payload);
                setView("deactivated");
                return;
            }
            login(res.user, res.accessToken || res.token, res.refreshToken);
            navigate(res.user?.role === "admin" ? "/admin" : redirectTo, { replace: true });
        } catch (err) {
            console.error("[FE] POST /auth/user-login →", err.response?.status ?? "network error", err.response?.data?.message ?? err.message);
            setError(err.response?.data?.message || err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoginKeyDown = (e) => {
        if (e.key === "Enter" && !loading) handleSubmit(e);
    };

    // ── Reactivation Handler ──
    const handleReactivate = async () => {
        if (!reactivateCreds) return;
        setLoading(true);
        try {
            const res = await API.post("/auth/reactivate", reactivateCreds);
            login(res.data.user, res.data.accessToken, res.data.refreshToken);
            navigate(res.data.user?.role === "admin" ? "/admin" : redirectTo, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reactivate account. Please try again.");
            setView("login");
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot Password Handlers ──
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!isValidPhone(phone)) { setForgotErrors({ phone: "Enter a valid 10-digit mobile number" }); return; }
        setForgotErrors({});

        setLoading(true);
        try {
            console.log("[FE] POST /auth/otp-create", { phone });
            const res = await API.post("/auth/otp-create", { phone, identifier: phone });
            console.log("[FE] POST /auth/otp-create →", res.status, res.data?.message);
            setView("forgot-otp");
            setOtpExpiryTime(Date.now() + 180 * 1000);
        } catch (err) {
            console.error("[FE] POST /auth/otp-create →", err.response?.status ?? "network error", err.response?.data?.message ?? err.message);
            setError(err.response?.data?.message || err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneKeyDown = (e) => {
        if (e.key === "Enter" && !loading) handleSendOtp(e);
    };

    const handleResend = async () => {
        setOtp(EMPTY_OTP);
        setLoading(true);
        try {
            console.log("[FE] POST /auth/otp-create (resend)", { phone });
            const res = await API.post("/auth/otp-create", { phone, identifier: phone });
            console.log("[FE] POST /auth/otp-create (resend) →", res.status, res.data?.message);
            setOtpExpiryTime(Date.now() + 180 * 1000);
        } catch (err) {
            console.error("[FE] POST /auth/otp-create (resend) →", err.response?.status ?? "network error", err.response?.data?.message ?? err.message);
            setError(err.response?.data?.message || err.message || "Could not resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otp.some((d) => d === "")) { setForgotErrors({ otp: "Enter the 6-digit OTP" }); return; }

        setLoading(true);
        try {
            console.log("[FE] POST /auth/otp-verify", { phone });
            const res = await API.post("/auth/otp-verify", { phone, identifier: phone, otp: otpValue });
            console.log("[FE] POST /auth/otp-verify →", res.status, res.data?.message);
            setView("forgot-reset");
        } catch (err) {
            console.error("[FE] POST /auth/otp-verify →", err.response?.status ?? "network error", err.response?.data?.message ?? err.message);
            setError(err.response?.data?.message || err.message || "Invalid or expired OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        setOtp((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
        clearForgotErrors();
        if (value && index < OTP_LENGTH - 1) {
            document.getElementById(`fp-otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`fp-otp-${index - 1}`)?.focus();
        }
        if (e.key === "Enter" && !loading) {
            handleVerifyOtp(e);
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;
        const updated = [...EMPTY_OTP];
        pasted.split("").forEach((char, i) => { updated[i] = char; });
        setOtp(updated);
        clearForgotErrors();
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        document.getElementById(`fp-otp-${focusIndex}`)?.focus();
    };

    const validateStep3 = () => {
        const e = {};
        if (newPw.length < 6) e.newPw = "Minimum 6 characters";
        if (newPw !== confirmPw) e.confirmPw = "Passwords do not match";
        setForgotErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;

        setLoading(true);
        try {
            console.log("[FE] POST /auth/reset-password", { phone: phone.trim() });
            const res = await API.post("/auth/reset-password", {
                phone: phone.trim(),
                identifier: phone.trim(),
                password: newPw,
                newPassword: newPw,
                confirmPass: confirmPw,
            });
            console.log("[FE] POST /auth/reset-password →", res.status, res.data?.message);
            setSuccess("Password reset successful.");
            resetForgotFlow(true);
        } catch (err) {
            console.error("[FE] POST /auth/reset-password →", err.response?.status ?? "network error", err.response?.data?.message ?? err.message);
            setError(err.response?.data?.message || err.message || "Could not reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetKeyDown = (e) => {
        if (e.key === "Enter" && !loading) handleResetPassword(e);
    };

    const resetForgotFlow = (keepToast = false) => {
        setView("login");
        setPhone("");
        setOtp(EMPTY_OTP);
        setNewPw("");
        setConfirmPw("");
        setShowFpPw(false);
        setShowFpCf(false);
        setForgotErrors({});
        setOtpExpiryTime(0);
        if (!keepToast) {
            setError("");
        }
    };

    const step = view === "forgot-otp" ? 2 : view === "forgot-reset" ? 3 : 1;

    // ── Brand panel content — differs by view ──
    const brandContent = view.startsWith("forgot-") ? (
        <>
            <div className="relative z-10 w-14 h-14 rounded-full bg-brand-700/60 flex items-center justify-center mt-2">
                <KeyRound size={24} className="text-amber-300" />
            </div>
            <p className="relative z-10 font-body text-amber-300 text-sm text-center leading-relaxed max-w-[220px]">
                We'll verify it's really you, then let you set a brand-new password in just a few steps.
            </p>
            <StepDots step={step} />
        </>
    ) : (
        <p className="relative z-10 font-body text-amber-300 text-sm text-center leading-relaxed max-w-[200px]">
            Authentic dry fish & coastal pickles — straight from coastal fishermen.
        </p>
    );

    const bottomLink = view.startsWith("forgot-") ? (
        <p className="relative z-10 font-body text-amber-500 text-xs text-center mt-auto">
            Remembered your password?{" "}
            <button
                type="button"
                onClick={() => resetForgotFlow(false)}
                className="text-amber-300 font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
                Sign In
            </button>
        </p>
    ) : null;

    // ── Heading block — differs by view ──
    const titleNode = view === "forgot-otp" ? (
        <div className="flex items-center justify-center md:justify-start gap-3 mb-1 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-brand-700" />
            </div>
            <h2 className="font-display text-2xl font-bold text-brand-900">Verify OTP</h2>
        </div>
    ) : (
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-900 mb-1">
            {view === "login" && "Welcome back"}
            {view === "deactivated" && "Account Inactive"}
            {view === "forgot-phone" && "Forgot password?"}
            {view === "forgot-reset" && "Set new password"}
        </h2>
    );

    const subtitleNode =
        view === "deactivated" ? "We found your account" :
        view === "login" ? "Sign in to continue shopping" :
        view === "forgot-otp" ? (
            <>Enter the 6-digit code sent to{" "}
                <button
                    type="button"
                    onClick={goToOtpStep}
                    className="font-semibold text-brand-800 underline cursor-pointer hover:text-brand-900 bg-transparent border-none p-0 inline-block font-sans"
                >
                    +91 {phone}
                </button>
            </>
        ) :
        view === "forgot-reset" ? "Choose a new password for your account" : null;

    return (
        <AuthLayout
            mode="login"
            step={step}
            title={titleNode}
            subtitle={subtitleNode}
            brandContent={brandContent}
            bottomLink={bottomLink}
            toast={{ message: displayedError, type: displayedType, visible: toastVisible }}
            pageClassName="h-[calc(100dvh-4rem)] lg:min-h-screen px-3 py-1.5 lg:py-10 overflow-hidden lg:overflow-visible"
            cardClassName="login-card-fluid max-h-[96%] lg:max-h-none"
            formPanelClassName="login-form-fluid flex-1 min-h-0 overflow-y-auto lg:overflow-visible"
        >
            {/* ── View: Login ── */}
            {view === "login" && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="field-label">Phone Number or Email</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                {isPhoneLike(form.identifier) ? <Phone size={18} /> : <Mail size={18} />}
                            </span>
                            <input
                                type="text"
                                value={form.identifier}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    const isNumeric = /^[0-9+\s-]*$/.test(val);
                                    if (isNumeric) {
                                        const digits = val.replace(/\D/g, "");
                                        if (digits.length > 10) {
                                            val = digits.slice(0, 10);
                                        }
                                    }
                                    set("identifier", val);
                                }}
                                onKeyDown={handleLoginKeyDown}
                                placeholder="10-digit mobile number or you@example.com"
                                className="field-input pl-10"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="field-label mb-1">Password</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                <Lock size={18} />
                            </span>
                            <input
                                type={showPw ? "text" : "password"}
                                value={form.password}
                                onChange={(e) => set("password", e.target.value)}
                                onKeyDown={handleLoginKeyDown}
                                placeholder="Your password"
                                className="field-input pl-10 pr-10"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((s) => !s)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-0.5"
                                aria-label="Toggle password visibility"
                            >
                                {showPw ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-1.5">
                            <button
                                type="button"
                                onClick={() => { setForgotErrors({}); setView("forgot-phone"); }}
                                className="font-body text-xs text-brand-700 underline bg-transparent border-none cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-md btn-primary w-full mt-1">
                        {loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                        ) : (
                            <>Sign In <ArrowRight size={15} /></>
                        )}
                    </button>

                    <p className="font-body text-sm text-center text-amber-700">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-brand-800 underline">
                            Register
                        </Link>
                    </p>
                </form>
            )}

            {/* ── View: Account Deactivated ── */}
            {view === "deactivated" && (
                <div className="flex flex-col gap-5 text-center">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="font-body text-sm font-semibold text-amber-800 mb-1">Account Deactivated</p>
                        <p className="font-body text-xs text-amber-700 leading-relaxed">
                            Your account has been deactivated. Would you like to reactivate it and sign in?
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleReactivate}
                        disabled={loading}
                        className="btn-md btn-primary w-full"
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Reactivating…</> : "Yes, Reactivate My Account"}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setView("login"); setReactivateCreds(null); }}
                        className="font-body text-xs text-amber-500 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        ← Back to Login
                    </button>
                </div>
            )}

            {/* ── View: Forgot Phone ── */}
            {view === "forgot-phone" && (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                    <div>
                        <label className="field-label">Phone Number</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                <Phone size={18} />
                            </span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); clearForgotErrors(); }}
                                onKeyDown={handlePhoneKeyDown}
                                placeholder="10-digit mobile number"
                                inputMode="numeric"
                                maxLength={10}
                                autoComplete="tel"
                                className={fieldClass(!!forgotErrors.phone, "pl-10")}
                            />
                        </div>
                        {forgotErrors.phone && (
                            <p className="font-body text-xs text-red-500 mt-1">{forgotErrors.phone}</p>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="btn-md btn-primary w-full mt-1">
                        {loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending OTP…</>
                        ) : (
                            <>Send OTP <ArrowRight size={15} /></>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => resetForgotFlow(false)}
                        className="font-body text-xs text-amber-500 hover:text-brand-700 text-center transition-colors bg-transparent border-none cursor-pointer mt-2"
                    >
                        ← Back to Login
                    </button>
                </form>
            )}

            {/* ── View: Forgot OTP ── */}
            {view === "forgot-otp" && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                    <div>
                        <label className="field-label">Enter OTP</label>
                        <OtpBoxes
                            idPrefix="fp-otp"
                            otp={otp}
                            hasError={!!forgotErrors.otp}
                            onChange={handleOtpChange}
                            onKeyDown={handleOtpKeyDown}
                            onPaste={handleOtpPaste}
                            fluid
                        />
                        {forgotErrors.otp && (
                            <p className="font-body text-xs text-red-500 mt-2 text-center">{forgotErrors.otp}</p>
                        )}
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            className="font-body text-xs text-brand-700 font-semibold hover:underline disabled:opacity-50 bg-transparent border-none cursor-pointer"
                        >
                            Resend OTP
                        </button>
                    </div>

                    <button type="submit" disabled={loading} className="btn-md btn-primary w-full">
                        {loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                        ) : (
                            <>Verify OTP <ArrowRight size={15} /></>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={goToOtpStep}
                        className="font-body text-xs text-amber-500 hover:text-brand-700 text-center transition-colors bg-transparent border-none cursor-pointer"
                    >
                        ← Change phone number
                    </button>
                </form>
            )}

            {/* ── View: Forgot Reset ── */}
            {view === "forgot-reset" && (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                    <div>
                        <label className="field-label">New Password</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                <Lock size={18} />
                            </span>
                            <input
                                type={showFpPw ? "text" : "password"}
                                value={newPw}
                                onChange={(e) => { setNewPw(e.target.value); setForgotErrors((er) => ({ ...er, newPw: "" })); setError(""); }}
                                onKeyDown={handleResetKeyDown}
                                placeholder="Minimum 6 characters"
                                autoComplete="new-password"
                                className={fieldClass(!!forgotErrors.newPw, "pl-10 pr-10")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowFpPw((s) => !s)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-0.5"
                            >
                                {showFpPw ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        {forgotErrors.newPw && (
                            <p className="font-body text-xs text-red-500 mt-1">{forgotErrors.newPw}</p>
                        )}
                    </div>

                    <div>
                        <label className="field-label">Confirm New Password</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                <Lock size={18} />
                            </span>
                            <input
                                type={showFpCf ? "text" : "password"}
                                value={confirmPw}
                                onChange={(e) => { setConfirmPw(e.target.value); setForgotErrors((er) => ({ ...er, confirmPw: "" })); setError(""); }}
                                onKeyDown={handleResetKeyDown}
                                placeholder="Re-enter new password"
                                autoComplete="new-password"
                                className={fieldClass(!!forgotErrors.confirmPw, "pl-10 pr-10")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowFpCf((s) => !s)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-0.5"
                            >
                                {showFpCf ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        {forgotErrors.confirmPw && (
                            <p className="font-body text-xs text-red-500 mt-1">{forgotErrors.confirmPw}</p>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="btn-md btn-primary w-full mt-1">
                        {loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Updating password…</>
                        ) : (
                            <>Reset Password</>
                        )}
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}
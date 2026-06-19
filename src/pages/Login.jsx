import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Eye, EyeOff, Phone, Mail, Lock, ArrowRight, Loader2,
    AlertCircle, KeyRound, ShieldCheck
} from "lucide-react";
import { authApi } from "../ApiCall/Api";
import { useAuthStore } from "../components/store/AuthStore";
import { useToast } from "../components/useToast";

// ─── Logo URL — replace with real cloud URL when available ────────────
const LOGO_URL = null;

// ─── MOCK BYPASS — remove once the real backend is wired up ───────────
const MOCK_PHONE = "9999999999";
const MOCK_OTP = "123456";

const OTP_LENGTH = 6;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");

// a bare 10-digit number (optionally with spaces) is treated as a phone number,
// anything else is sent as email — single field, no separate phone/email tabs
const isPhoneLike = (value) => /^\d{10}$/.test(value.replace(/\s+/g, ""));
const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v.trim());

// shared input class helper — avoids repeating the error/normal ternary everywhere
const fieldClass = (hasError, extra = "") =>
    `${hasError ? "field-input-error" : "field-input"} ${extra}`.trim();

// ── Step indicators — 3 steps ──────
function StepDots({ step }) {
    return (
        <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
                <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-amber-300" : s < step ? "w-4 bg-amber-500" : "w-4 bg-brand-700"
                        }`}
                />
            ))}
            <span className="font-num text-amber-400 text-[11px] ml-1">Step {step}/3</span>
        </div>
    );
}

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
    const [view, setView] = useState("login"); // "login" | "forgot-phone" | "forgot-otp" | "forgot-reset"

    // ── Forgot Password Form State ──
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(EMPTY_OTP); // 6 individual OTP boxes
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showFpPw, setShowFpPw] = useState(false);
    const [showFpCf, setShowFpCf] = useState(false);
    const [forgotErrors, setForgotErrors] = useState({});
    const [otpExpiryTime, setOtpExpiryTime] = useState(0); // timestamp when OTP expires in background

    // ── OTP Expiration background check (3 minutes) ──
    useEffect(() => {
        if (view !== "forgot-otp" || otpExpiryTime === 0) return;

        const checkExpiry = setInterval(() => {
            if (Date.now() >= otpExpiryTime) {
                clearInterval(checkExpiry);
                setError("OTP expired. Please try again.");
                goToOtpStep(); // Send them back to phone number entry step
            }
        }, 1000);

        return () => clearInterval(checkExpiry);
    }, [view, otpExpiryTime]);

    const set = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setError("");
    };

    // ── Shared helper: clear both the forgot-password field errors and the toast ──
    const clearForgotErrors = () => {
        setForgotErrors({});
        setError("");
    };

    // ── Login Handler ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.identifier.trim()) { setError("Please enter your phone number or email"); return; }
        if (!form.password.trim()) { setError("Please enter your password"); return; }

        const trimmedId = form.identifier.trim().replace(/\s+/g, "");

        // ── MOCK BYPASS — admin / customer test accounts ───────────────
        const mockAccounts = [
            { id: "9876543210", pw: "1234", role: "admin", name: "Mock Admin", userId: "mock-admin-id", token: "mock-admin-token", to: "/admin" },
            { id: "1234567890", pw: "1234", role: "customer", name: "Mock Customer", userId: "mock-customer-id", token: "mock-customer-token", to: redirectTo },
        ];
        const matched = mockAccounts.find((a) => trimmedId === a.id && form.password === a.pw);
        if (matched) {
            login({ id: matched.userId, phone: matched.id, role: matched.role, name: matched.name }, matched.token);
            navigate(matched.to, { replace: true });
            return;
        }
        // Standard mock login — any password works for the standard mock phone
        if (trimmedId === MOCK_PHONE) {
            login({ id: "mock-user-id", phone: MOCK_PHONE, role: "customer", name: "Mock User" }, "mock-user-token");
            navigate(redirectTo, { replace: true });
            return;
        }

        setLoading(true);
        try {
            // ── REAL API CALL — uncomment once the backend is live ──────
            // const payload = isPhoneLike(form.identifier)
            //     ? { phone: form.identifier.replace(/\s+/g, ""), password: form.password }
            //     : { email: form.identifier.trim(), password: form.password };
            // const res = await authApi.login(payload);
            // login(res.user, res.token);
            // navigate(res.user?.role === "admin" ? "/admin" : redirectTo, { replace: true });

            throw new Error("Invalid credentials. Please try again.");
        } catch (err) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Enter-key submit for the main login form ──
    const handleLoginKeyDown = (e) => {
        if (e.key === "Enter" && !loading) handleSubmit(e);
    };

    // ── Forgot Password Handlers ──
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!isValidPhone(phone)) { setForgotErrors({ phone: "Enter a valid 10-digit mobile number" }); return; }
        setForgotErrors({});

        setLoading(true);
        try {
            // ── REAL API CALL — uncomment once the backend is live ──────
            // await authApi.sendOtp({ phone, purpose: "reset-password" });

            // ── MOCK BYPASS ──────────────────────────────────────────────
            if (phone.trim() !== MOCK_PHONE) {
                throw new Error(`Use the test number ${MOCK_PHONE} for now — OTP sending isn't live yet.`);
            }

            setView("forgot-otp");
            setOtpExpiryTime(Date.now() + 180 * 1000); // 3 minutes background expiry
        } catch (err) {
            setError(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Enter-key submit for the phone-entry step ──
    const handlePhoneKeyDown = (e) => {
        if (e.key === "Enter" && !loading) handleSendOtp(e);
    };

    // ── Resend OTP — also clears the boxes and restarts ──
    const handleResend = async () => {
        setOtp(EMPTY_OTP);
        setLoading(true);
        try {
            // ── REAL API CALL ────────────────────────────────────────────
            // await authApi.sendOtp({ phone, purpose: "reset-password" });
            setOtpExpiryTime(Date.now() + 180 * 1000); // restart 3 minutes timer
        } catch (err) {
            setError(err.message || "Could not resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otp.some((d) => d === "")) { setForgotErrors({ otp: "Enter the 6-digit OTP" }); return; }

        // ── MOCK BYPASS ──────────────────────────────────────────────────
        if (otpValue !== MOCK_OTP) {
            setError(`Use the test OTP ${MOCK_OTP} for now — OTP verification isn't live yet.`);
            return;
        }

        setView("forgot-reset");
    };

    // ── Individual OTP box change handler — auto-advances focus ──
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

    // ── Backspace moves focus back; Enter submits ──
    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`fp-otp-${index - 1}`)?.focus();
        }
        if (e.key === "Enter" && !loading) {
            handleVerifyOtp(e);
        }
    };

    // ── Paste a full 6-digit code into the OTP boxes at once ──
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
            // ── REAL API CALL — uncomment once the backend is live ──────
            // await authApi.resetPassword({
            //     phone: phone.trim(),
            //     otp: otp.join(""),
            //     newPassword: newPw,
            // });

            setSuccess("Password reset successful.");
            resetForgotFlow(true); // reset and go back to login form, keeping the success toast
        } catch (err) {
            setError(err.message || "Could not reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Enter-key submit for the reset-password step ──
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

    const goToOtpStep = () => { setView("forgot-phone"); setOtp(EMPTY_OTP); clearForgotErrors(); };

    // Calculate current step for Forgot Password
    const step = view === "forgot-otp" ? 2 : view === "forgot-reset" ? 3 : 1;

    return (
        <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-10 md:flex-row md:justify-center md:items-center md:py-10 bg-sandal-50 relative">

            {/* ── Toast (Red for Error, Green for Success) ── */}
            <div
                className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible
                    ? "translate-x-0 opacity-100"
                    : "translate-x-[120%] opacity-0 pointer-events-none"
                    }`}
            >
                {displayedError && (
                    <div className={`flex items-start gap-2.5 bg-white border shadow-lg font-body text-sm rounded-xl px-4 py-3.5 ${displayedType === "success"
                        ? "border-green-200 shadow-green-900/5 text-green-700"
                        : "border-red-200 shadow-red-900/5 text-red-700"
                        }`}>
                        {displayedType === "success" ? (
                            <ShieldCheck size={17} className="shrink-0 mt-0.5 text-green-500" />
                        ) : (
                            <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
                        )}
                        <p className="leading-snug">{displayedError}</p>
                    </div>
                )}
            </div>

            {/* ambient background wash — mobile only */}
            <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-brand-800/[0.06] blur-2xl" />
                <div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full bg-sandal-400/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md md:max-w-4xl bg-white rounded-3xl md:rounded-2xl border border-sandal-100 overflow-hidden flex flex-col md:flex-row shadow-xl shadow-brand-900/5">

                {/* LEFT — Brand panel (desktop only) */}
                <div className="hidden md:flex relative md:w-5/12 bg-brand-900 flex-col items-center justify-center px-8 py-12 gap-6 overflow-hidden">
                    <div className="absolute -top-16 -left-16 w-56 h-56 bg-brand-800 rounded-full opacity-40" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-800 rounded-full opacity-30" />

                    {/* Desktop brand panel logo */}
                    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                        {LOGO_URL ? (
                            <img src={LOGO_URL} alt="NammaOor Logo" className="w-20 h-20 object-contain" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center text-4xl shadow-lg ring-4 ring-white/10">
                                🐟
                            </div>
                        )}
                        <div>
                            <h1 className="font-display text-white text-2xl font-bold leading-tight">
                                நம்ம ஊர்
                            </h1>
                            <p className="font-display text-amber-300 text-lg font-semibold leading-tight">
                                கருவாட்டு கடை
                            </p>
                            <p className="font-body text-amber-400 text-xs mt-1 tracking-wider uppercase">
                                Namma Oor Karuvattu Kadai
                            </p>
                        </div>
                    </div>

                    {view.startsWith("forgot-") ? (
                        <>
                            <div className="relative z-10 w-14 h-14 rounded-full bg-brand-700/60 flex items-center justify-center mt-2">
                                <KeyRound size={24} className="text-amber-300" />
                            </div>

                            <p className="relative z-10 font-body text-amber-300 text-sm text-center leading-relaxed max-w-[220px]">
                                We'll verify it's really you, then let you set a brand-new password in just a few steps.
                            </p>

                            <StepDots step={step} />

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
                        </>
                    ) : (
                        <>
                            {/* tagline */}
                            <p className="relative z-10 font-body text-amber-300 text-sm text-center leading-relaxed max-w-[200px]">
                                Authentic dry fish & coastal pickles — straight from Rameswaram fishermen.
                            </p>
                        </>
                    )}
                </div>

                {/* RIGHT — form panel */}
                <div className="w-full md:w-7/12 flex flex-col justify-center px-6 py-8 md:px-12 md:py-12 bg-white">

                    {/* Mobile brand badge + wordmark — visible only on mobile */}
                    <div className="flex flex-col items-center mb-7 md:hidden">
                        <div className="relative mb-3">
                            <div className="absolute inset-0 rounded-full bg-brand-900/15 blur-md scale-110" />
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-brand-800 to-brand-900 flex items-center justify-center text-3xl shadow-lg ring-4 ring-white">
                                🐟
                            </div>
                        </div>

                        <h1 className="font-display text-gray-900 text-xl font-bold leading-tight tracking-tight text-center">
                            நம்ம ஊர் கருவாட்டு கடை
                        </h1>
                        <p className="font-body text-sandal-600 text-[11px] font-semibold tracking-[0.15em] uppercase mt-1">
                            Namma Oor Karuvattu Kadai
                        </p>
                    </div>

                    {/* Heading and subtext */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6 w-full">
                        {view === "forgot-otp" ? (
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-1 w-full">
                                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={20} className="text-brand-700" />
                                </div>
                                <h2 className="font-display text-2xl font-bold text-brand-900">Verify OTP</h2>
                            </div>
                        ) : (
                            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-900 mb-1">
                                {view === "login" && "Welcome back"}
                                {view === "forgot-phone" && "Forgot password?"}
                                {view === "forgot-reset" && "Set new password"}
                            </h2>
                        )}
                        <p className="font-body text-sm text-amber-600 mt-1 text-center md:text-left">
                            {view === "login" && "Sign in to continue shopping"}
                            {view === "forgot-otp" && (
                                <>Enter the 6-digit code sent to{" "}
                                    <button
                                        type="button"
                                        onClick={goToOtpStep}
                                        className="font-semibold text-brand-800 underline cursor-pointer hover:text-brand-900 bg-transparent border-none p-0 inline-block font-sans"
                                    >
                                        +91 {phone}
                                    </button>
                                </>
                            )}
                            {view === "forgot-reset" && "Choose a new password for your account"}
                        </p>
                    </div>

                    {/* ── View: Login ── */}
                    {view === "login" && (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* identifier — phone or email */}
                            <div>
                                <label className="field-label">
                                    Phone Number or Email
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                        {isPhoneLike(form.identifier) ? <Phone size={18} /> : <Mail size={18} />}
                                    </span>
                                    <input
                                        type="text"
                                        value={form.identifier}
                                        onChange={(e) => set("identifier", e.target.value)}
                                        onKeyDown={handleLoginKeyDown}
                                        placeholder="10-digit mobile number or you@example.com"
                                        className="field-input pl-10"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* password */}
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
                                        aria-label="Toggle password visibility">
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

                            {/* submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-md btn-primary w-full mt-1">
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                                ) : (
                                    <>Sign In <ArrowRight size={15} /></>
                                )}
                            </button>

                            {/* register link */}
                            <p className="font-body text-sm text-center text-amber-700">
                                Don't have an account?{" "}
                                <Link to="/register" className="font-semibold text-brand-800 underline">
                                    Register
                                </Link>
                            </p>
                        </form>
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

                                {/* Individual OTP boxes — auto-advance, backspace-back, paste-fill */}
                                <div className="flex justify-center gap-2.5 mt-1">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`fp-otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            onPaste={i === 0 ? handleOtpPaste : undefined}
                                            autoFocus={i === 0}
                                            className={`w-11 h-12 text-center font-num text-lg font-semibold rounded-xl border transition-colors ${forgotErrors.otp
                                                ? "border-red-300 bg-red-50 text-red-700"
                                                : "border-sandal-200 bg-sandal-50 text-brand-900 focus:border-brand-700 focus:bg-brand-50"
                                                } focus:outline-none`}
                                        />
                                    ))}
                                </div>

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
                                        {showFpCf ? <Eye size={18} /> : <EyeOff size={18} />}                                    </button>
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
                </div>
            </div>

            {/* mobile footer note */}
            <p className="md:hidden relative z-10 font-body text-[11px] text-amber-500/80 text-center mt-6 px-8 leading-relaxed">
                🐟 Sourced directly from Rameswaram fishermen · Naturally sun-dried
            </p>
        </div>
    );
}
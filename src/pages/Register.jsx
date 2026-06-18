import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User, Phone, Mail, Lock, Eye, EyeOff,
    ArrowRight, Loader2, CheckCircle2, ShieldCheck, AlertCircle,
} from "lucide-react";
import { authApi } from "../ApiCall/Api.jsx";
import { useAuthStore } from "../components/store/AuthStore";
import { useToast } from "../hooks/useToast";

// ─── Logo URL — replace with real cloud URL when available ────────────
const LOGO_URL = null;

// ─── MOCK BYPASS — remove once the real backend is wired up ───────────
const MOCK_PHONE = "9999999999";
const MOCK_OTP = "123456";

const OTP_LENGTH = 6;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");

// ── tiny helpers ───────────────────────────────────────────────────────
const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ── Step indicators — now 3 steps ────────────────────────────────────
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

// ── per-step heading/subtext, shown above the form on both layouts ────
const STEP_COPY = {
    1: { title: "Create account", subtitle: "Join us — it only takes a minute" },
    2: { title: "Verify OTP", subtitle: "Enter the 6-digit code we sent you" },
    3: { title: "Set your password", subtitle: "Choose a password to finish creating your account" },
};

// shared input class helper — avoids repeating the error/normal ternary everywhere
const fieldClass = (hasError, extra = "") =>
    `${hasError ? "field-input-error" : "field-input"} ${extra}`.trim();

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    // view state instead of numeric steps: "register" | "otp" | "password"
    const [view, setView] = useState("register");
    const step = view === "otp" ? 2 : view === "password" ? 3 : 1;

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirm: "",
    });

    const [otp, setOtp] = useState(EMPTY_OTP); // 6 individual OTP boxes
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [otpExpiryTime, setOtpExpiryTime] = useState(0); // timestamp when OTP expires in background

    // ── toast (uses custom useToast hook) ──────────────────────────────
    const {
        error: apiErr,
        setError: setApiErr,
        displayedError: displayedApiErr,
        toastVisible
    } = useToast();

    // ── OTP Expiration background check (3 minutes) ──
    useEffect(() => {
        if (view !== "otp" || otpExpiryTime === 0) return;

        const checkExpiry = setInterval(() => {
            if (Date.now() >= otpExpiryTime) {
                clearInterval(checkExpiry);
                setApiErr("OTP expired. Please try again.");
                setView("register");
                setOtp(EMPTY_OTP);
            }
        }, 1000);

        return () => clearInterval(checkExpiry);
    }, [view, otpExpiryTime]);

    useEffect(() => {
        // Prevent body/root viewport scrolling on mobile for the register page
        const handleResize = () => {
            if (window.innerWidth < 768) {
                document.body.style.overflow = "hidden";
                document.body.style.height = "100vh";
            } else {
                document.body.style.overflow = "";
                document.body.style.height = "";
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            document.body.style.overflow = "";
            document.body.style.height = "";
        };
    }, []);

    const set = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: "" }));
        setApiErr("");
    };

    // ── Step 1 validation — name + phone only ───────────────────────────
    const validateStep1 = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!isValidPhone(form.phone)) e.phone = "Enter a valid 10-digit mobile number";
        if (form.email && !isValidEmail(form.email)) e.email = "Enter a valid email address";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Step 3 validation — password + confirm ───────────────────────────
    const validateStep3 = () => {
        const e = {};
        if (form.password.length < 6) e.password = "Minimum 6 characters";
        if (form.password !== form.confirm) e.confirm = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Step 1 → 2 : send OTP ────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!validateStep1()) return;

        setLoading(true);
        try {
            // ── REAL API CALL — uncomment once the backend is live ──────
            // await authApi.sendOtp({ phone: form.phone });

            // ── MOCK BYPASS ──────────────────────────────────────────────
            if (form.phone.trim() !== MOCK_PHONE) {
                throw new Error(`Use the test number ${MOCK_PHONE} for now — OTP sending isn't live yet.`);
            }

            setView("otp");
            setOtpExpiryTime(Date.now() + 180 * 1000); // 3 minutes background expiry
        } catch (err) {
            setApiErr(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP — also clears the boxes and restarts timer ──
    const handleResend = async () => {
        setOtp(EMPTY_OTP);
        setLoading(true);
        try {
            // ── REAL API CALL ────────────────────────────────────────────
            // await authApi.sendOtp({ phone: form.phone });
            setOtpExpiryTime(Date.now() + 180 * 1000); // restart 3 minutes timer
        } catch (err) {
            setApiErr(err.message || "Could not resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2 → 3 : verify OTP only (registration itself happens at step 3) ──
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otp.some((d) => d === "")) { setErrors({ otp: "Enter the 6-digit OTP" }); return; }

        // ── MOCK BYPASS ──────────────────────────────────────────────────
        if (otpValue !== MOCK_OTP) {
            setApiErr(`Use the test OTP ${MOCK_OTP} for now — OTP verification isn't live yet.`);
            return;
        }

        setView("password");
    };

    // ── Individual OTP box change handler — auto-advances focus ──
    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        setOtp((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
        setErrors({});
        setApiErr("");
        if (value && index < OTP_LENGTH - 1) {
            document.getElementById(`reg-otp-${index + 1}`)?.focus();
        }
    };

    // ── Backspace moves focus back; Enter submits ──
    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`reg-otp-${index - 1}`)?.focus();
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
        setErrors({});
        setApiErr("");
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        document.getElementById(`reg-otp-${focusIndex}`)?.focus();
    };

    // ── Step 3 : set password + actually register ─────────────────────────
    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;

        setLoading(true);
        try {
            // ── REAL API CALL — uncomment once the backend is live ──────
            // const res = await authApi.register({
            //     fullName: form.fullName.trim(),
            //     phone: form.phone.trim(),
            //     email: form.email.trim() || undefined,
            //     password: form.password,
            //     otp: otp.join(""),
            // });
            // login(res.user, res.token);
            // navigate("/", { replace: true });

            // ── MOCK BYPASS ──────────────────────────────────────────────
            login(
                { id: "mock-user-id", phone: form.phone.trim(), role: "customer", name: form.fullName.trim() || "Mock User" },
                "mock-user-token"
            );
            navigate("/", { replace: true });
        } catch (err) {
            setApiErr(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copy = STEP_COPY[step];

    return (
        // Mobile fits exactly within the viewport (100vh minus the 4rem/64px navbar height)
        // with scrolling allowed inside the container if elements overflow (e.g. keyboard is active).
        // Desktop retains standard full-screen vertically centered layout.
        <div className="h-[calc(100vh-4rem)] md:min-h-screen w-full flex flex-col items-center justify-center px-4 py-4 md:py-10 bg-sandal-50 relative overflow-y-auto md:overflow-visible">

            {/* ── Error toast ── */}
            <div
                className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible
                    ? "translate-x-0 opacity-100"
                    : "translate-x-[120%] opacity-0 pointer-events-none"
                    }`}
            >
                {displayedApiErr && (
                    <div className="flex items-start gap-2.5 bg-white border border-red-200 shadow-lg shadow-red-900/5 text-red-700 font-body text-sm rounded-xl px-4 py-3.5">
                        <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
                        <p className="leading-snug">{displayedApiErr}</p>
                    </div>
                )}
            </div>

            {/* ambient background wash — mobile only */}
            <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-brand-800/[0.06] blur-2xl" />
                <div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full bg-sandal-400/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md md:max-w-4xl bg-white rounded-3xl md:rounded-2xl border border-sandal-100 overflow-hidden flex flex-col md:flex-row shadow-xl shadow-brand-900/5">

                {/* ══ LEFT — brand panel (desktop only, static across all steps) ══ */}
                <div className="hidden md:flex relative md:w-5/12 bg-brand-900 flex-col items-center justify-center px-8 py-12 gap-6 overflow-hidden">

                    <div className="absolute -top-16 -left-16 w-56 h-56 bg-brand-800 rounded-full opacity-40" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-800 rounded-full opacity-30" />

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

                    {/* perks list */}
                    <ul className="relative z-10 space-y-2.5 mt-2">
                        {[
                            "Direct from Rameswaram fishermen",
                            "100% natural, no preservatives",
                            "Hygienic airtight packaging",
                            "Free shipping on orders ₹499+",
                        ].map((perk) => (
                            <li key={perk} className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                <span className="font-body text-amber-300 text-xs leading-snug">{perk}</span>
                            </li>
                        ))}
                    </ul>

                    <StepDots step={step} />

                    <p className="relative z-10 font-body text-amber-500 text-xs text-center mt-auto">
                        Already have an account?{" "}
                        <Link to="/login" className="text-amber-300 font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* ══ RIGHT — form panel (only this content swaps per step) ══ */}
                <div className="w-full md:w-7/12 flex flex-col justify-center px-6 py-8 md:px-12 md:py-12 bg-white">

                    {/* Mobile brand badge + wordmark — static across all steps */}
                    <div className="flex flex-col items-center mb-5 md:hidden">
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

                        <div className="mt-4">
                            <StepDots step={step} />
                        </div>
                    </div>

                    {/* per-step heading — text changes, position/spacing static */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6">
                        {step === 2 ? (
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-1 w-full">
                                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={20} className="text-brand-700" />
                                </div>
                                <h2 className="font-display text-2xl font-bold text-brand-900">{copy.title}</h2>
                            </div>
                        ) : (
                            <h2 className="font-display text-2xl font-bold text-brand-900 mb-1">{copy.title}</h2>
                        )}
                        <p className="font-body text-sm text-amber-600 mt-1">
                            {step === 2 ? (
                                <>Enter the 6-digit code sent to{" "}
                                    <span className="font-semibold text-brand-800">+91 {form.phone}</span>
                                </>
                            ) : copy.subtitle}
                        </p>
                    </div>

                    {/* ── STEP 1 — Name + Phone ─────────────────────────────── */}
                    {view === "register" && (
                        <>
                            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                                <div>
                                    <label className="field-label">Full Name</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                            <User size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            value={form.fullName}
                                            onChange={(e) => set("fullName", e.target.value)}
                                            placeholder="Your full name"
                                            autoComplete="name"
                                            className={fieldClass(!!errors.fullName, "pl-10")}
                                        />
                                    </div>
                                    {errors.fullName && (
                                        <p className="font-body text-xs text-red-500 mt-1">{errors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="field-label">Phone Number</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                            <Phone size={18} />
                                        </span>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                                            placeholder="10-digit mobile number"
                                            autoComplete="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            className={fieldClass(!!errors.phone, "pl-10")}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="font-body text-xs text-red-500 mt-1">{errors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="field-label">Email Address (optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                            <Mail size={18} />
                                        </span>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => set("email", e.target.value)}
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            className={fieldClass(!!errors.email, "pl-10")}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="font-body text-xs text-red-500 mt-1">{errors.email}</p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading} className="btn-md btn-primary w-full mt-1">
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Sending OTP…</>
                                    ) : (
                                        <>Continue <ArrowRight size={15} /></>
                                    )}
                                </button>
                            </form>

                            <p className="md:hidden font-body text-sm text-center text-amber-700 mt-6">
                                Already have an account?{" "}
                                <Link to="/login" className="font-semibold text-brand-800 underline">
                                    Sign In
                                </Link>
                            </p>
                        </>
                    )}

                    {/* ── STEP 2 — OTP only ─────────────────────────────────── */}
                    {view === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                            <div>
                                <label className="field-label">Enter OTP</label>

                                {/* Individual OTP boxes — auto-advance, backspace-back, paste-fill */}
                                <div className="flex justify-center gap-2.5 mt-1">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`reg-otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            onPaste={i === 0 ? handleOtpPaste : undefined}
                                            autoFocus={i === 0}
                                            className={`w-11 h-12 text-center font-num text-lg font-semibold rounded-xl border transition-colors ${errors.otp
                                                ? "border-red-300 bg-red-50 text-red-700"
                                                : "border-sandal-200 bg-sandal-50 text-brand-900 focus:border-brand-700 focus:bg-brand-50"
                                                } focus:outline-none`}
                                        />
                                    ))}
                                </div>

                                {errors.otp && (
                                    <p className="font-body text-xs text-red-500 mt-2 text-center">{errors.otp}</p>
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
                                onClick={() => { setView("register"); setOtp(EMPTY_OTP); setApiErr(""); setErrors({}); setOtpExpiryTime(0); }}
                                className="font-body text-xs text-amber-500 hover:text-brand-700 text-center transition-colors bg-transparent border-none cursor-pointer"
                            >
                                ← Change phone number
                            </button>
                        </form>
                    )}

                    {/* ── STEP 3 — Password + Confirm ───────────────────────── */}
                    {view === "password" && (
                        <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
                            <div>
                                <label className="field-label">Password</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type={showPw ? "text" : "password"}
                                        value={form.password}
                                        onChange={(e) => set("password", e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        autoComplete="new-password"
                                        className={fieldClass(!!errors.password, "pl-10 pr-10")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((s) => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-0.5"
                                    >
                                        {showPw ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="font-body text-xs text-red-500 mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="field-label">Confirm Password</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type={showCf ? "text" : "password"}
                                        value={form.confirm}
                                        onChange={(e) => set("confirm", e.target.value)}
                                        placeholder="Re-enter password"
                                        autoComplete="new-password"
                                        className={fieldClass(!!errors.confirm, "pl-10 pr-10")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCf((s) => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-0.5"
                                    >
                                        {showCf ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                                {errors.confirm && (
                                    <p className="font-body text-xs text-red-500 mt-1">{errors.confirm}</p>
                                )}
                            </div>

                            <button type="submit" disabled={loading} className="btn-md btn-primary w-full mt-1">
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                                ) : (
                                    <>Create Account <ArrowRight size={15} /></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setView("otp"); setApiErr(""); setErrors({}); }}
                                className="font-body text-xs text-amber-500 hover:text-brand-700 text-center transition-colors bg-transparent border-none cursor-pointer"
                            >
                                ← Back to OTP
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
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User, Phone, Mail, Lock, Eye, EyeOff,
    ArrowRight, Loader2, CheckCircle2, Pencil, CheckCircle,
} from "lucide-react";
import API from "../ApiCall/Api.jsx";
import { useToast } from "../components/useToast";
import AuthLayout, { StepDots, OtpBoxes, fieldClass } from "../components/layout/AuthLayout";
import { usePublicSettings } from "../hookqueries/useSettings";

const OTP_LENGTH = 6;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");

const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ── per-step heading/subtext, shown above the form on both layouts ────
const STEP_COPY = {
    1: { title: "Register New Account", subtitle: "" },
    2: { title: "Verify OTP", subtitle: "Enter the 6-digit code we sent you" },
    3: { title: "Set your password", subtitle: "Choose a password to finish creating your account" },
};

/**
 * ── Mobile-only fluid sizing ──────────────────────────────────────────
 * Tailwind's `w-10`, `text-base`, etc. are static — they only change value
 * AT the md breakpoint (768px), so a 340px phone and a 420px phone render
 * identically below that point. That's why the 6-box OTP row (6 boxes + 5
 * gaps, the widest fixed-content row on the page) could overflow a narrow
 * phone's card even though it fit on a wider one.
 *
 * clamp(min, vw-based-preferred, max) scales continuously with the actual
 * viewport width instead of jumping once, so things keep shrinking all the
 * way down to small phones and never need to overflow.
 *
 * This block is wrapped in `@media (max-width: 767.98px)` — one pixel below
 * Tailwind's `md:` cutoff — so none of it can ever apply at md+ widths.
 * Desktop keeps its exact original fixed Tailwind sizing, untouched.
 */


export default function Register() {
    const navigate = useNavigate();
    const { data: settings = {}, isLoading: settingsLoading } = usePublicSettings();

    // view state drives the step: "register" | "otp" | "password"
    const [view, setView] = useState("register");
    const step = view === "otp" ? 2 : view === "password" ? 3 : 1;

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirm: "",
    });

    const [otp, setOtp] = useState(EMPTY_OTP);
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [otpExpiryTime, setOtpExpiryTime] = useState(0);

    const {
        setError: setApiErr,
        displayedError: displayedApiErr,
        toastVisible,
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
    }, [view, otpExpiryTime, setApiErr]);

    const set = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: "" }));
        setApiErr("");
    };

    const validateStep1 = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!isValidPhone(form.phone)) e.phone = "Enter a valid 10-digit mobile number";
        if (form.email && !isValidEmail(form.email)) e.email = "Enter a valid email address";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep3 = () => {
        const e = {};
        if (form.password.length < 6) e.password = "Minimum 6 characters";
        if (form.password !== form.confirm) e.confirm = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const passwordsMatch =
        form.password.length >= 6 &&
        form.confirm.length > 0 &&
        form.password === form.confirm;

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!validateStep1()) return;
        setLoading(true);
        try {
            await API.post("/auth/check-phone", { phone: form.phone });

            if (import.meta.env.DEV) {
                setView("password");
                return;
            }

            await API.post("/auth/register-otp", { phone: form.phone });
            setView("otp");
            setOtpExpiryTime(Date.now() + 180 * 1000);
        } catch (err) {
            setApiErr(err.response?.data?.message || err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setOtp(EMPTY_OTP);
        setLoading(true);
        try {
            await API.post("/auth/register-otp", { phone: form.phone });
            setOtpExpiryTime(Date.now() + 180 * 1000);
        } catch (err) {
            setApiErr(err.response?.data?.message || err.message || "Could not resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otp.some((d) => d === "")) { setErrors({ otp: "Enter the 6-digit OTP" }); return; }
        setView("password");
    };

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

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`reg-otp-${index - 1}`)?.focus();
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
        setErrors({});
        setApiErr("");
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        document.getElementById(`reg-otp-${focusIndex}`)?.focus();
    };

    const handleChangePhone = () => {
        setView("register");
        setOtp(EMPTY_OTP);
        setApiErr("");
        setErrors({});
        setOtpExpiryTime(0);
    };
    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;

        setLoading(true);
        try {
            await API.post("/auth/register", {
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                identifier: form.phone.trim(),
                email: form.email.trim() || undefined,
                password: form.password,
                otp: otp.join(""),
            });
            navigate("/login", {
                replace: true,
                state: { registeredPhone: form.phone.trim() },
            });
        } catch (err) {
            setApiErr(err.response?.data?.message || err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copy = STEP_COPY[step];

    // ── Brand panel content — perks list (step 1+) is static across all steps ──
    const brandContent = (
        <>
            <ul className="relative z-10 space-y-2.5 mt-2">
                {[
                    "Direct from coastal fishermen",
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
        </>
    );

    const bottomLink = (
        <p className="relative z-10 font-body text-amber-500 text-xs text-center mt-auto">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-300 font-semibold hover:underline">
                Sign In
            </Link>
        </p>
    );

    // ── Heading block — per-step copy, with mobile-only fluid classes ──
    const titleNode = (
        <h2 className="reg-title-fluid font-display md:text-2xl font-bold text-brand-900 mb-1 whitespace-nowrap">
            {copy.title}
        </h2>
    );

    const subtitleNode = (step === 2 || copy.subtitle) ? (
        <span className="reg-subtitle-fluid font-body md:text-sm">
            {step === 2 ? (
                <>Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-brand-800">+91 {form.phone}</span>
                    <button
                        type="button"
                        onClick={handleChangePhone}
                        aria-label="Edit phone number"
                        className="inline-flex items-center justify-center ml-1.5 text-amber-500 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer align-middle p-0.5"
                    >
                        <Pencil size={13} />
                    </button>
                </>
            ) : copy.subtitle}
        </span>
    ) : null;

    // Registration disabled by admin — show message instead of the form.
    if (!settingsLoading && settings.registrationsEnabled === false) {
        return (
            <AuthLayout
                mode="register"
                step={1}
                title={<h2 className="font-display text-2xl font-bold text-brand-900 mb-1">Sign-ups paused</h2>}
                subtitle={null}
                brandContent={<StepDots step={1} />}
                bottomLink={
                    <p className="relative z-10 font-body text-amber-500 text-xs text-center mt-auto">
                        Already have an account?{" "}
                        <Link to="/login" className="text-amber-300 font-semibold hover:underline">Sign In</Link>
                    </p>
                }
                pageClassName="h-[calc(100dvh-4rem)] lg:min-h-screen px-3 py-1.5 lg:py-10"
            >
                <div className="flex flex-col items-center justify-center gap-5 py-6 text-center">
                    <p className="font-body text-sm text-amber-700 max-w-xs">
                        New sign-ups are temporarily paused. Please check back later or contact us for assistance.
                    </p>
                    <Link to="/login" className="btn-md btn-primary">
                        Sign In Instead <ArrowRight size={15} />
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            mode="register"
            step={step}
            title={titleNode}
            subtitle={subtitleNode}
            brandContent={brandContent}
            bottomLink={bottomLink}
            toast={{ message: displayedApiErr, type: "error", visible: toastVisible }}
            pageClassName="h-[calc(100dvh-4rem)] lg:min-h-screen px-3 py-1.5 lg:py-10 overflow-hidden lg:overflow-visible"
            cardClassName="reg-card-fluid max-h-[96%] lg:max-h-none"
            formPanelClassName="reg-form-fluid flex-1 min-h-0 overflow-y-auto lg:overflow-visible"
        >
            {/* ── STEP 1 — Name + Phone + Email only ────────────────── */}
            {view === "register" && (
                <>
                    <form onSubmit={handleSendOtp} className="reg-step1-gap-fluid flex flex-col md:gap-4">
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
                                    className={fieldClass(!!errors.fullName, "pl-10 w-full")}
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
                                    className={fieldClass(!!errors.phone, "pl-10 w-full")}
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
                                    className={fieldClass(!!errors.email, "pl-10 w-full")}
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

                    <p className="lg:hidden font-body text-xs text-center text-amber-700 mt-3">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-brand-800 underline">
                            Sign In
                        </Link>
                    </p>
                </>
            )}

            {/* ── STEP 2 — OTP only ─────────────────────────────────── */}
            {view === "otp" && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5 md:gap-5">
                    <div>
                        <label className="field-label">Enter OTP</label>
                        <OtpBoxes
                            idPrefix="reg-otp"
                            otp={otp}
                            hasError={!!errors.otp}
                            onChange={handleOtpChange}
                            onKeyDown={handleOtpKeyDown}
                            onPaste={handleOtpPaste}
                            fluid
                        />
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
                        onClick={handleChangePhone}
                        className="font-body text-xs text-amber-500 hover:text-brand-700 text-center transition-colors bg-transparent border-none cursor-pointer"
                    >
                        ← Change phone number
                    </button>
                </form>
            )}

            {/* ── STEP 3 — Password + Confirm ───────────────────────── */}
            {view === "password" && (
                <form onSubmit={handleSetPassword} className="flex flex-col gap-3 md:gap-4">
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
                                className={fieldClass(
                                    !!errors.password,
                                    `pl-10 pr-10 w-full ${passwordsMatch && !errors.password
                                        ? "!border-green-400 focus:!border-green-500 !bg-green-50/40"
                                        : ""
                                    }`
                                )}
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
                                className={fieldClass(
                                    !!errors.confirm,
                                    `pl-10 pr-10 w-full ${passwordsMatch && !errors.confirm
                                        ? "!border-green-400 focus:!border-green-500 !bg-green-50/40"
                                        : ""
                                    }`
                                )}
                            />
                            {passwordsMatch && !errors.confirm ? (
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 flex items-center justify-center p-0.5">
                                    <CheckCircle size={18} />
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCf((s) => !s)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-0.5"
                                >
                                    {showCf ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            )}
                        </div>
                        {errors.confirm && (
                            <p className="font-body text-xs text-red-500 mt-1">{errors.confirm}</p>
                        )}
                        {passwordsMatch && !errors.confirm && (
                            <p className="font-body text-xs text-green-600 mt-1">Passwords match</p>
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
        </AuthLayout>
    );
}
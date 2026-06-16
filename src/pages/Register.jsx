import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User, Phone, Mail, Lock, Eye, EyeOff,
    ArrowRight, Loader2, CheckCircle2, ShieldCheck,
} from "lucide-react";
import { authApi } from "../ApiCall/Api.jsx";
import { useAuthStore } from "../components/store/AuthStore";

// ─── Logo URL — replace with real cloud URL when available ────────────
// const LOGO_URL = "https://your-cloud-url.com/nammаoor-logo.png";
const LOGO_URL = null;

// ── tiny helper ────────────────────────────────────────────────────────
const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ── Step indicators ────────────────────────────────────────────────────
function StepDots({ step }) {
    return (
        <div className="flex items-center gap-2 mt-6">
            {[1, 2].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-amber-300" : s < step ? "w-4 bg-amber-500" : "w-4 bg-brand-700"
                    }`} />
            ))}
            <span className="font-num text-amber-400 text-[11px] ml-1">Step {step}/2</span>
        </div>
    );
}

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    // Step 1 — fill details
    // Step 2 — verify OTP
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirm: "",
    });

    const [otp, setOtp] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiErr, setApiErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendCd, setResendCd] = useState(0); // countdown seconds

    const set = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: "" }));
        setApiErr("");
    };

    // ── Step 1 validation ────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!isValidPhone(form.phone)) e.phone = "Enter a valid 10-digit mobile number";
        if (form.email && !isValidEmail(form.email)) e.email = "Enter a valid email address";
        if (form.password.length < 6) e.password = "Minimum 6 characters";
        if (form.password !== form.confirm) e.confirm = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Send OTP ─────────────────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await authApi.sendOtp({ phone: form.phone });
            setStep(2);
            startCountdown();
        } catch (err) {
            setApiErr(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Resend countdown ─────────────────────────────────────────────────
    const startCountdown = () => {
        setResendCd(30);
        const t = setInterval(() => {
            setResendCd((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
        }, 1000);
    };

    const handleResend = async () => {
        if (resendCd > 0) return;
        setLoading(true);
        try {
            await authApi.sendOtp({ phone: form.phone });
            startCountdown();
        } catch (err) {
            setApiErr(err.message || "Could not resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    // ── Verify OTP + register ─────────────────────────────────────────────
    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.trim().length !== 6) { setErrors({ otp: "Enter the 6-digit OTP" }); return; }
        setLoading(true);
        try {
            const res = await authApi.register({
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                password: form.password,
                otp: otp.trim(),
            });
            login(res.user, res.token);
            navigate("/", { replace: true });
        } catch (err) {
            setApiErr(err.message || "OTP verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── shared field component ───────────────────────────────────────────
    const Field = ({ label, name, type = "text", placeholder, icon, rightSlot, autoComplete, inputMode, maxLength }) => (
        <div>
            <label className="field-label">{label}</label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">{icon}</span>
                )}
                <input
                    type={type}
                    value={form[name]}
                    onChange={(e) => set(name, e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    className={`${errors[name] ? "field-input-error" : "field-input"} ${icon ? "pl-10" : ""} ${rightSlot ? "pr-10" : ""}`}
                />
                {rightSlot && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
                )}
            </div>
            {errors[name] && (
                <p className="font-body text-xs text-red-500 mt-1">{errors[name]}</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">

            <div className="w-full max-w-4xl card overflow-hidden flex flex-col md:flex-row shadow-lg">

                {/* ══ LEFT — brand panel ══════════════════════════════════════ */}
                <div className="relative md:w-5/12 bg-brand-900 flex flex-col items-center justify-center px-8 py-12 gap-6 overflow-hidden">

                    <div className="absolute -top-16 -left-16 w-56 h-56 bg-brand-800 rounded-full opacity-40" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-800 rounded-full opacity-30" />

                    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                        {LOGO_URL ? (
                            <img src={LOGO_URL} alt="NammaOor Logo" className="w-20 h-20 object-contain" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center text-4xl shadow-lg">
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

                {/* ══ RIGHT — form panel ═══════════════════════════════════════ */}
                <div className="md:w-7/12 flex flex-col justify-center px-8 py-12 bg-white">

                    {step === 1 ? (
                        <>
                            <h2 className="font-display text-2xl font-bold text-brand-900 mb-1">
                                Create account
                            </h2>
                            <p className="font-body text-sm text-amber-600 mb-7">
                                Join us — it only takes a minute
                            </p>

                            {apiErr && (
                                <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-5">
                                    {apiErr}
                                </div>
                            )}

                            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">

                                <Field
                                    label="Full Name"
                                    name="fullName"
                                    placeholder="Your full name"
                                    icon={<User size={15} />}
                                    autoComplete="name"
                                />

                                <Field
                                    label="Phone Number"
                                    name="phone"
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    icon={<Phone size={15} />}
                                    autoComplete="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                />

                                <Field
                                    label="Email Address (optional)"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    icon={<Mail size={15} />}
                                    autoComplete="email"
                                />

                                <Field
                                    label="Password"
                                    name="password"
                                    type={showPw ? "text" : "password"}
                                    placeholder="Minimum 6 characters"
                                    icon={<Lock size={15} />}
                                    autoComplete="new-password"
                                    rightSlot={
                                        <button type="button" onClick={() => setShowPw((s) => !s)}
                                            className="text-amber-400 hover:text-brand-700 transition-colors">
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    }
                                />

                                <Field
                                    label="Confirm Password"
                                    name="confirm"
                                    type={showCf ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    icon={<Lock size={15} />}
                                    autoComplete="new-password"
                                    rightSlot={
                                        <button type="button" onClick={() => setShowCf((s) => !s)}
                                            className="text-amber-400 hover:text-brand-700 transition-colors">
                                            {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    }
                                />

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
                                <Link to="/login" className="font-semibold text-brand-800 hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </>

                    ) : (
                        /* ── STEP 2 — OTP ──────────────────────────────────────── */
                        <>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                                    <ShieldCheck size={20} className="text-brand-700" />
                                </div>
                                <h2 className="font-display text-2xl font-bold text-brand-900">
                                    Verify OTP
                                </h2>
                            </div>
                            <p className="font-body text-sm text-amber-600 mb-7">
                                Enter the 6-digit code sent to{" "}
                                <span className="font-semibold text-brand-800">+91 {form.phone}</span>
                            </p>

                            {apiErr && (
                                <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-5">
                                    {apiErr}
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="flex flex-col gap-5">

                                {/* OTP input */}
                                <div>
                                    <label className="field-label">One-Time Password</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => { setOtp(e.target.value.replace(/\D/, "")); setErrors({}); setApiErr(""); }}
                                        placeholder="• • • • • •"
                                        maxLength={6}
                                        inputMode="numeric"
                                        className={`${errors.otp ? "field-input-error" : "field-input"} text-center tracking-[0.6em] font-num text-xl`}
                                        autoFocus
                                    />
                                    {errors.otp && (
                                        <p className="font-body text-xs text-red-500 mt-1">{errors.otp}</p>
                                    )}
                                </div>

                                {/* resend */}
                                <div className="text-center">
                                    {resendCd > 0 ? (
                                        <p className="font-body text-xs text-amber-500">
                                            Resend OTP in{" "}
                                            <span className="font-num font-semibold text-brand-700">{resendCd}s</span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={loading}
                                            className="font-body text-xs text-brand-700 font-semibold hover:underline disabled:opacity-50"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>

                                <button type="submit" disabled={loading} className="btn-md btn-primary w-full">
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                                    ) : (
                                        <>Verify & Register <ArrowRight size={15} /></>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setOtp(""); setApiErr(""); }}
                                    className="font-body text-xs text-amber-500 hover:text-brand-700 text-center transition-colors"
                                >
                                    ← Change phone number
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Phone, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "../ApiCall/Api";
import { useAuthStore } from "../components/store/AuthStore";

// ─── Logo URL — replace with real cloud URL when available ────────────
// const LOGO_URL = "https://your-cloud-url.com/nammаoor-logo.png";
const LOGO_URL = null; // placeholder until cloud URL provided

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const redirectTo = location.state?.from || "/";

    // toggle between phone and email login
    const [mode, setMode] = useState("phone"); // "phone" | "email"
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.identifier.trim()) { setError("Please enter your " + (mode === "phone" ? "phone number" : "email")); return; }
        if (!form.password.trim()) { setError("Please enter your password"); return; }

        setLoading(true);
        try {
            // API accepts { phone, password } or { email, password }
            const payload = mode === "phone"
                ? { phone: form.identifier, password: form.password }
                : { email: form.identifier, password: form.password };

            const res = await authApi.login(payload);
            login(res.user, res.token);
            navigate(res.user?.role === "admin" ? "/admin" : redirectTo, { replace: true });
        } catch (err) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-4xl card overflow-hidden flex flex-col md:flex-row shadow-lg">
                <div className="relative md:w-5/12 bg-brand-900 flex flex-col items-center justify-center px-8 py-12 gap-6 overflow-hidden">
                    <div className="absolute -top-16 -left-16 w-56 h-56 bg-brand-800 rounded-full opacity-40" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-800 rounded-full opacity-30" />
                    {/* logo */}
                    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                        {LOGO_URL ? (
                            <img src={LOGO_URL} alt="NammaOor Logo" className="w-20 h-20 object-contain" />
                        ) : (
                            /* placeholder fish emoji circle until real logo */
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
                    {/* tagline */}
                    <p className="relative z-10 font-body text-amber-300 text-sm text-center leading-relaxed max-w-[200px]">
                        Authentic dry fish & coastal pickles — straight from Rameswaram fishermen.
                    </p>
                    {/* bottom link */}
                    <p className="relative z-10 font-body text-amber-500 text-xs text-center mt-auto">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-amber-300 font-semibold hover:underline">
                            Register
                        </Link>
                    </p>
                </div>

                {/* RIGHT — form panel */}
                <div className="md:w-7/12 flex flex-col justify-center px-8 py-12 bg-white">

                    <h2 className="font-display text-2xl font-bold text-brand-900 mb-1">
                        Welcome back
                    </h2>
                    <p className="font-body text-sm text-amber-600 mb-7">
                        Sign in to continue shopping
                    </p>

                    {/* Mode toggle: Phone / Email */}
                    <div className="flex gap-1 bg-brand-50 p-1 rounded-xl mb-6">
                        {[
                            { key: "phone", label: "Phone", icon: <Phone size={13} /> },
                            { key: "email", label: "Email", icon: <Mail size={13} /> },
                        ].map((m) => (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => { setMode(m.key); set("identifier", ""); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${mode === m.key
                                        ? "bg-brand-800 text-white shadow-sm"
                                        : "text-brand-700 hover:bg-brand-100"
                                    }`}
                            >
                                {m.icon} {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {/* identifier */}
                        <div>
                            <label className="field-label">
                                {mode === "phone" ? "Phone Number" : "Email Address"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                    {mode === "phone" ? <Phone size={15} /> : <Mail size={15} />}
                                </span>
                                <input
                                    type={mode === "phone" ? "tel" : "email"}
                                    value={form.identifier}
                                    onChange={(e) => set("identifier", e.target.value)}
                                    placeholder={mode === "phone" ? "10-digit mobile number" : "you@example.com"}
                                    className="field-input pl-10"
                                    autoComplete={mode === "phone" ? "tel" : "email"}
                                    inputMode={mode === "phone" ? "numeric" : "email"}
                                    maxLength={mode === "phone" ? 10 : undefined}
                                />
                            </div>
                        </div>

                        {/* password */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="field-label mb-0">Password</label>
                                <Link
                                    to="/forgot-password"
                                    className="font-body text-xs text-brand-700 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                    <Lock size={15} />
                                </span>
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => set("password", e.target.value)}
                                    placeholder="Your password"
                                    className="field-input pl-10 pr-10"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((s) => !s)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700 transition-colors"
                                    aria-label="Toggle password visibility">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-md btn-primary w-full mt-1"
                        >
                            {loading ? (
                                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                            ) : (
                                <>Sign In <ArrowRight size={15} /></>
                            )}
                        </button>

                    </form>
                    {/* ── Footer link (mobile — left panel is hidden on small) ── */}
                    <p className="md:hidden font-body text-sm text-center text-amber-700 mt-6">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-brand-800 hover:underline">
                            Register
                        </Link>
                    </p>

                </div>


            </div>
        </div>
    );
}
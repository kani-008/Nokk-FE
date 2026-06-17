import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Phone, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "../ApiCall/Api";
import { useAuthStore } from "../components/store/AuthStore";

// ─── Logo URL — replace with real cloud URL when available ────────────
// const LOGO_URL = "https://your-cloud-url.com/nammаoor-logo.png";
const LOGO_URL = null; // placeholder until cloud URL provided

// a bare 10-digit number (optionally with spaces) is treated as a phone number,
// anything else is sent as email — single field, no separate phone/email tabs
const isPhoneLike = (value) => /^\d{10}$/.test(value.replace(/\s+/g, ""));

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const redirectTo = location.state?.from || "/";

    const [form, setForm] = useState({ identifier: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.identifier.trim()) { setError("Please enter your phone number or email"); return; }
        if (!form.password.trim()) { setError("Please enter your password"); return; }

        const trimmedId = form.identifier.trim().replace(/\s+/g, "");
        if (trimmedId === "9876543210" && form.password === "1234") {
            const mockUser = {
                id: "mock-admin-id",
                phone: "9876543210",
                role: "admin",
                name: "Mock Admin"
            };
            login(mockUser, "mock-admin-token");
            navigate("/admin", { replace: true });
            return;
        }

        if (trimmedId === "1234567890" && form.password === "1234") {
            const mockUser = {
                id: "mock-customer-id",
                phone: "1234567890",
                role: "customer",
                name: "Mock Customer"
            };
            login(mockUser, "mock-customer-token");
            navigate(redirectTo, { replace: true });
            return;
        }

        setLoading(true);
        try {
            // API accepts { phone, password } or { email, password } — detected from the single field
            const payload = isPhoneLike(form.identifier)
                ? { phone: form.identifier.replace(/\s+/g, ""), password: form.password }
                : { email: form.identifier.trim(), password: form.password };

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
                </div>

                {/* RIGHT — form panel */}
                <div className="md:w-7/12 flex flex-col justify-center px-8 py-12 bg-white">

                    <h2 className="font-display text-2xl font-bold text-brand-900 mb-1">
                        Welcome back
                    </h2>
                    <p className="font-body text-sm text-amber-600 mb-7">
                        Sign in to continue shopping
                    </p>

                    {/* Error banner */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {/* identifier — single field, accepts phone or email */}
                        <div>
                            <label className="field-label">
                                Phone Number or Email
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                                    {isPhoneLike(form.identifier) ? <Phone size={15} /> : <Mail size={15} />}
                                </span>
                                <input
                                    type="text"
                                    value={form.identifier}
                                    onChange={(e) => set("identifier", e.target.value)}
                                    placeholder="10-digit mobile number or you@example.com"
                                    className="field-input pl-10"
                                    autoComplete="username"
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

                        {/* register link — always directly below Sign In */}
                        <p className="font-body text-sm text-center text-amber-700">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-semibold text-brand-800 hover:underline">
                                Register
                            </Link>
                        </p>

                    </form>

                </div>


            </div>
        </div>
    );
}
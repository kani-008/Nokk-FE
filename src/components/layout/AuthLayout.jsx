import { useRef, useEffect } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";

// ─── Logo URL — replace with real cloud URL when available ────────────
const LOGO_URL = null;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";

/**
 * ── GoogleAuthButton ───────────────────────────────────────────────
 * Loads Google Identity Services once and renders Google's own branded
 * button via renderButton. Shared by Login.jsx and Register.jsx.
 *
 * Props:
 *  - onCredential(credential: string)  — called with the ID token
 *  - disabled: boolean — hides the button while the parent is loading
 */
export function GoogleAuthButton({ onCredential, disabled = false }) {
    const btnRef = useRef(null);
    const initialized = useRef(false);

    useEffect(() => {
        const render = () => {
            if (initialized.current || !btnRef.current) return;
            initialized.current = true;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response) => onCredential(response.credential),
            });
            window.google.accounts.id.renderButton(btnRef.current, {
                type: "standard",
                theme: "outline",
                size: "large",
                width: btnRef.current.offsetWidth || 320,
                text: "continue_with",
            });
        };

        if (window.google?.accounts?.id) {
            render();
            return;
        }

        if (!document.getElementById("gsi-script")) {
            const script = document.createElement("script");
            script.id = "gsi-script";
            script.src = GSI_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.onload = render;
            document.head.appendChild(script);
        } else {
            const existing = document.getElementById("gsi-script");
            const handleLoad = () => render();
            existing.addEventListener("load", handleLoad);
            return () => existing.removeEventListener("load", handleLoad);
        }
    }, [onCredential]);

    return (
        <div
            ref={btnRef}
            className={`flex justify-center w-full ${disabled ? "opacity-40 pointer-events-none" : ""}`}
        />
    );
}

/**
 * ── StepDots ────────────────────────────────────────────────────────
 * Shared 3-step progress indicator used in both the Login (forgot-password
 * flow) and Register (3-step signup flow) brand panels.
 */
export function StepDots({ step }) {
    return (
        <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
                <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === step ? "w-8 bg-amber-300" : s < step ? "w-4 bg-amber-500" : "w-4 bg-brand-700"
                    }`}
                />
            ))}
            <span className="font-num text-amber-400 text-[11px] ml-1">Step {step}/3</span>
        </div>
    );
}

/**
 * ── OtpBoxes ────────────────────────────────────────────────────────
 * Shared 6-box OTP input row. Used by Login's forgot-password OTP step
 * and Register's signup OTP step — identical behavior (auto-advance,
 * backspace-back, paste-fill), only the id prefix differs so two
 * independent OTP rows can exist without DOM id clashes.
 */
export function OtpBoxes({ idPrefix, otp, hasError, onChange, onKeyDown, onPaste, fluid = false }) {
    return (
        <div className={`flex justify-center ${fluid ? "reg-otp-row-fluid md:gap-2.5" : "gap-2.5"} mt-1`}>
            {otp.map((digit, i) => (
                <input
                    key={i}
                    id={`${idPrefix}-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => onChange(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onPaste={i === 0 ? onPaste : undefined}
                    autoFocus={i === 0}
                    className={`${
                        fluid ? "reg-otp-box-fluid md:w-11 md:h-12" : "w-11 h-12"
                    } text-center font-num ${fluid ? "md:text-lg" : "text-lg"} font-semibold rounded-xl border transition-colors shrink-0 ${
                        hasError
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-sandal-200 bg-sandal-50 text-brand-900 focus:border-brand-700 focus:bg-brand-50"
                    } focus:outline-none`}
                />
            ))}
        </div>
    );
}

// shared input class helper — avoids repeating the error/normal ternary everywhere
export const fieldClass = (hasError, extra = "") =>
    `${hasError ? "field-input-error" : "field-input"} ${extra}`.trim();

/**
 * ── AuthLayout ──────────────────────────────────────────────────────
 * Shared visual shell for both /login and /register. Owns ONLY presentation:
 * page background, toast rendering, the two-pane card, the brand panel
 * (logo, Tamil wordmark, perks/tagline/forgot-copy slot, StepDots, bottom
 * link), and the mobile badge + heading block.
 *
 * All auth logic (state, handlers, API calls) stays in Login.jsx / Register.jsx.
 * Each page passes its current step content in via `children`, and brand-panel
 * specifics via `brandContent` / `bottomLink` / `step`.
 *
 * Props:
 * - mode: "login" | "register" — only used for minor copy/perks branching
 * - step: 1 | 2 | 3 — drives StepDots
 * - title / subtitle: heading block content (page decides per-view copy)
 * - brandContent: node rendered in the left desktop brand panel (perks list,
 *     tagline, or forgot-password copy — differs per page/view)
 * - bottomLink: node rendered at the bottom of the brand panel (e.g.
 *     "Already have an account? Sign In")
 * - toast: { message, type: "error" | "success", visible } — single shared
 *     toast shape covering both pages' needs
 * - extraStyles: optional <style> string injected once (Register's mobile
 *     fluid clamp() rules) — Login passes nothing
 * - children: the actual per-step form content for the right panel
 */
export default function AuthLayout({
    title,
    subtitle,
    brandContent,
    bottomLink,
    toast,
    cardClassName = "",
    formPanelClassName = "",
    pageClassName = "min-h-screen px-4 pt-8 pb-10 md:py-10",
    children,
}) {
    return (
        <div className={`flex flex-col items-center justify-center lg:flex-row lg:justify-center lg:items-center bg-sandal-50 relative ${pageClassName}`}>

            {/* ── Toast (Red for Error, Green for Success) ── */}
            <div
                className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${
                    toast?.visible
                        ? "translate-x-0 opacity-100"
                        : "translate-x-[120%] opacity-0 pointer-events-none"
                }`}
            >
                {toast?.message && (
                    <div
                        className={`flex items-start gap-2.5 bg-white border shadow-lg font-body text-sm rounded-xl px-4 py-3.5 ${
                            toast.type === "success"
                                ? "border-green-200 shadow-green-900/5 text-green-700"
                                : "border-red-200 shadow-red-900/5 text-red-700"
                        }`}
                    >
                        {toast.type === "success" ? (
                            <ShieldCheck size={17} className="shrink-0 mt-0.5 text-green-500" />
                        ) : (
                            <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
                        )}
                        <p className="leading-snug">{toast.message}</p>
                    </div>
                )}
            </div>

            {/* ambient background wash — mobile only */}
            <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-brand-800/[0.06] blur-2xl" />
                <div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full bg-sandal-400/10 blur-3xl" />
            </div>

            <div
                className={`relative z-10 w-full max-w-md lg:max-w-4xl bg-white rounded-3xl lg:rounded-2xl border border-sandal-100 overflow-hidden flex flex-col lg:flex-row shadow-xl shadow-brand-900/5 ${cardClassName}`}
            >
                {/* LEFT — Brand panel (desktop only) */}
                <div className="hidden lg:flex relative lg:w-5/12 bg-brand-900 flex-col items-center justify-center px-8 py-12 gap-6 overflow-hidden">
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
                            <h1 className="font-display text-white text-2xl font-bold leading-tight">நம்ம ஊர்</h1>
                            <p className="font-display text-amber-300 text-lg font-semibold leading-tight">
                                கருவாட்டு கடை
                            </p>
                            <p className="font-body text-amber-400 text-xs mt-1 tracking-wider uppercase">
                                Namma Oor Karuvattu Kadai
                            </p>
                        </div>
                    </div>

                    {/* per-page/per-view slot: perks list, tagline, or forgot-password copy + StepDots */}
                    {brandContent}

                    {bottomLink}
                </div>

                {/* RIGHT — form panel */}
                <div
                    className={`w-full lg:w-7/12 flex flex-col justify-start lg:justify-center px-6 py-6 lg:px-12 lg:py-12 bg-white ${formPanelClassName}`}
                >
                    {/* Mobile brand badge + wordmark — visible only on mobile */}
                    <div className="flex flex-col items-center mb-5 lg:hidden">
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
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-4 lg:mb-6 w-full">
                        {title}
                        {subtitle && (
                            <p className="font-body text-sm text-amber-600 mt-1 text-center lg:text-left">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* per-step form content — owned entirely by Login.jsx / Register.jsx */}
                    {children}
                </div>
            </div>
        </div>
    );
}
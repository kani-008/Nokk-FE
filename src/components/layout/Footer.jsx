import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Fish, Phone, Mail, MapPin,
  ShieldCheck, Truck, RefreshCcw, Headphones,
  ChevronDown, ChevronUp,
} from "lucide-react";
import {FaInstagram,FaFacebook,FaYoutube,FaTwitter} from "react-icons/fa"


const QUICK_LINKS = [
  { label: "All Products",    to: "/products" },
  { label: "Best Sellers",    to: "/products?isBestseller=true" },
  { label: "New Arrivals",    to: "/products?sort=newest" },
  { label: "Offers & Deals",  to: "/offers" },
];

const ACCOUNT_LINKS = [
  { label: "My Account",   to: "/profile" },
  { label: "My Orders",    to: "/my-orders" },
  { label: "Wishlist",     to: "/wishlist" },
  { label: "Track Order",  to: "/my-orders" },
];

const POLICY_LINKS = [
  { label: "Return Policy",    href: "#" },
  { label: "Shipping Policy",  href: "#" },
  { label: "Privacy Policy",   href: "#" },
  { label: "Terms of Use",     href: "#" },
  { label: "FAQ",              href: "#" },
];

const CATEGORIES = [
  { label: "Nethili (Anchovy)",    to: "/products?category=nethili" },
  { label: "Sura (Shark)",         to: "/products?category=sura" },
  { label: "Kelanga (Catfish)",    to: "/products?category=kelanga" },
  { label: "Vanjaram (Kingfish)",  to: "/products?category=vanjaram" },
  { label: "Pickles & Chutneys",  to: "/products?category=pickles" },
];

const TRUST_ITEMS = [
  { icon: <Truck size={20} />,       label: "Free Shipping",    sub: "On orders ₹499+" },
  { icon: <ShieldCheck size={20} />, label: "100% Natural",     sub: "No preservatives" },
  { icon: <RefreshCcw size={20} />,  label: "7-Day Returns",    sub: "Hassle free" },
  { icon: <Headphones size={20} />,  label: "24/7 Support",     sub: "Always here" },
];

const PAYMENT_ICONS = ["UPI", "Visa", "MC", "GPay", "PhonePe", "COD"];

// ── Inline Facebook SVG (removed from lucide-react in recent versions) ──
const FacebookIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const SOCIAL = [
  { icon: <FaInstagram size={16} />, href: "#", label: "Instagram" },
  { icon: <FaFacebook size={16} />, href: "#", label: "Facebook" },
  { icon: <FaYoutube   size={16} />, href: "#", label: "YouTube"   },
  { icon: <FaTwitter   size={16} />, href: "#", label: "Twitter"   },
];

// ── Mobile accordion section ─────────────────────────────────────────────
function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-amber-800">
      <button
        className="w-full flex items-center justify-between py-4 font-body text-sm font-semibold text-white"
        onClick={() => setOpen((s) => !s)}
      >
        {title}
        {open ? <ChevronUp size={16} className="text-amber-400" /> : <ChevronDown size={16} className="text-amber-400" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function Footer() {
  const [email,  setEmail]  = useState("");
  const [subMsg, setSubMsg] = useState("");

  const handleSub = (e) => {
    e.preventDefault();
    if (!email.includes("@")) { setSubMsg("Enter a valid email"); return; }
    setSubMsg("Thank you for subscribing! 🎉");
    setEmail("");
  };

  return (
    <footer className="bg-brand-900 text-amber-100">

      {/* ── Trust bar ───────────────────────────────────────────────── */}
      <div className="border-b border-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="text-amber-400 shrink-0">{t.icon}</span>
              <div>
                <p className="font-body text-xs font-semibold text-white leading-none">{t.label}</p>
                <p className="font-body text-[11px] text-amber-400 mt-0.5">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main footer content ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Desktop grid (hidden on mobile) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">

          {/* Brand col — 2 wide on lg */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-amber-600 text-white p-1.5 rounded-lg shrink-0">
                <Fish size={20} />
              </div>
              <div className="leading-none">
                <span className="font-display text-white font-bold text-base block">NammaOor</span>
                <span className="font-tamil text-amber-400 text-[11px]">கருவாட்டு கடை</span>
              </div>
            </Link>

            <p className="font-body text-sm text-amber-300 leading-relaxed mb-5 max-w-xs">
              Authentic dry fish and coastal pickles sourced directly from Rameswaram fishermen.
              Traditionally dried, naturally preserved — delivered to your doorstep.
            </p>

            {/* Social */}
            <div className="flex gap-2 mb-6">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-brand-800 hover:bg-amber-600 flex items-center justify-center text-amber-300 hover:text-white transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Contact */}
            <ul className="space-y-2 text-sm text-amber-300">
              <li className="flex items-center gap-2">
                <Phone size={13} className="shrink-0 text-amber-500" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="shrink-0 text-amber-500" />
                <a href="mailto:hello@nammakadai.com" className="hover:text-white transition-colors">hello@nammakadai.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="shrink-0 text-amber-500 mt-0.5" />
                <span>Rameswaram, Ramanathapuram,<br />Tamil Nadu — 623 526</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-sm font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="font-body text-sm text-amber-300 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-body text-sm font-semibold text-white mb-4">My Account</h4>
            <ul className="space-y-2.5">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="font-body text-sm text-amber-300 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-body text-sm font-semibold text-white mb-4 mt-6">Policies</h4>
            <ul className="space-y-2.5">
              {POLICY_LINKS.slice(0, 3).map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-body text-sm text-amber-300 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-body text-sm font-semibold text-white mb-1">Stay Updated</h4>
            <p className="font-body text-xs text-amber-400 mb-4 leading-relaxed">
              Get deals, seasonal arrivals & fishing updates delivered to your inbox.
            </p>
            <form onSubmit={handleSub} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubMsg(""); }}
                placeholder="your@email.com"
                className="w-full bg-brand-800 border border-amber-700 text-white placeholder:text-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-body outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-brand-900 font-body font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Subscribe
              </button>
            </form>
            {subMsg && (
              <p className={`font-body text-xs mt-2 ${subMsg.includes("valid") ? "text-red-400" : "text-green-400"}`}>
                {subMsg}
              </p>
            )}

            {/* Categories list */}
            <h4 className="font-body text-sm font-semibold text-white mb-3 mt-6">Categories</h4>
            <ul className="space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.to}>
                  <Link to={c.to} className="font-body text-xs text-amber-400 hover:text-amber-200 transition-colors">
                    › {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Mobile accordion (visible on mobile only) ──────────────── */}
        <div className="sm:hidden mb-6">
          {/* Brand always visible on mobile */}
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-amber-600 text-white p-1.5 rounded-lg shrink-0">
              <Fish size={18} />
            </div>
            <div className="leading-none">
              <span className="font-display text-white font-bold text-base block">NammaOor</span>
              <span className="font-tamil text-amber-400 text-[11px]">கருவாட்டு கடை</span>
            </div>
          </div>
          <p className="font-body text-sm text-amber-300 leading-relaxed mb-5">
            Authentic dry fish sourced directly from Rameswaram fishermen.
          </p>
          <div className="flex gap-2 mb-6">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}
                className="w-8 h-8 rounded-full bg-brand-800 hover:bg-amber-600 flex items-center justify-center text-amber-300 hover:text-white transition-colors">
                {s.icon}
              </a>
            ))}
          </div>

          <AccordionSection title="Shop">
            <ul className="space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className="font-body text-sm text-amber-300 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="My Account">
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className="font-body text-sm text-amber-300 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Policies">
            <ul className="space-y-3">
              {POLICY_LINKS.map((l) => (
                <li key={l.label}><a href={l.href} className="font-body text-sm text-amber-300 hover:text-white">{l.label}</a></li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Contact Us">
            <ul className="space-y-3 text-sm text-amber-300">
              <li className="flex items-center gap-2"><Phone size={13} className="text-amber-500" />
                <a href="tel:+919876543210" className="hover:text-white">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2"><Mail size={13} className="text-amber-500" />
                <a href="mailto:hello@nammakadai.com" className="hover:text-white">hello@nammakadai.com</a>
              </li>
              <li className="flex items-start gap-2"><MapPin size={13} className="text-amber-500 mt-0.5 shrink-0" />
                <span>Rameswaram, Tamil Nadu — 623 526</span>
              </li>
            </ul>
          </AccordionSection>

          {/* Mobile newsletter */}
          <div className="pt-5">
            <p className="font-body text-sm font-semibold text-white mb-2">Stay Updated</p>
            <form onSubmit={handleSub} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubMsg(""); }}
                placeholder="your@email.com"
                className="flex-1 bg-brand-800 border border-amber-700 text-white placeholder:text-amber-500 rounded-xl px-3 py-2.5 text-sm font-body outline-none focus:border-amber-400"
              />
              <button type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-brand-900 font-body font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0">
                Go
              </button>
            </form>
            {subMsg && (
              <p className={`font-body text-xs mt-1.5 ${subMsg.includes("valid") ? "text-red-400" : "text-green-400"}`}>
                {subMsg}
              </p>
            )}
          </div>
        </div>

        {/* ── Payment methods ──────────────────────────────────────── */}
        <div className="border-t border-brand-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-body text-xs text-amber-500 mb-2 text-center sm:text-left">We accept</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {PAYMENT_ICONS.map((p) => (
                <span
                  key={p}
                  className="font-num text-[10px] font-bold bg-brand-800 border border-amber-700 text-amber-300 px-2.5 py-1 rounded-lg"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <p className="font-body text-xs text-amber-600 text-center sm:text-right">
            © {new Date().getFullYear()} NammaOorKaruvattuKadai. All rights reserved.<br className="sm:hidden" />
            <span className="sm:ml-1">Made with ❤️ in Tamil Nadu</span>
          </p>
        </div>
      </div>

    </footer>
  );
}
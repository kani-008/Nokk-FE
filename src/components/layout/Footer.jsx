import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone, Mail, MapPin,
  ShieldCheck, Truck, RefreshCcw, Headphones,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { FaInstagram, FaFacebook, FaYoutube, FaTwitter } from "react-icons/fa";
import Logo from "./Logo";

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
  { label: "Pickles & Chutneys",   to: "/products?category=pickles" },
];

const TRUST_ITEMS = [
  { icon: <Truck size={20} />,       label: "Free Shipping",    sub: "On orders ₹499+" },
  { icon: <ShieldCheck size={20} />, label: "100% Natural",     sub: "No preservatives" },
  // { icon: <RefreshCcw size={20} />,  label: "7-Day Returns",    sub: "Hassle free" },
  { icon: <ShieldCheck size={20} />, label: "Secure Checkout", sub: "100% Encrypted" },
  { icon: <Headphones size={20} />,  label: "24/7 Support",     sub: "Always here" },
];


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
    <div className="border-b border-gray-800">
      <button
        className="w-full flex items-center justify-between py-4 font-body text-sm font-bold text-white"
        onClick={() => setOpen((s) => !s)}
      >
        {title}
        {open ? <ChevronUp size={16} className="text-sandal-400" /> : <ChevronDown size={16} className="text-sandal-400" />}
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
    <footer className="bg-gray-900 text-gray-300 border-t border-sandal-100">

      {/* ── Trust bar ───────────────────────────────────────────────── */}
      <div className="border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="text-sandal-400 shrink-0">{t.icon}</span>
              <div>
                <p className="font-body text-xs font-bold text-white leading-none">{t.label}</p>
                <p className="font-body text-[11px] text-sandal-300/80 mt-1">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main footer content ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* Desktop grid (hidden on mobile) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">

          {/* Brand col — 2 wide on lg */}
          <div className="lg:col-span-2">
            <Logo showText={true} inverse={true} className="mb-4" />

            <p className="font-body text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Authentic dry fish and coastal pickles sourced directly from Rameswaram fishermen.
              Traditionally sun-dried, naturally preserved — delivered straight to your doorstep.
            </p>

            {/* Social */}
            <div className="flex gap-2.5 mb-6">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-sandal-600 flex items-center justify-center text-sandal-300 hover:text-white transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Contact */}
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={13} className="shrink-0 text-sandal-400" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="shrink-0 text-sandal-400" />
                <a href="mailto:hello@nammakadai.com" className="hover:text-white transition-colors">hello@nammakadai.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="shrink-0 text-sandal-400 mt-0.5" />
                <span>Rameswaram, Ramanathapuram,<br />Tamil Nadu — 623 526</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-sm font-bold text-white mb-4 tracking-wider uppercase">Shop</h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-body text-sm font-bold text-white mb-4 tracking-wider uppercase">My Account</h4>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-body text-sm font-bold text-white mb-4 mt-6 tracking-wider uppercase">Policies</h4>
            <ul className="space-y-3">
              {POLICY_LINKS.slice(0, 3).map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-body text-sm font-bold text-white mb-1.5 tracking-wider uppercase">Stay Updated</h4>
            <p className="font-body text-xs text-gray-400 mb-4 leading-relaxed">
              Get deals, seasonal arrivals & fishing updates delivered straight to your inbox.
            </p>
            <form onSubmit={handleSub} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubMsg(""); }}
                placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 text-sm font-body outline-none focus:border-sandal-400 focus:ring-2 focus:ring-sandal-500/10"
              />
              <button
                type="submit"
                className="w-full bg-sandal-500 hover:bg-sandal-400 text-gray-950 font-body font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Subscribe
              </button>
            </form>
            {subMsg && (
              <p className={`font-body text-xs mt-2 ${subMsg.includes("valid") ? "text-red-400" : "text-sandal-300"}`}>
                {subMsg}
              </p>
            )}

            {/* Categories list */}
            <h4 className="font-body text-sm font-bold text-white mb-3 mt-6 tracking-wider uppercase">Categories</h4>
            <ul className="space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.to}>
                  <Link to={c.to} className="font-body text-xs text-gray-400 hover:text-sandal-300 transition-colors">
                    › {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Mobile accordion (visible on mobile only) ──────────────── */}
        <div className="sm:hidden mb-8">
          <Logo showText={true} inverse={true} className="mb-4" />
          <p className="font-body text-sm text-gray-400 leading-relaxed mb-6">
            Authentic dry fish sourced directly from Rameswaram fishermen.
          </p>
          <div className="flex gap-2.5 mb-6">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-sandal-600 flex items-center justify-center text-sandal-300 hover:text-white transition-all">
                {s.icon}
              </a>
            ))}
          </div>

          <AccordionSection title="Shop">
            <ul className="space-y-3 pl-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className="font-body text-sm text-gray-400 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="My Account">
            <ul className="space-y-3 pl-2">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}><Link to={l.to} className="font-body text-sm text-gray-400 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Policies">
            <ul className="space-y-3 pl-2">
              {POLICY_LINKS.map((l) => (
                <li key={l.label}><a href={l.href} className="font-body text-sm text-gray-400 hover:text-white">{l.label}</a></li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Contact Us">
            <ul className="space-y-3 pl-2 text-sm text-gray-400">
              <li className="flex items-center gap-2.5"><Phone size={13} className="text-sandal-400" />
                <a href="tel:+919876543210" className="hover:text-white">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2.5"><Mail size={13} className="text-sandal-400" />
                <a href="mailto:hello@nammakadai.com" className="hover:text-white">hello@nammakadai.com</a>
              </li>
              <li className="flex items-start gap-2.5"><MapPin size={13} className="text-sandal-400 mt-0.5 shrink-0" />
                <span>Rameswaram, Tamil Nadu — 623 526</span>
              </li>
            </ul>
          </AccordionSection>

          {/* Mobile newsletter */}
          <div className="pt-6">
            <p className="font-body text-sm font-bold text-white mb-2">Stay Updated</p>
            <form onSubmit={handleSub} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubMsg(""); }}
                placeholder="your@email.com"
                className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 text-sm font-body outline-none focus:border-sandal-400"
              />
              <button type="submit"
                className="bg-sandal-500 hover:bg-sandal-400 text-gray-950 font-body font-bold px-4 py-2.5 rounded-xl text-sm transition-all shrink-0">
                Go
              </button>
            </form>
            {subMsg && (
              <p className={`font-body text-xs mt-2 ${subMsg.includes("valid") ? "text-red-400" : "text-sandal-300"}`}>
                {subMsg}
              </p>
            )}
          </div>
        </div>

        {/* ── Copyright ──────────────────────────────────────── */}
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="font-body text-xs text-gray-500 leading-relaxed">
            © {new Date().getFullYear()} NammaOorKaruvattuKadai. All rights reserved.<br className="sm:hidden" />
            <span className="sm:ml-1">Made with ❤️ in Tamil Nadu</span>
          </p>
        </div>
      </div>

    </footer>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  Headphones,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import Logo from "./Logo";
import API from "../../ApiCall/Api.jsx";
import { useDeliverySettings, useHomeCategories } from "../../hookqueries/useHome.js";

const QUICK_LINKS = [
  { label: "All Products", to: "/products" },
  { label: "Best Sellers", to: "/products?isBestseller=true" },
  { label: "New Arrivals", to: "/products?sort=newest" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", to: "/profile" },
  { label: "My Orders", to: "/my-orders" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Track Order", to: "/my-orders" },
];

const POLICY_LINKS = [
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms and Condition ", to: "/terms" },
  // { label: "FAQ", href: "#" },
  {label:"Return Policy",to:"/return"}
];



function useTrustItems() {
  const { data: delivery } = useDeliverySettings();
  const threshold = delivery?.freeShippingThreshold || 499;
  return [
    {
      icon: <Truck size={20} />,
      label: "Free Shipping",
      sub: `On orders ₹${threshold}+`,
    },
    {
      icon: <ShieldCheck size={20} />,
      label: "100% Natural",
      sub: "No preservatives",
    },
    {
      icon: <ShieldCheck size={20} />,
      label: "Secure Checkout",
      sub: "100% Encrypted",
    },
    {
      icon: <Headphones size={20} />,
      label: "24/7 Support",
      sub: "Always here",
    },
  ];
}

// ── Mobile accordion section ─────────────────────────────────────────────
function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-800">
      <button
        className="w-full flex items-center justify-between py-3 font-body text-sm font-bold text-white"
        onClick={() => setOpen((s) => !s)}
      >
        {title}
        {open ? (
          <ChevronUp size={16} className="text-sandal-400" />
        ) : (
          <ChevronDown size={16} className="text-sandal-400" />
        )}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function Footer() {
  const [settings, setSettings] = useState({});
  const trustItems = useTrustItems();
  const { data: categoriesData, isLoading: categoriesLoading } = useHomeCategories();

  useEffect(() => {
    API.get("/settings/get-all")
      .then((res) => setSettings(res.data.settings || {}))
      .catch(() => {});
  }, []);

  const description =
    settings.storeDescription ||
    "Authentic dry fish and coastal pickles sourced directly from coastal fishermen. Traditionally sun-dried, naturally preserved — delivered straight to your doorstep.";
  const phone =
    settings.storePhone || settings.contactPhone || "+91 98765 43210";
  const email_c =
    settings.storeEmail || settings.contactEmail || "hello@nammakadai.com";
  const address =
    settings.storeAddress || "Ramanathapuram, Tamil Nadu — 623 526";

  const socials = [
    settings.instagramUrl && {
      icon: <FaInstagram size={16} />,
      href: settings.instagramUrl,
      label: "Instagram",
    },
    settings.facebookUrl && {
      icon: <FaFacebook size={16} />,
      href: settings.facebookUrl,
      label: "Facebook",
    },
    settings.youtubeUrl && {
      icon: <FaYoutube size={16} />,
      href: settings.youtubeUrl,
      label: "YouTube",
    },
    settings.twitterUrl && {
      icon: <FaTwitter size={16} />,
      href: settings.twitterUrl,
      label: "Twitter",
    },
    settings.whatsappNumber && {
      icon: <FaWhatsapp size={16} />,
      href: `https://wa.me/${String(settings.whatsappNumber).replace(/[^0-9]/g, "")}`,
      label: "WhatsApp",
    },
  ].filter(Boolean);

  const socialLinks =
    socials.length > 0
      ? socials
      : [
          { icon: <FaInstagram size={16} />, href: "#", label: "Instagram" },
          { icon: <FaFacebook size={16} />, href: "#", label: "Facebook" },
          { icon: <FaYoutube size={16} />, href: "#", label: "YouTube" },
          { icon: <FaTwitter size={16} />, href: "#", label: "Twitter" },
        ];

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-sandal-100">
      {/* ── Trust bar ───────────────────────────────────────────────── */}
      <div className="border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {trustItems.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="text-sandal-400 shrink-0">{t.icon}</span>
              <div>
                <p className="font-body text-xs font-bold text-white leading-none">
                  {t.label}
                </p>
                <p className="font-body text-[11px] text-sandal-300/80 mt-1">
                  {t.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main footer content ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1">
        {/* Desktop grid (hidden on mobile) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-2">
          {/* Brand col — 2 wide on lg */}
          <div className="lg:col-span-2">
            <Logo showText={true} inverse={true} className="mb-4" />

            <p className="font-body text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              {description}
            </p>

            {/* Social */}
            <div className="flex gap-2.5 mb-6">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
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
                <a
                  href={`tel:${phone}`}
                  className="hover:text-white transition-colors"
                >
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="shrink-0 text-sandal-400" />
                <a
                  href={`mailto:${email_c}`}
                  className="hover:text-white transition-colors"
                >
                  {email_c}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="shrink-0 text-sandal-400 mt-0.5" />
                <span>{address}</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-sm font-bold text-white mb-4 tracking-wider uppercase">
              Shop
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Categories list */}
            {!categoriesLoading && categoriesData && categoriesData.length > 0 && (
              <>
                <h4 className="font-body text-sm font-bold text-white mb-3 mt-6 tracking-wider uppercase">
                  Categories
                </h4>
                <ul className="space-y-2">
                  {categoriesData.slice(0, 5).map((cat) => {
                    const toPath = `/products?category=${cat.slug}`;
                    return (
                      <li key={toPath}>
                        <Link
                          to={toPath}
                          className="font-body text-xs text-gray-400 hover:text-sandal-300 transition-colors"
                        >
                          › {cat.nameEn}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-body text-sm font-bold text-white mb-4 tracking-wider uppercase">
              My Account
            </h4>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-body text-sm font-bold text-white mb-4 mt-6 tracking-wider uppercase">
              Policies
            </h4>
            <ul className="space-y-3">
              {POLICY_LINKS.map((l) => (
                <li key={l.label}>
                  {l.to ? (
                    <Link
                      to={l.to}
                      className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      className="font-body text-sm text-gray-400 hover:text-sandal-300 transition-colors"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Mobile accordion (visible on mobile only) ──────────────── */}
        <div className="sm:hidden mb-8">
          <Logo showText={true} inverse={true} className="mb-4" />
          <p className="font-body text-sm text-gray-400 leading-relaxed mb-6">
            {description}
          </p>
          <div className="flex gap-2.5 mb-6">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-sandal-600 flex items-center justify-center text-sandal-300 hover:text-white transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>

          <AccordionSection title="Shop">
            <ul className="space-y-3 pl-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="font-body text-sm text-gray-400 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="My Account">
            <ul className="space-y-3 pl-2">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="font-body text-sm text-gray-400 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Policies">
            <ul className="space-y-3 pl-2">
              {POLICY_LINKS.map((l) => (
                <li key={l.label}>
                  {l.to ? (
                    <Link
                      to={l.to}
                      className="font-body text-sm text-gray-400 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      className="font-body text-sm text-gray-400 hover:text-white"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Contact Us">
            <ul className="space-y-3 pl-2 text-sm text-gray-400">
              <li className="flex items-center gap-2.5">
                <Phone size={13} className="text-sandal-400" />
                <a href={`tel:${phone}`} className="hover:text-white">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={13} className="text-sandal-400" />
                <a href={`mailto:${email_c}`} className="hover:text-white">
                  {email_c}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={13} className="text-sandal-400 mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </AccordionSection>
        </div>

        {/* ── Copyright ──────────────────────────────────────── */}
        <div className="border-t border-gray-800 pt-1 text-center">
          <p className="font-body text-xs text-gray-500 leading-relaxed">
            © {new Date().getFullYear()} Namma Oor Karuvattu Kadai. All rights
            reserved.
            <br className="sm:hidden" />
            <span className="sm:ml-1">Made with ❤️ in Tamil Nadu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

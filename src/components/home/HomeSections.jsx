import { Link } from "react-router-dom";
import { ArrowRight, Star, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import ProductCard from "../Product/ProductCard.jsx";
import comboImg from "../../assets/products/combo.jpg";

const PH_CAT = comboImg;

// ══════════════════════════════════════════════════════════════════════
// TRUST STRIP
// ══════════════════════════════════════════════════════════════════════
export function TrustStrip() {
  const items = [
    { icon: <Truck size={18} />,       label: "Free shipping above ₹499" },
    { icon: <ShieldCheck size={18} />, label: "100% natural & authentic" },
    { icon: <ShieldCheck size={18} />, label: "Secure Payment Checkout" },
  ];
  return (
    <div className="bg-white border-b border-sandal-100">
      <div className="page-wrap py-4.5 grid grid-cols-3 gap-2 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left justify-center"
          >
            <span className="text-sandal-600 shrink-0">{item.icon}</span>
            <span className="font-body text-xs sm:text-sm text-gray-700 font-bold leading-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CATEGORY SCROLL
// ══════════════════════════════════════════════════════════════════════
export function CategoryScroll({ categories }) {
  if (!categories.length) return null;
  return (
    <section className="page-wrap pt-12 pb-4">
      <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 text-center sm:text-center">
        Shop by Category
      </h2>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-sandal-200 group-hover:border-gray-800 transition-all duration-300 bg-sandal-50 shadow-sm">
              <img
                src={cat.imageUrl || PH_CAT}
                alt={cat.nameEn}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => { e.target.src = PH_CAT; }}
              />
            </div>
            <span className="font-body text-xs font-bold text-gray-700 text-center w-20 sm:w-24 leading-tight group-hover:text-sandal-700 transition-colors">
              {cat.nameEn}
            </span>
            {cat.nameTa && (
              <span className="font-tamil text-[10px] font-semibold text-sandal-500 text-center w-20 sm:w-24 leading-tight -mt-0.5">
                {cat.nameTa}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PRODUCT SKELETON (used while a ProductSection is loading)
// ══════════════════════════════════════════════════════════════════════
function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4.5 space-y-2.5">
        <div className="skeleton h-2 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="flex justify-between mt-3">
          <div className="skeleton h-4.5 w-1/4" />
          <div className="skeleton h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PRODUCT SECTION (reusable grid wrapper — Best Sellers / New Arrivals etc.)
// ══════════════════════════════════════════════════════════════════════
export function ProductSection({ title, subtitle, viewAllTo, loading, products, emptyText }) {
  return (
    <section className="page-wrap py-12">
      <div className="flex items-end justify-between mb-6 border-b border-sandal-100 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-800">{title}</h2>
          {subtitle && (
            <p className="font-body text-xs text-sandal-600 mt-1 font-semibold">{subtitle}</p>
          )}
        </div>
        <Link
          to={viewAllTo}
          className="font-body text-xs sm:text-sm text-sandal-700 font-bold flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <p className="font-body text-sandal-500 text-sm py-10 text-center">{emptyText}</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PROMO BANNER
// ══════════════════════════════════════════════════════════════════════
export function PromoBanner() {
  return (
    <div className="page-wrap py-6">
      <div className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-800 border border-sandal-200/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <p className="font-num text-sandal-400 text-xs font-bold uppercase tracking-widest mb-1.5">
            Limited Time Deal
          </p>
          <h3 className="font-display text-white font-extrabold text-xl leading-tight">
            Get 10% off on orders above ₹499
          </h3>
          <p className="font-body text-sandal-100/90 text-sm mt-1">
            Use code{" "}
            <span className="font-num font-bold text-sandal-300 tracking-widest bg-gray-850 px-2 py-0.5 rounded border border-gray-700">NAMMA10</span>
            {" "}at checkout
          </p>
        </div>
        <Link
          to="/products"
          className="shrink-0 bg-sandal-500 hover:bg-sandal-400 text-gray-950 font-body font-bold px-7 py-3.5 rounded-full text-sm transition-all shadow-md"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// WHY US
// ══════════════════════════════════════════════════════════════════════
export function WhyUs() {
  const reasons = [
    {
      emoji: "🎣",
      title: "Direct from Fishermen",
      desc:  "We partner directly with Rameswaram fishing families — no middleman, ensuring maximum freshness.",
    },
    {
      emoji: "☀️",
      title: "Sun-Dried Naturally",
      desc:  "Traditional coastal sun-drying process under optimal hygienic standards. Zero chemicals.",
    },
    {
      emoji: "📦",
      title: "Hygienic Packaging",
      desc:  "Premium multi-layer, odour-proof packaging that seals in coastal freshness for months.",
    },
  ];
  return (
    <section className="bg-gray-900 py-16 px-4 border-t border-b border-gray-850 my-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold text-white mb-3">
          Why Namma Oor Karuvattu Kadai?
        </h2>
        <p className="font-body text-sandal-300/80 text-sm mb-12 max-w-md mx-auto">
          We don't just sell dry fish — we preserve a tradition of purity.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div key={r.title} className="bg-gray-800/50 border border-gray-850 rounded-2xl p-6.5 text-left">
              <span className="text-3xl block mb-4">{r.emoji}</span>
              <h3 className="font-display text-white font-bold text-lg mb-2">{r.title}</h3>
              <p className="font-body text-gray-400 text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ══════════════════════════════════════════════════════════════════════
export function Testimonials() {
  const reviews = [
    {
      name:     "Meena Sundaram",
      location: "Chennai",
      text:     "The nethili is exactly like what my paati used to buy in Rameswaram. Freshness and quality is unmatched. Ordering for 6 months now.",
      rating:   5,
    },
    {
      name:     "Rajan Pillai",
      location: "Coimbatore",
      text:     "Packaging is excellent — no smell leakage, arrived sealed and dry. The sura karuvadu is perfectly dried, not too salty. Will reorder.",
      rating:   5,
    },
    {
      name:     "Divya Krishnamurthy",
      location: "Bengaluru",
      text:     "Living away used to mean missing authentic dry fish. Found NammaOor and now I order every month. The pickle combo is outstanding!",
      rating:   5,
    },
  ];

  return (
    <section className="bg-sandal-50/50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-2">
            What Our Customers Say
          </h2>
          <p className="font-body text-sm font-semibold text-sandal-600">
            Real reviews from real karuvadu lovers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="card p-6 flex flex-col gap-3.5 shadow-sm border border-sandal-100">
              {/* stars */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= r.rating ? "fill-sandal-400 text-sandal-400" : "fill-gray-100 text-gray-200"}
                  />
                ))}
              </div>
              {/* text */}
              <p className="font-body text-sm text-gray-700 leading-relaxed flex-1 italic">
                "{r.text}"
              </p>
              {/* author */}
              <div className="flex items-center gap-3 pt-3 border-t border-sandal-100/50">
                <div className="w-9 h-9 rounded-full bg-gray-800 text-sandal-100 flex items-center justify-center font-num text-sm font-bold shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-body text-sm font-bold text-gray-800 leading-none">
                    {r.name}
                  </p>
                  <p className="font-body text-xs text-sandal-500 font-semibold mt-1">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// NEWSLETTER CTA
// ══════════════════════════════════════════════════════════════════════
export function NewsletterCTA() {
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setStatus("error"); return; }
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="page-wrap py-12">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-sandal-200/10 rounded-3xl px-6 py-12 sm:px-12 flex flex-col sm:flex-row items-center gap-6 shadow-md">
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-white text-xl sm:text-2xl font-bold mb-2">
            Get fresh catch alerts & exclusive deals
          </h3>
          <p className="font-body text-sandal-300 text-sm font-medium">
            Subscribe to know when seasonal specials and new arrivals drop.
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="your@email.com"
              className="flex-1 sm:w-60 bg-white/5 border border-sandal-300/20 text-white placeholder:text-gray-500 rounded-xl px-4 py-3 text-sm font-body outline-none focus:border-sandal-400 focus:ring-2 focus:ring-sandal-500/10"
            />
            <button
              type="submit"
              className="bg-sandal-500 hover:bg-sandal-400 text-gray-950 font-body font-bold px-6 py-3 rounded-xl text-sm transition-all shrink-0 shadow-md cursor-pointer"
            >
              Subscribe
            </button>
          </form>
          {status === "success" && (
            <p className="font-body text-sandal-300 text-xs mt-2 text-center">✓ You're subscribed!</p>
          )}
          {status === "error" && (
            <p className="font-body text-red-400 text-xs mt-2 text-center">Please enter a valid email.</p>
          )}
        </div>
      </div>
    </section>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShoppingCart, Star, ShieldCheck, Truck, RefreshCcw,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { productApi, categoryApi, bannerApi } from "../ApiCall/Api.jsx";
import { useCartStore } from "../components/store/CartStore.jsx";
import { useWishlistStore } from "../components/store/WishlistStore.jsx";
import comboImg from "../assets/products/combo.jpg";

// default image from assets used everywhere
const PH_PRODUCT = comboImg;
const PH_BANNER  = comboImg;
const PH_CAT     = comboImg;

// premium royalty-free ocean/coastal loop video URL
const HERO_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-crashing-waves-of-the-ocean-close-up-12628-large.mp4";

// price formatter
const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

//  HERO BANNER SLIDER (with loop video background)
function HeroBanner({ banners }) {
  const [idx, setIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const slides = banners.length
    ? banners
    : [
        {
          title: "Authentic Dry Fish & Coastal Pickles",
          subtitle: "Sourced directly from Rameswaram fishermen — traditionally sun-dried, naturally preserved.",
          linkUrl: "/products"
        }
      ];

  const cur  = slides[idx];
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative h-[480px] bg-gray-950 overflow-hidden group select-none flex items-center justify-center"
    >
      {/* Loop video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-35 transition-opacity duration-700"
        src={cur.videoUrl || HERO_VIDEO_URL}
        poster={cur.imageUrl || PH_BANNER}
      />

      {/* dark charcoal vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/40" />

      {/* overlay content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        <p className="font-num text-sandal-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3.5">
          நம்ம ஊர் கருவாட்டு கடை
        </p>
        <h1 className="font-display text-white text-3xl sm:text-5xl font-extrabold leading-tight mb-5 drop-shadow-md">
          {cur.title}
        </h1>
        {cur.subtitle && (
          <p className="font-body text-sandal-100 text-sm sm:text-base mb-8 max-w-xl leading-relaxed drop-shadow">
            {cur.subtitle}
          </p>
        )}
        <Link to={cur.linkUrl || "/products"} className="btn-lg btn-primary bg-sandal-500 text-gray-950 hover:bg-sandal-400 border-none shadow-lg">
          Shop Now <ArrowRight size={16} />
        </Link>
      </div>

      {/* arrows — visible on hover */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
          >
            <ChevronRight size={20} />
          </button>

          {/* dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === idx ? "bg-sandal-400 w-6" : "bg-white/40 w-2.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

//  TRUST STRIP
function TrustStrip() {
  const items = [
    { icon: <Truck size={18} />,       label: "Free shipping above ₹499" },
    { icon: <ShieldCheck size={18} />, label: "100% natural & authentic" },
    { icon: <RefreshCcw size={18} />,  label: "Easy 7-day returns" },
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

//  CATEGORY SCROLL 
function CategoryScroll({ categories }) {
  if (!categories.length) return null;
  return (
    <section className="page-wrap pt-12 pb-4">
      <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">
        Shop by Category
      </h2>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

//  PRODUCT CARD (reusable inline fallback card to guarantee single template style)
import ProductCard from "../components/Product/ProductCard.jsx";

//  PRODUCT SKELETON
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

//  PRODUCT SECTION (reusable grid wrapper)
function ProductSection({ title, subtitle, viewAllTo, loading, products, emptyText }) {
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

//  PROMO BANNER
function PromoBanner() {
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

//  WHY US
// Redesigned to fit charcoal gray and sandal tones
function WhyUs() {
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

//  TESTIMONIALS
function Testimonials() {
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

//  NEWSLETTER CTA
function NewsletterCTA() {
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

//  HOME PAGE — fetch + compose
export default function Home() {
  const [banners,     setBanners]     = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [newest,      setNewest]      = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.allSettled([
      bannerApi.active(),
      categoryApi.list(),
      productApi.list("isBestseller=true&limit=8"),
      productApi.list("sort=newest&limit=8"),
    ]).then(([banRes, catRes, bestRes, newRes]) => {
      if (banRes.status  === "fulfilled") setBanners(banRes.value.banners         || []);
      if (catRes.status  === "fulfilled") setCategories(catRes.value.categories   || []);
      if (bestRes.status === "fulfilled") setBestsellers(bestRes.value.products   || []);
      if (newRes.status  === "fulfilled") setNewest(newRes.value.products         || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-sandal-50">

      {/* 1 – Hero */}
      <HeroBanner banners={banners} />

      {/* 3 – Categories */}
      <CategoryScroll categories={categories} />

      {/* 4 – Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Our most loved coastal delicacies"
        viewAllTo="/products?isBestseller=true"
        loading={loading}
        products={bestsellers}
        emptyText="No products yet — check back soon!"
      />

      {/*  Promo */}
      <PromoBanner />

      {/*  New Arrivals (hide if empty + not loading) */}
      {(loading || newest.length > 0) && (
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh from the docks, naturally dried"
          viewAllTo="/products?sort=newest"
          loading={loading}
          products={newest}
          emptyText=""
        />
      )}

      {/*  Why Us */}
      <WhyUs />

      {/*  Testimonials */}
      <Testimonials />

      {/*  Newsletter */}
      <NewsletterCTA />

    </div>
  );
}
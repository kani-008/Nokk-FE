import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {ArrowRight, ShoppingCart, Star,ShieldCheck, Truck, RefreshCcw,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { productApi, categoryApi, bannerApi } from "../ApiCall/Api.jsx";
import { useCartStore } from "../components/store/CartStore.jsx";
import { useWishlistStore } from "../components/store/WishlistStore.jsx";

// placeholder until real cloud URLs provided
const PH_PRODUCT = "https://placehold.co/400x400/92400e/fef3c7?text=🐟";
const PH_BANNER  = "https://placehold.co/1200x480/78350f/fef3c7?text=NammaOor";
const PH_CAT     = "https://placehold.co/200x200/92400e/fef3c7?text=🐟";

// price formatter
const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

//  HERO BANNER SLIDER
function HeroBanner({ banners }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  // Static fallback when API returns no banners yet
  const slides = banners.length
    ? banners
    : [{ title: "Authentic Dry Fish & Coastal Pickles", subtitle: "Sourced directly from Rameswaram fishermen — traditionally dried, naturally preserved.", imageUrl: null, linkUrl: "/products" }];

  const cur  = slides[idx];
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  return (
    <section className="relative bg-brand-900 overflow-hidden group select-none">
      {/* background image */}
      <img
        src={cur.imageUrl || PH_BANNER}
        alt={cur.title}
        className="w-full h-64 sm:h-[420px] object-cover opacity-30 transition-opacity duration-700"
        onError={(e) => { e.target.src = PH_BANNER; }}
      />

      {/* overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
        <p className="font-num text-amber-300 text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase mb-3">
          நம்ம ஊர் கருவாட்டு கடை
        </p>
        <h1 className="font-display text-white text-3xl sm:text-5xl font-bold leading-tight mb-4 max-w-2xl">
          {cur.title}
        </h1>
        {cur.subtitle && (
          <p className="font-body text-amber-200 text-sm sm:text-base mb-7 max-w-lg leading-relaxed">
            {cur.subtitle}
          </p>
        )}
        <Link to={cur.linkUrl || "/products"} className="btn-lg btn-primary">
          Shop Now <ArrowRight size={16} />
        </Link>
      </div>

      {/* arrows — visible on hover */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          {/* dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "bg-amber-400 w-5" : "bg-white/50 w-2"
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
    <div className="bg-white border-b border-amber-100">
      <div className="page-wrap py-3 grid grid-cols-3 gap-2 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center sm:text-left"
          >
            <span className="text-brand-700 shrink-0">{item.icon}</span>
            <span className="font-body text-xs sm:text-sm text-brand-800 font-medium leading-tight">
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
    <section className="page-wrap pt-10 pb-2">
      <h2 className="font-display text-xl font-bold text-brand-900 mb-5">
        Shop by Category
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-200 group-hover:border-brand-700 transition-colors duration-200 bg-brand-50">
              <img
                src={cat.imageUrl || PH_CAT}
                alt={cat.nameEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.src = PH_CAT; }}
              />
            </div>
            <span className="font-body text-[11px] sm:text-xs font-medium text-brand-800 text-center w-20 leading-tight">
              {cat.nameEn}
            </span>
            {cat.nameTa && (
              <span className="font-tamil text-[10px] text-amber-500 text-center w-20 leading-tight -mt-1">
                {cat.nameTa}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

//  PRODUCT CARD
function ProductCard({ product }) {
  const { addItem }              = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const price    = product.minPrice || 0;
  const compare  = product.minComparePrice > price ? product.minComparePrice : null;
  const disc     = compare ? Math.round(((compare - price) / compare) * 100) : 0;
  const image    = product.primaryImage || PH_PRODUCT;
  const firstV   = product.variants?.[0];

  const handleCart = (e) => {
    e.preventDefault();
    if (!firstV) return;
    addItem({
      variantId:   firstV.id,
      productId:   product.id,
      productName: product.nameEn,
      nameTa:      product.nameTa,
      image,
      price:       firstV.price,
      comparePrice: firstV.comparePrice,
      weight:      firstV.weightLabel,
    });
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="card-hover">
        {/* image */}
        <div className="relative aspect-square overflow-hidden bg-brand-50 rounded-t-2xl">
          <img
            src={image}
            alt={product.nameEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PH_PRODUCT; }}
          />
          {/* discount pill */}
          {disc > 0 && (
            <span className="absolute top-2 left-2 badge-red">-{disc}%</span>
          )}
          {/* bestseller / new */}
          {product.isBestseller && (
            <span className="absolute top-2 right-2 badge-amber">Best Seller</span>
          )}
          {product.isNew && !product.isBestseller && (
            <span className="absolute top-2 right-2 badge-green">New</span>
          )}
          {/* wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); toggle(product.id); }}
            aria-label="Toggle wishlist"
            className="absolute bottom-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-colors ${wishlisted ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-amber-400"}`} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* info */}
        <div className="p-3">
          <p className="font-body text-[10px] text-amber-500 uppercase tracking-wider font-medium mb-0.5">
            {product.categoryName}
          </p>
          <h3 className="font-body text-sm font-semibold text-brand-900 leading-snug line-clamp-2 mb-0.5">
            {product.nameEn}
          </h3>
          {product.nameTa && (
            <p className="font-tamil text-[11px] text-amber-400 mb-2 line-clamp-1">
              {product.nameTa}
            </p>
          )}

          {/* stars */}
          {product.avgRating > 0 && (
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={10}
                  className={s <= Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "text-amber-200"}
                />
              ))}
              <span className="font-num text-[10px] text-amber-500 ml-0.5">({product.reviewCount})</span>
            </div>
          )}

          {/* price + cart */}
          <div className="flex items-end justify-between gap-1">
            <div>
              <span className="font-num text-base font-bold text-brand-900">
                {rupee(price)}
              </span>
              {compare && (
                <span className="font-num text-xs text-amber-400 line-through ml-1.5">
                  {rupee(compare)}
                </span>
              )}
              {firstV?.weightLabel && (
                <p className="font-body text-[10px] text-amber-500 mt-0.5">{firstV.weightLabel}</p>
              )}
            </div>
            <button
              onClick={handleCart}
              aria-label="Add to cart"
              className="bg-brand-800 hover:bg-brand-900 text-white p-2 rounded-xl transition-colors shrink-0 active:scale-90"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

//  PRODUCT SKELETON
function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-2 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-7 w-7 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

//  PRODUCT SECTION (reusable grid wrapper)
function ProductSection({ title, subtitle, viewAllTo, loading, products, emptyText }) {
  return (
    <section className="page-wrap py-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-900">{title}</h2>
          {subtitle && (
            <p className="font-body text-xs text-amber-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          to={viewAllTo}
          className="font-body text-sm text-brand-700 font-medium flex items-center gap-1 hover:underline"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <p className="font-body text-amber-400 text-sm py-8 text-center">{emptyText}</p>
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
    <div className="page-wrap py-4">
      <div className="bg-gradient-to-r from-brand-800 to-brand-700 rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-num text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            Limited Time
          </p>
          <h3 className="font-display text-white font-bold text-xl leading-tight">
            Get 10% off on orders above ₹999
          </h3>
          <p className="font-body text-amber-200 text-sm mt-1">
            Use code{" "}
            <span className="font-num font-bold text-amber-300 tracking-widest">NAMMA10</span>
            {" "}at checkout
          </p>
        </div>
        <Link
          to="/products"
          className="shrink-0 bg-amber-400 hover:bg-amber-300 text-brand-900 font-body font-bold px-6 py-3 rounded-full text-sm transition-colors"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}

//  WHY US
function WhyUs() {
  const reasons = [
    {
      emoji: "🎣",
      title: "Direct from Fishermen",
      desc:  "We partner directly with Rameswaram fishing families — no middlemen, no markups.",
    },
    {
      emoji: "☀️",
      title: "Sun-Dried Naturally",
      desc:  "Traditional coastal drying process. Zero artificial preservatives or chemicals.",
    },
    {
      emoji: "📦",
      title: "Hygienic Packaging",
      desc:  "Airtight, odour-proof packing that preserves freshness for months.",
    },
  ];
  return (
    <section className="bg-brand-900 py-14 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-display text-2xl font-bold text-white mb-2">
          Why NammaOorKaruvattuKadai?
        </h2>
        <p className="font-body text-amber-300 text-sm mb-10">
          We don't just sell dry fish — we preserve a tradition.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {reasons.map((r) => (
            <div key={r.title} className="bg-brand-800 rounded-2xl p-6 text-left">
              <span className="text-3xl block mb-3">{r.emoji}</span>
              <h3 className="font-display text-white font-bold text-base mb-1.5">{r.title}</h3>
              <p className="font-body text-amber-300 text-sm leading-relaxed">{r.desc}</p>
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
    <section className="bg-brand-50 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">
            What Our Customers Say
          </h2>
          <p className="font-body text-sm text-amber-600">
            Real reviews from real karuvadu lovers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div key={r.name} className="card p-5 flex flex-col gap-3">
              {/* stars */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-amber-200"}
                  />
                ))}
              </div>
              {/* text */}
              <p className="font-body text-sm text-brand-800 leading-relaxed flex-1">
                "{r.text}"
              </p>
              {/* author */}
              <div className="flex items-center gap-3 pt-2 border-t border-amber-50">
                <div className="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center text-white font-num text-sm font-bold shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-brand-900 leading-none">
                    {r.name}
                  </p>
                  <p className="font-body text-xs text-amber-500 mt-0.5">{r.location}</p>
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
    // TODO: wire to /api/newsletter endpoint
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="page-wrap py-12">
      <div className="bg-gradient-to-br from-brand-900 to-brand-800 rounded-3xl px-6 py-10 sm:px-12 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-white text-xl sm:text-2xl font-bold mb-1.5">
            Get fresh catch alerts & exclusive deals
          </h3>
          <p className="font-body text-amber-300 text-sm">
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
              className="flex-1 sm:w-56 bg-white/10 border border-amber-600 text-white placeholder:text-amber-400 rounded-xl px-4 py-2.5 text-sm font-body outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-brand-900 font-body font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              Subscribe
            </button>
          </form>
          {status === "success" && (
            <p className="font-body text-green-300 text-xs mt-2 text-center">✓ You're subscribed!</p>
          )}
          {status === "error" && (
            <p className="font-body text-red-300 text-xs mt-2 text-center">Please enter a valid email.</p>
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
    <div className="min-h-screen">

      {/* 1 – Hero */}
      <HeroBanner banners={banners} />

      {/* 2 – Trust */}
      <TrustStrip />

      {/* 3 – Categories */}
      <CategoryScroll categories={categories} />

      {/* 4 – Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Our most loved products"
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
          subtitle="Fresh from the coast"
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
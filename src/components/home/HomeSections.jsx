import { Link } from "react-router-dom";
import { ArrowRight, Star, ShieldCheck, Truck, Volume2, VolumeX, Play } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ProductCard from "../Product/ProductCard.jsx";
import { useDeliverySettings } from "../../hookqueries/useHome.js";
import { usePublicCoupons } from "../../hookqueries/useCoupons";
import { useSubscribeNewsletter } from "../../hookqueries/useNewsletter";
import { useActiveCustomerVideos } from "../../hookqueries/useActiveCustomerVideos";

const PH_CAT = "";

// ══════════════════════════════════════════════════════════════════════
// TRUST STRIP
// ══════════════════════════════════════════════════════════════════════
export function TrustStrip() {
  const { data: delivery } = useDeliverySettings();
  const threshold = delivery?.freeShippingThreshold || 499;
  const items = [
    { icon: <Truck size={18} />, label: `Free shipping above ₹${threshold}` },
    { icon: <ShieldCheck size={18} />, label: "100% natural & authentic" },
    { icon: <ShieldCheck size={18} />, label: "Secure Payment Checkout" },
  ];
  return (
    <div className="bg-surface border-b border-sandal-100">
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
    <section className="page-wrap pt-12 pb-4 home-section-pad-fluid">
      <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 text-center sm:text-center home-sec-title-fluid">
        Shop by Category
      </h2>
      <div className="flex gap-4 sm:gap-6 home-cat-gap-fluid overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 home-cat-circle-fluid rounded-full overflow-hidden border-2 border-sandal-200 group-hover:border-gray-800 transition-all duration-300 bg-sandal-50 shadow-sm">
              <img
                src={cat.imageUrl || PH_CAT}
                alt={cat.nameEn}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => { e.target.src = PH_CAT; }}
              />
            </div>
            <span className="font-body text-xs font-bold text-gray-700 text-center w-20 sm:w-24 home-cat-label-fluid leading-tight group-hover:text-sandal-700 transition-colors">
              {cat.nameEn}
            </span>
            {cat.nameTa && (
              <span className="font-tamil text-[10px] font-semibold text-sandal-500 text-center w-20 sm:w-24 home-cat-label-fluid leading-tight -mt-0.5">
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
    <section className="page-wrap py-12 home-section-pad-fluid">
      <div className="flex items-end justify-between mb-6 border-b border-sandal-100 pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-800 home-sec-title-fluid">{title}</h2>
          {subtitle && (
            <p className="font-body text-xs text-sandal-600 mt-1 font-semibold home-sec-subtitle-fluid">{subtitle}</p>
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
  const { data: coupons = [], isLoading } = usePublicCoupons();

  if (isLoading) return null;
  const homepageCoupons = coupons.filter(c => c.showOnHomepage === true);
  if (!homepageCoupons.length) return null;

  const featured = homepageCoupons[0];

  let discountText = "";
  if (featured.discountType === "percentage") {
    discountText = `Get ${featured.discountValue}% off`;
  } else if (featured.discountType === "flat") {
    discountText = `Get ₹${featured.discountValue} off`;
  } else if (featured.discountType === "free_shipping") {
    discountText = "Get Free Shipping";
  }

  if (featured.minOrderValue > 0) {
    discountText += ` on orders above ₹${featured.minOrderValue}`;
  }

  return (
    <div className="page-wrap py-6">
      <div className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-800 border border-sandal-200/20 rounded-2xl p-6 sm:p-8 home-promo-pad-fluid flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <p className="font-num text-sandal-400 text-xs font-bold uppercase tracking-widest mb-1.5">
            Limited Time Deal
          </p>
          <h3 className="font-display text-white font-extrabold text-xl leading-tight home-promo-title-fluid">
            {discountText}
          </h3>
          <p className="font-body text-sandal-100/90 text-sm mt-1">
            Use code{" "}
            <span className="font-num font-bold text-sandal-300 tracking-widest bg-gray-850 px-2 py-0.5 rounded border border-gray-700">
              {featured.code}
            </span>{" "}
            at checkout
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
      desc: "We partner directly with coastal fishing families — no middleman, ensuring maximum freshness.",
    },
    {
      emoji: "☀️",
      title: "Sun-Dried Naturally",
      desc: "Traditional coastal sun-drying process under optimal hygienic standards. Zero chemicals.",
    },
    {
      emoji: "📦",
      title: "Hygienic Packaging",
      desc: "Premium multi-layer, odour-proof packaging that seals in coastal freshness for months.",
    },
  ];
  return (
    <section className="bg-gray-900 py-16 px-4 home-section-pad-fluid border-t border-b border-gray-850 my-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold text-white mb-3 home-sec-title-fluid">
          Why Namma Oor Karuvattu Kadai?
        </h2>
        <p className="font-body text-sandal-300/80 text-sm mb-12 max-w-md mx-auto home-sec-subtitle-fluid">
          We don't just sell dry fish — we preserve a tradition of purity.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div key={r.title} className="bg-gray-800/50 border border-gray-850 rounded-2xl p-6.5 home-card-pad-fluid text-left">
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
function VideoCard({ video }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const startPlaying = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
    v.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn("Autoplay failed:", err.message);
    });
  };

  const stopPlaying = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setIsPlaying(false);
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleCardTap = (e) => {
    if (e.target.closest(".mute-btn")) return;

    if (isPlaying) {
      stopPlaying();
    } else {
      const allVideos = document.querySelectorAll(".customer-video-player");
      allVideos.forEach((vid) => {
        if (vid !== videoRef.current) {
          vid.pause();
          vid.currentTime = 0;
          vid.dispatchEvent(new Event("stop-sibling-videos"));
        }
      });
      startPlaying();
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleStop = () => {
      setIsPlaying(false);
    };
    v.addEventListener("stop-sibling-videos", handleStop);
    return () => {
      v.removeEventListener("stop-sibling-videos", handleStop);
    };
  }, []);

  return (
    <div
      className="flex-shrink-0 w-64 rounded-2xl overflow-hidden bg-surface border border-sandal-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex flex-col snap-start"
      onMouseEnter={startPlaying}
      onMouseLeave={stopPlaying}
      onClick={handleCardTap}
    >
      {/* 9:16 Video Container */}
      <div className="relative w-full aspect-[9/16] bg-gray-950 overflow-hidden shrink-0">
        <video
          ref={videoRef}
          className="customer-video-player w-full h-full object-cover pointer-events-none animate-fade-in"
          src={video.videoUrl}
          poster={video.posterUrl || ""}
          preload="metadata"
          loop
          playsInline
          muted={isMuted}
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 group-hover:bg-black/20 transition-all duration-200">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        )}

        {isPlaying && (
          <button
            onClick={handleMuteToggle}
            className="mute-btn absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors shadow"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Info/Caption Card Footer (similar to Product Card details) */}
      <div className="p-4 bg-surface flex-1 flex flex-col justify-start border-t border-sandal-100/50">
        {video.customerName && (
          <h4 className="font-display text-sm font-bold text-gray-800 line-clamp-1 mb-1">
            {video.customerName}
          </h4>
        )}
        {video.caption && (
          <p className="font-body text-xs text-gray-500 line-clamp-3 leading-relaxed">
            "{video.caption}"
          </p>
        )}
      </div>
    </div>
  );
}

export function Testimonials() {
  const { data: videos, isLoading } = useActiveCustomerVideos();

  if (isLoading || !videos || videos.length === 0) {
    return null;
  }

  return (
    <section className="bg-sandal-50/50 py-16 px-4 home-section-pad-fluid">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-2 home-sec-title-fluid">
            Customer Testimonials
          </h2>
          <p className="font-body text-sm font-semibold text-sandal-600 home-sec-subtitle-fluid">
            Watch real video reels shared by our customers
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const subscribeMutation = useSubscribeNewsletter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email.");
      return;
    }
    setErrorMessage("");
    setStatus("idle");

    try {
      await subscribeMutation.mutateAsync(email);
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.response?.data?.message || "Something went wrong, please try again.");
    }
  };

  return (
    <section className="page-wrap py-12">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-sandal-200/10 rounded-3xl px-6 py-12 sm:px-12 home-nl-pad-fluid flex flex-col sm:flex-row items-center gap-6 shadow-md">
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-white text-xl sm:text-2xl font-bold mb-2 home-promo-title-fluid">
            Get fresh catch alerts & exclusive deals
          </h3>
          <p className="font-body text-sandal-300 text-sm font-medium home-sec-subtitle-fluid">
            Subscribe to know when seasonal specials and new arrivals drop.
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="your@email.com"
              className="w-full sm:w-60 bg-white/5 border border-sandal-300/20 text-white placeholder:text-gray-500 rounded-xl px-4 py-3 text-sm font-body outline-none focus:border-sandal-400 focus:ring-2 focus:ring-sandal-500/10"
            />
            <button
              type="submit"
              disabled={subscribeMutation.isPending}
              className="w-full sm:w-auto bg-sandal-500 hover:bg-sandal-400 text-gray-950 font-body font-bold px-6 py-3 rounded-xl text-sm transition-all shrink-0 shadow-md cursor-pointer disabled:opacity-50"
            >
              {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
          {status === "success" && (
            <p className="font-body text-sandal-300 text-xs mt-2 text-center">✓ You're subscribed!</p>
          )}
          {status === "error" && (
            <p className="font-body text-red-400 text-xs mt-2 text-center">{errorMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
}
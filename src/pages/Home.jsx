import { Helmet } from "react-helmet-async";
import HeroBanner from "../components/home/HeroBanner.jsx";
import {
  CategoryScroll,
  ProductSection,
  PromoBanner,
  WhyUs,
  Testimonials,
} from "../components/home/HomeSections.jsx";
import {
  useHomeBanners,
  useHomeCategories,
  useHomeBestsellers,
  useHomeNewArrivals,
} from "../hookqueries/useHome";
import { usePublicSettings } from "../hookqueries/useSettings";
import { useActiveCustomerVideos } from "../hookqueries/useActiveCustomerVideos";

// ══════════════════════════════════════════════════════════════════════
// HOME PAGE — fetch + compose
// All section markup now lives in components/Home/ (HeroBanner.jsx and
// HomeSections.jsx). This file is responsible only for fetching the
// page's data and arranging the sections in order.
// ══════════════════════════════════════════════════════════════════════
export default function Home() {
  const { data: banners = [], isLoading: bannersLoading } = useHomeBanners();
  const { data: categories = [], isLoading: categoriesLoading } = useHomeCategories();
  const { data: bestsellers = [], isLoading: bestsellersLoading } = useHomeBestsellers();
  const { data: newest = [], isLoading: newestLoading } = useHomeNewArrivals();

  const { data: settings = {} } = usePublicSettings();
  const { data: activeVideos = [] } = useActiveCustomerVideos();

  console.log("[Home] Public settings:", settings);
  console.log("[Home] Testimonials enabled setting:", settings.testimonialsEnabled);
  console.log("[Home] Active customer videos loaded:", activeVideos);

  const loading = bannersLoading || categoriesLoading || bestsellersLoading || newestLoading;

  const SITE_URL = "https://nammaoorkaruvattukadai.com";
  const title = "Buy Dry Fish Online — Karuvadu, Pickles & Seafood | Namma Oor Karuvattu Kadai";
  const description = "Shop authentic karuvadu (dry fish) — சுவை மிக்க கருவாடு — and traditional pickles online. Sourced directly from fishermen and delivered across Tamil Nadu.";

  // Dynamic social profiles from settings
  const sameAs = [
    settings.instagramUrl,
    settings.facebookUrl,
    settings.youtubeUrl,
    settings.twitterUrl,
  ].filter(Boolean);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Namma Oor Karuvattu Kadai",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    ...(sameAs.length > 0 && { "sameAs": sameAs }),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Cuddalore Old Town, Cuddalore",
      "addressRegion": "Tamil Nadu",
      "postalCode": "607003",
      "addressCountry": "IN"
    }
  };

  return (
    <div className="min-h-screen bg-sandal-50">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${SITE_URL}/og-home.jpg`} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      </Helmet>

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

      {/* Promo */}
      <PromoBanner />

      {/* New Arrivals (hide if empty + not loading) */}
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

      {/* Why Us */}
      <WhyUs />

      {/* Testimonials */}
      {(settings.testimonialsEnabled ?? true) && <Testimonials />}

    </div>
  );
}
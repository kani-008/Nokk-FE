import HeroBanner from "../components/home/HeroBanner.jsx";
import {
  CategoryScroll,
  ProductSection,
  PromoBanner,
  WhyUs,
  Testimonials,
  NewsletterCTA,
} from "../components/home/HomeSections.jsx";
import {
  useHomeBanners,
  useHomeCategories,
  useHomeBestsellers,
  useHomeNewArrivals,
} from "../hookqueries/useHome";

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

  const loading = bannersLoading || categoriesLoading || bestsellersLoading || newestLoading;

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
      <Testimonials />

      {/* Newsletter */}
      <NewsletterCTA />

    </div>
  );
}
import { useState, useEffect } from "react";
import { productApi, categoryApi, bannerApi } from "../ApiCall/Api.jsx";
import HeroBanner from "../components/home/HeroBanner.jsx";
import {
  CategoryScroll,
  ProductSection,
  PromoBanner,
  WhyUs,
  Testimonials,
  NewsletterCTA,
} from "../components/home/HomeSections.jsx";

// ══════════════════════════════════════════════════════════════════════
// HOME PAGE — fetch + compose
// All section markup now lives in components/Home/ (HeroBanner.jsx and
// HomeSections.jsx). This file is responsible only for fetching the
// page's data and arranging the sections in order.
// ══════════════════════════════════════════════════════════════════════
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
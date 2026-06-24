import { useState, useEffect } from "react";
import API from "../ApiCall/Api.jsx";
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
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await API.get("/banners/get-banners");
        setBanners(response.data.banners || []);
      } catch (err) {
        console.error("Failed to load banners:", err);
      }

      try {
        const catRes = await API.get("/categories/get-all");
        setCategories(catRes.data.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }

      try {
        const bestRes = await API.get("/products/get-all?isBestseller=true&limit=8");
        setBestsellers(bestRes.data.products || []);
      } catch (err) {
        console.error("Failed to load bestsellers:", err);
      }

      try {
        const newRes = await API.get("/products/get-all?sort=newest&limit=8");
        setNewest(newRes.data.products || []);
      } catch (err) {
        console.error("Failed to load new arrivals:", err);
      }
      setLoading(false);
    };
    fetchData();
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
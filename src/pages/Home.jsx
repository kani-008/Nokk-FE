import { useState, useEffect } from "react";
import productsDb from "../assets/products.json";
import categoriesDb from "../assets/categories.json";
import comboImg from "../assets/products/combo.jpg";
import { apiFetch, API_URL } from "../ApiCall/Api.jsx";

const mapProductImages = (p) => ({
  ...p,
  primaryImage: comboImg,
  images: [
    { id: "img-1", imageUrl: comboImg, sortOrder: 1, isPrimary: true }
  ]
});

const mapCategoryImage = (c) => ({
  ...c,
  imageUrl: comboImg
});

const getLocalStorage = (key, initialData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialData;
  }
};

const getProducts = () => getLocalStorage("nok-mock-products-v3", productsDb).map(mapProductImages);
const getCategories = () => getLocalStorage("nok-mock-categories", categoriesDb).map(mapCategoryImage);
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const bannerApi = {
  active: () => apiFetch(`${API_URL}/banners/get-banners`),
};

const categoryApi = {
  list: async () => {
    await delay();
    return { success: true, categories: getCategories() };
  }
};

const productApi = {
  list: async (params = "") => {
    await delay();
    const products = getProducts();
    const urlParams = new URLSearchParams(params);

    const sort         = urlParams.get("sort") || "popular";
    const isBestseller = urlParams.get("isBestseller") === "true";
    const limit          = parseInt(urlParams.get("limit") || "8");

    let filtered = products;

    if (isBestseller) {
      filtered = filtered.filter(p => p.isBestseller);
    }

    if (sort === "newest") {
      filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id));
    }

    return {
      success: true,
      products: filtered.slice(0, limit)
    };
  }
};
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
      console.log("[Home] bannerApi result:", banRes.status, banRes.status === "fulfilled" ? banRes.value : banRes.reason);
      if (banRes.status === "fulfilled") {
        console.log("[Home] banners received:", banRes.value.banners);
        setBanners(banRes.value.banners || []);
      } else {
        console.error("[Home] bannerApi failed:", banRes.reason);
      }
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
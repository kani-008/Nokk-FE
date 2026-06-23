import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp, Search,
  Star, ArrowUpDown,
} from "lucide-react";
import { apiFetch } from "../ApiCall/Api";

const productApi = {
  list: async (params = "") => {
    const res = await apiFetch(`/products/get-all?limit=999`);
    const products = res.products || [];
    const urlParams = new URLSearchParams(params);

    const search       = urlParams.get("search") || "";
    const category     = urlParams.get("category") || "";
    const sort         = urlParams.get("sort") || "popular";
    const inStock      = urlParams.get("inStock") === "true";
    const isBestseller = urlParams.get("isBestseller") === "true";
    const isNew        = urlParams.get("isNew") === "true";
    const minPrice     = urlParams.get("minPrice") ? parseFloat(urlParams.get("minPrice")) : null;
    const maxPrice      = urlParams.get("maxPrice") ? parseFloat(urlParams.get("maxPrice")) : null;
    const minRating     = urlParams.get("rating") ? parseFloat(urlParams.get("rating")) : null;
    const weights        = (urlParams.get("weight") || "").split(",").filter(Boolean);
    const hasOffer       = urlParams.get("hasOffer") === "true";
    const idsVal         = urlParams.get("ids");
    const page          = parseInt(urlParams.get("page") || "1");
    const limit          = parseInt(urlParams.get("limit") || "12");

    const minVariantPrice = (p) =>
      p.variants && p.variants.length ? Math.min(...p.variants.map(v => v.price)) : (p.minPrice || 0);

    let filtered = products;

    if (idsVal) {
      const idList = idsVal.split(",");
      filtered = filtered.filter(p => idList.includes(p.id));
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        p => p.nameEn.toLowerCase().includes(q) ||
             (p.nameTa && p.nameTa.toLowerCase().includes(q)) ||
             p.description.toLowerCase().includes(q)
      );
    }

    if (category) {
      filtered = filtered.filter(p => p.categorySlug === category);
    }

    if (isBestseller) {
      filtered = filtered.filter(p => p.isBestseller);
    }

    if (isNew) {
      filtered = filtered.filter(p => p.isNew);
    }

    if (inStock) {
      filtered = filtered.filter(p => p.variants && p.variants.some(v => v.stockQty > 0));
    }

    if (minPrice !== null) {
      filtered = filtered.filter(p => minVariantPrice(p) >= minPrice);
    }
    if (maxPrice !== null) {
      filtered = filtered.filter(p => minVariantPrice(p) <= maxPrice);
    }

    if (minRating !== null) {
      filtered = filtered.filter(p => (p.avgRating || 0) >= minRating);
    }

    if (weights.length > 0) {
      filtered = filtered.filter(p =>
        p.variants && p.variants.some(v => weights.includes(v.weightLabel))
      );
    }

    if (hasOffer) {
      filtered = filtered.filter(p =>
        p.variants && p.variants.some(v => v.comparePrice && v.comparePrice > v.price)
      );
    }

    if (sort === "newest") {
      filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id));
    } else if (sort === "price-low-high") {
      filtered = [...filtered].sort((a, b) => minVariantPrice(a) - minVariantPrice(b));
    } else if (sort === "price-high-low") {
      filtered = [...filtered].sort((a, b) => minVariantPrice(b) - minVariantPrice(a));
    } else if (sort === "popularity" || sort === "popular") {
      filtered = [...filtered].sort((a, b) =>
        (b.reviewCount || 0) - (a.reviewCount || 0) || (b.avgRating || 0) - (a.avgRating || 0)
      );
    } else if (sort === "relevance") {
      if (search) {
        const q = search.toLowerCase();
        const score = (p) => {
          const name = p.nameEn.toLowerCase();
          if (name === q) return 3;
          if (name.startsWith(q)) return 2;
          if (name.includes(q)) return 1;
          return 0;
        };
        filtered = [...filtered].sort((a, b) => score(b) - score(a));
      } else {
        filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id));
      }
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      success: true,
      products: paginated,
      pagination: { total, page, limit, totalPages }
    };
  }
};

const categoryApi = {
  list: async () => {
    const res = await apiFetch(`/categories/get-all`);
    return res;
  }
};
import ProductCard from "../components/Product/ProductCard";

// ── sort options — value must match the productApi.list() `sort` contract ──
const SORT_OPTIONS = [
  { value: "popular", label: "Popularity" },
  { value: "newest", label: "Newest First" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
];



// ── skeleton card ──────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-2 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── filter section (collapsible on mobile and desktop alike) ──────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-sandal-100 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        type="button"
        className="w-full flex items-center justify-between mb-3 font-body text-sm font-bold text-brand-900"
        onClick={() => setOpen((s) => !s)}
      >
        {title}
        {open ? <ChevronUp size={15} className="text-amber-400" /> : <ChevronDown size={15} className="text-amber-400" />}
      </button>
      {open && children}
    </div>
  );
}

// ── active filter pill ─────────────────────────────────────────────────
function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 font-body text-xs bg-amber-100 text-brand-800 px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors" aria-label="Remove filter">
        <X size={11} />
      </button>
    </span>
  );
}

// ── star rating filter row ─────────────────────────────────────────────
function RatingRow({ value, checked, onChange }) {
  return (
    <label className="filter-row group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="filter-checkbox"
      />
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            className={s <= value ? "fill-sandal-400 text-sandal-400" : "fill-gray-100 text-gray-300"}
          />
        ))}
      </span>
      <span className="filter-row-label">&amp; above</span>
    </label>
  );
}

// ── sidebar ───────────────────────────────────────────────────────
function Sidebar({
  hasFilters,
  removeAllFilters,
  category,
  setParam,
  categories,
  priceDraft,
  setPriceDraft,
  applyPriceRange,
  rating,
  allWeightLabels,
  weights,
  toggleListParam,
  inStock,
  hasOffer,
  isBest,
  isNew,
}) {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="card p-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body text-sm font-bold text-brand-900">Filters</h3>
          {hasFilters && (
            <button
              onClick={removeAllFilters}
              className="font-body text-[11px] text-red-500 hover:text-red-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Categories */}
        <FilterSection title="Category">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setParam("category", "")}
                className={`w-full text-left font-body text-sm px-2 py-1.5 rounded-lg transition-colors ${!category ? "bg-brand-800 text-white" : "text-amber-800 hover:bg-amber-50"
                  }`}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setParam("category", cat.slug)}
                  className={`w-full text-left font-body text-sm px-2 py-1.5 rounded-lg transition-colors ${category === cat.slug ? "bg-brand-800 text-white" : "text-amber-800 hover:bg-amber-50"
                    }`}
                >
                  {cat.nameEn}
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>

        {/* Price range */}
        <FilterSection title="Price Range">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Min"
              value={priceDraft.min}
              onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
              className="field-input py-1.5 text-xs px-2.5"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Max"
              value={priceDraft.max}
              onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
              className="field-input py-1.5 text-xs px-2.5"
            />
          </div>
          <button
            onClick={applyPriceRange}
            className="btn-sm btn-outline w-full"
          >
            Apply
          </button>
        </FilterSection>

        {/* Customer rating */}
        <FilterSection title="Customer Rating">
          <div className="space-y-1.5">
            {[4, 3, 2, 1].map((r) => (
              <RatingRow
                key={r}
                value={r}
                checked={rating === String(r)}
                onChange={() => setParam("rating", rating === String(r) ? "" : String(r))}
              />
            ))}
          </div>
        </FilterSection>

        {/* Pack size / quantity */}
        {allWeightLabels.length > 0 && (
          <FilterSection title="Pack Size">
            <div className="space-y-1.5">
              {allWeightLabels.map((w) => (
                <label key={w} className="filter-row group">
                  <input
                    type="checkbox"
                    checked={weights.includes(w)}
                    onChange={() => toggleListParam("weight", weights, w)}
                    className="filter-checkbox"
                  />
                  <span className="filter-row-label">{w}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Availability & offers */}
        <FilterSection title="Availability & Offers" defaultOpen={true}>
          <div className="space-y-1.5">
            <label className="filter-row group">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setParam("inStock", e.target.checked ? "true" : "")}
                className="filter-checkbox"
              />
              <span className="filter-row-label">In Stock Only</span>
            </label>
            <label className="filter-row group">
              <input
                type="checkbox"
                checked={hasOffer}
                onChange={(e) => setParam("hasOffer", e.target.checked ? "true" : "")}
                className="filter-checkbox"
              />
              <span className="filter-row-label">On Offer</span>
            </label>
            <label className="filter-row group">
              <input
                type="checkbox"
                checked={isBest}
                onChange={(e) => setParam("isBestseller", e.target.checked ? "true" : "")}
                className="filter-checkbox"
              />
              <span className="filter-row-label">Best Sellers</span>
            </label>
            <label className="filter-row group">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setParam("isNew", e.target.checked ? "true" : "")}
                className="filter-checkbox"
              />
              <span className="filter-row-label">New Arrivals</span>
            </label>
          </div>
        </FilterSection>

      </div>
    </aside>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // read from URL
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "popular";
  const inStock = searchParams.get("inStock") === "true";
  const isBest = searchParams.get("isBestseller") === "true";
  const isNew = searchParams.get("isNew") === "true";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const rating = searchParams.get("rating") || "";
  const weightParam = searchParams.get("weight") || "";
  const hasOffer = searchParams.get("hasOffer") === "true";
  const page = parseInt(searchParams.get("page") || "1");

  // memoized so its identity is stable across renders unless weightParam actually changes —
  // otherwise buildQuery's useCallback would never memoize and re-fetch on every render
  const weights = useMemo(
    () => weightParam.split(",").filter(Boolean),
    [weightParam]
  );

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });

  const sortRef = useRef(null);

  // close the mobile sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // keep the price draft inputs synced if filters are cleared elsewhere (e.g. "Clear all")
  useEffect(() => {
    const timer = setTimeout(() => {
      setPriceDraft({ min: minPrice, max: maxPrice });
    }, 0);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  // ── build query string from URL state ────────────────────────────
  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (category) p.set("category", category);
    if (sort) p.set("sort", sort);
    if (inStock) p.set("inStock", "true");
    if (isBest) p.set("isBestseller", "true");
    if (isNew) p.set("isNew", "true");
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (rating) p.set("rating", rating);
    if (weights.length) p.set("weight", weights.join(","));
    if (hasOffer) p.set("hasOffer", "true");
    p.set("page", String(page));
    p.set("limit", "12");
    return p.toString();
  }, [search, category, sort, inStock, isBest, isNew, minPrice, maxPrice, rating, weights, hasOffer, page]);

  // ── set a single URL param ────────────────────────────────────────
  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page"); // reset to page 1 on any filter change
    setSearchParams(p);
  };

  // ── toggle a value inside a comma-separated multi-select param ────
  const toggleListParam = (key, currentList, value) => {
    const next = currentList.includes(value)
      ? currentList.filter((v) => v !== value)
      : [...currentList, value];
    setParam(key, next.join(","));
  };

  const applyPriceRange = () => {
    const p = new URLSearchParams(searchParams);
    if (priceDraft.min) p.set("minPrice", priceDraft.min); else p.delete("minPrice");
    if (priceDraft.max) p.set("maxPrice", priceDraft.max); else p.delete("maxPrice");
    p.delete("page");
    setSearchParams(p);
  };

  const removeAllFilters = () => {
    setSearchParams({});
    setSearchInput("");
    setPriceDraft({ min: "", max: "" });
  };

  // ── fetch categories once ─────────────────────────────────────────
  useEffect(() => {
    categoryApi.list()
      .then((r) => setCategories(r.categories || []))
      .catch(() => { });
  }, []);

  // ── fetch products whenever filters change ────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
    }, 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    productApi.list(buildQuery())
      .then((r) => {
        setProducts(r.products || []);
        setPagination(r.pagination || null);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, [buildQuery]);

  // ── distinct pack sizes available, derived from current result set ─
  // (kept stable across paginated fetches by deriving from the full mock
  //  product catalogue once, rather than just the current page's products)
  const [allWeightLabels, setAllWeightLabels] = useState([]);
  useEffect(() => {
    productApi.list("limit=999")
      .then((r) => {
        const labels = new Set();
        (r.products || []).forEach((p) => p.variants.forEach((v) => labels.add(v.weightLabel)));
        setAllWeightLabels([...labels]);
      })
      .catch(() => { });
  }, []);

  // ── active filters for pill display ──────────────────────────────
  const activeFilters = [
    search && { key: "search", label: `"${search}"` },
    category && { key: "category", label: categories.find((c) => c.slug === category)?.nameEn || category },
    inStock && { key: "inStock", label: "In Stock" },
    isBest && { key: "isBestseller", label: "Best Sellers" },
    isNew && { key: "isNew", label: "New Arrivals" },
    (minPrice || maxPrice) && { key: "price", label: `₹${minPrice || 0} – ₹${maxPrice || "∞"}`, custom: () => { setParam("minPrice", ""); setParam("maxPrice", ""); } },
    rating && { key: "rating", label: `${rating}★ & above` },
    hasOffer && { key: "hasOffer", label: "Has Offer" },
    ...weights.map((w) => ({ key: `weight:${w}`, label: w, custom: () => toggleListParam("weight", weights, w) })),
  ].filter(Boolean);

  const hasFilters = activeFilters.length > 0 || sort !== "popular";

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || "Popularity";

  const sidebarProps = {
    hasFilters,
    removeAllFilters,
    category,
    setParam,
    categories,
    priceDraft,
    setPriceDraft,
    applyPriceRange,
    rating,
    allWeightLabels,
    weights,
    toggleListParam,
    inStock,
    hasOffer,
    isBest,
    isNew,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      {/* <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-brand-900">
          {category
            ? (categories.find((c) => c.slug === category)?.nameEn || "Products")
            : search
            ? `Results for "${search}"`
            : "All Products"}
        </h1>
        {pagination && (
          <p className="font-body text-sm text-amber-500 mt-0.5">
            {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
          </p>
        )}
      </div> */}

      {/* ── Top toolbar: search + sort + filter button ─────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center justify-between bg-white p-3 rounded-2xl border border-sandal-100 shadow-sm">

        {/* inline search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setParam("search", searchInput); }}
          className="flex-1 min-w-[200px]"
        >
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sandal-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              className="field-input pl-9 pr-4 py-2 text-sm w-full bg-sandal-50/10 focus:bg-white"
            />
          </div>
        </form>

        {/* controls group */}
        <div className="flex items-center gap-2.5">
          {/* sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((s) => !s)}
              className="btn-md btn-outline flex items-center gap-1.5 whitespace-nowrap text-sm cursor-pointer"
            >
              <ArrowUpDown size={14} className="text-sandal-500" />
              <span>Sort: {currentSortLabel}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-sandal-100 rounded-xl shadow-lg overflow-hidden z-35 min-w-[170px]">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { setParam("sort", o.value === "popular" ? "" : o.value); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 font-body text-sm transition-colors cursor-pointer ${sort === o.value ? "bg-sandal-100 text-sandal-800 font-bold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* filter button */}
          <button
            type="button"
            onClick={() => {
              setFilterOpen((s) => !s);
              setDesktopSidebarOpen((s) => !s);
            }}
            className="btn-md btn-outline flex items-center gap-1.5 whitespace-nowrap text-sm cursor-pointer"
          >
            <SlidersHorizontal size={14} className="text-sandal-500" />
            <span>Filter</span>
            {activeFilters.length > 0 && (
              <span className="bg-sandal-400 text-gray-900 font-num text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Active filter pills ───────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              onRemove={f.custom || (() => setParam(f.key, ""))}
            />
          ))}
        </div>
      )}

      <div className="flex gap-6">

        {/* ── Desktop sidebar ──────────────────────────────────────── */}
        {desktopSidebarOpen && (
          <div className="hidden md:block">
            <Sidebar {...sidebarProps} />
          </div>
        )}

        {/* ── Mobile filter drawer ──────────────────────────────────── */}
        {filterOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
            <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-body font-bold text-brand-900">Filters</span>
                <button onClick={() => setFilterOpen(false)} className="text-amber-500 hover:text-brand-900">
                  <X size={20} />
                </button>
              </div>
              <Sidebar {...sidebarProps} />
            </div>
          </div>
        )}

        {/* ── Product grid ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {loading ? (
            <div className="product-grid-compact">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>

          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">🐟</span>
              <h3 className="font-display text-lg font-bold text-brand-900 mb-2">No products found</h3>
              <p className="font-body text-sm text-amber-500 mb-5">Try different filters or search terms.</p>
              <button onClick={removeAllFilters} className="btn-md btn-primary">
                Clear Filters
              </button>
            </div>

          ) : (
            <>
              <div className="product-grid-compact">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam("page", String(page - 1))}
                    className="btn-sm btn-outline disabled:opacity-40"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === pagination.totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "…" ? (
                        <span key={`ellipsis-${i}`} className="font-num text-amber-400 px-1">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setParam("page", String(n))}
                          className={`btn-sm ${n === page ? "btn-primary" : "btn-outline"}`}
                        >
                          {n}
                        </button>
                      )
                    )}

                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setParam("page", String(page + 1))}
                    className="btn-sm btn-outline disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
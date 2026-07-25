import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../components/seo/SEO.jsx";
import { buildBreadcrumbSchema } from "../utils/seo.js";
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp,
  Star, ArrowLeft, ArrowUpDown, Check
} from "lucide-react";
import { useProductCategories, useWeightLabels, useProductList } from "../hookqueries/useProducts";
import { useActiveCombos } from "../hookqueries/useCombos";
import ProductCard from "../components/Product/ProductCard";


// ── sort options — must match the backend getAllProducts sortMap keys ──
const SORT_OPTIONS = [
  { value: "popular", label: "Popularity" },
  { value: "newest", label: "Newest First" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
];

const PRICE_RANGES = [
  { id: "under150", label: "Under ₹150", min: "", max: "150" },
  { id: "150-300", label: "₹150 - ₹300", min: "150", max: "300" },
  { id: "300-500", label: "₹300 - ₹500", min: "300", max: "500" },
  { id: "over500", label: "Over ₹500", min: "500", max: "" },
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

// ── filter section (collapsible on desktop sidebar) ───────────────────
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
    <span className="inline-flex items-center gap-1 font-body text-xs bg-amber-100 text-brand-800 px-2.5 py-1 rounded-full border border-amber-200/80 shrink-0">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5" aria-label="Remove filter">
        <X size={11} />
      </button>
    </span>
  );
}

// ── star rating filter row ─────────────────────────────────────────────
function RatingRow({ value, checked, onChange }) {
  return (
    <label className="filter-row group cursor-pointer">
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

// ── Sort Bottom Sheet Modal (Image 1 style) ───────────────────────────
function SortBottomSheetModal({ open, onClose, sort, setParam }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative bg-surface rounded-t-2xl shadow-2xl p-4 w-full z-10 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-sandal-100 pb-3 mb-2">
          <span className="font-body text-xs font-bold text-gray-500 uppercase tracking-wider">
            Sort By
          </span>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1 py-1">
          {SORT_OPTIONS.map((o) => {
            const isSelected = sort === o.value || (sort === "popular" && o.value === "popular");
            return (
              <label
                key={o.value}
                onClick={() => {
                  setParam("sort", o.value === "popular" ? "" : o.value);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer hover:bg-sandal-50 transition-colors"
              >
                <span className={`font-body text-sm ${isSelected ? "font-bold text-brand-900" : "text-gray-700"}`}>
                  {o.label}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? "border-brand-800 bg-brand-800" : "border-gray-300"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mobile 2-Column Filter Page / Drawer (Image 2 style) ──────────────
function MobileFilterDrawer({
  open,
  onClose,
  hasFilters,
  removeAllFilters,
  totalCount,
  category,
  categories,
  minPrice,
  maxPrice,
  priceRanges,
  rating,
  allWeightLabels,
  weights,
  toggleListParam,
  setParam,
  inStock,
  hasOffer,
  isBest,
  isNew,
}) {
  const [activeTab, setActiveTab] = useState("category");

  if (!open) return null;

  // Counts per tab section
  const categoryCount = category ? 1 : 0;
  const priceCount = priceRanges.length || (minPrice || maxPrice ? 1 : 0);
  const weightCount = weights.length;
  const ratingCount = rating ? 1 : 0;
  const availabilityCount = (inStock ? 1 : 0) + (hasOffer ? 1 : 0) + (isBest ? 1 : 0) + (isNew ? 1 : 0);

  const tabs = [
    { id: "category", label: "Category", count: categoryCount },
    { id: "price", label: "Price Range", count: priceCount },
    { id: "weight", label: "Quantity", count: weightCount },
    { id: "rating", label: "Rating", count: ratingCount },
    { id: "availability", label: "Offers & Stock", count: availabilityCount },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-sandal-100 bg-surface shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2.5 font-body text-base font-bold text-brand-900"
        >
          <ArrowLeft size={20} className="text-brand-900" />
          <span>Filters</span>
        </button>

        {hasFilters && (
          <button
            onClick={removeAllFilters}
            className="font-body text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column — Section Tabs */}
        <div className="w-2/5 max-w-[150px] bg-sandal-50/70 border-r border-sandal-100 overflow-y-auto shrink-0">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center justify-between px-3 py-4 text-left font-body text-xs sm:text-sm font-semibold transition-all relative ${
                  isActive
                    ? "bg-surface text-brand-900 border-l-4 border-brand-800"
                    : "text-amber-950/70 hover:bg-sandal-100/50"
                }`}
              >
                <span className="truncate">{t.label}</span>
                {t.count > 0 && (
                  <span className="ml-1 text-[10px] font-bold bg-brand-800 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column — Tab Options */}
        <div className="flex-1 bg-surface p-4 overflow-y-auto">
          {activeTab === "category" && (
            <div className="space-y-1">
              <button
                onClick={() => setParam("category", "")}
                className={`w-full text-left font-body text-sm px-3 py-2.5 rounded-xl transition-colors ${
                  !category ? "bg-brand-800 text-white font-bold" : "text-brand-900 hover:bg-sandal-50"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setParam("category", cat.slug)}
                  className={`w-full text-left font-body text-sm px-3 py-2.5 rounded-xl transition-colors ${
                    category === cat.slug ? "bg-brand-800 text-white font-bold" : "text-brand-900 hover:bg-sandal-50"
                  }`}
                >
                  {cat.nameEn}
                </button>
              ))}
            </div>
          )}

          {activeTab === "price" && (
            <div className="space-y-3">
              {PRICE_RANGES.map((r) => {
                const isSelected = priceRanges.includes(r.id) || (minPrice === r.min && maxPrice === r.max);
                return (
                  <label key={r.id} className="filter-row group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleListParam("priceRange", priceRanges, r.id)}
                      className="filter-checkbox"
                    />
                    <span className="filter-row-label">{r.label}</span>
                  </label>
                );
              })}
            </div>
          )}

          {activeTab === "weight" && (
            <div className="space-y-3">
              {allWeightLabels.map((w) => (
                <label key={w} className="filter-row group cursor-pointer">
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
          )}

          {activeTab === "rating" && (
            <div className="space-y-3">
              {[4, 3, 2, 1].map((r) => (
                <RatingRow
                  key={r}
                  value={r}
                  checked={rating === String(r)}
                  onChange={() => setParam("rating", rating === String(r) ? "" : String(r))}
                />
              ))}
            </div>
          )}

          {activeTab === "availability" && (
            <div className="space-y-3">
              <label className="filter-row group cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setParam("inStock", e.target.checked ? "true" : "")}
                  className="filter-checkbox"
                />
                <span className="filter-row-label">In Stock Only</span>
              </label>
              <label className="filter-row group cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOffer}
                  onChange={(e) => setParam("hasOffer", e.target.checked ? "true" : "")}
                  className="filter-checkbox"
                />
                <span className="filter-row-label">On Offer</span>
              </label>
              <label className="filter-row group cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBest}
                  onChange={(e) => setParam("isBestseller", e.target.checked ? "true" : "")}
                  className="filter-checkbox"
                />
                <span className="filter-row-label">Best Sellers</span>
              </label>
              <label className="filter-row group cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setParam("isNew", e.target.checked ? "true" : "")}
                  className="filter-checkbox"
                />
                <span className="filter-row-label">New Arrivals</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-sandal-100 bg-surface shrink-0">
        <span className="font-body text-xs font-semibold text-amber-800">
          {totalCount} products found
        </span>
        <button
          onClick={onClose}
          className="btn-md btn-primary px-8 py-2.5 rounded-xl font-bold"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ── desktop sidebar ───────────────────────────────────────────────────────
function Sidebar({
  hasFilters,
  removeAllFilters,
  sort,
  setParam,
  category,
  categories,
  minPrice,
  maxPrice,
  priceRanges,
  rating,
  allWeightLabels,
  weights,
  toggleListParam,
  inStock,
  hasOffer,
  isBest,
  isNew,
}) {
  const isCombosView = category === "combos" || category?.toLowerCase() === "combos";
  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="card p-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body text-sm font-bold text-brand-900">Filters</h3>
          {hasFilters && !isCombosView && (
            <button
              onClick={removeAllFilters}
              className="font-body text-[11px] text-red-500 hover:text-red-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Sort By — replaces the removed top-bar sort dropdown */}
        <FilterSection title="Sort By">
          <div className="space-y-1.5">
            {(isCombosView
              ? SORT_OPTIONS.filter((o) => ["popular", "newest"].includes(o.value))
              : SORT_OPTIONS
            ).map((o) => (
              <label key={o.value} className="filter-row group cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === o.value}
                  onChange={() => setParam("sort", o.value === "popular" ? "" : o.value)}
                  className="filter-checkbox"
                />
                <span className="filter-row-label">{o.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {!isCombosView && (
          <>
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
              <div className="space-y-1.5">
                {PRICE_RANGES.map((r) => {
                  const isSelected = priceRanges.includes(r.id) || (minPrice === r.min && maxPrice === r.max);
                  return (
                    <label key={r.id} className="filter-row group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleListParam("priceRange", priceRanges, r.id)}
                        className="filter-checkbox"
                      />
                      <span className="filter-row-label">{r.label}</span>
                    </label>
                  );
                })}
              </div>
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
              <FilterSection title="Quantity">
                <div className="space-y-1.5">
                  {allWeightLabels.map((w) => (
                    <label key={w} className="filter-row group cursor-pointer">
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
            <FilterSection title="Availability &amp; Offers" defaultOpen={true}>
              <div className="space-y-1.5">
                <label className="filter-row group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setParam("inStock", e.target.checked ? "true" : "")}
                    className="filter-checkbox"
                  />
                  <span className="filter-row-label">In Stock Only</span>
                </label>
                <label className="filter-row group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOffer}
                    onChange={(e) => setParam("hasOffer", e.target.checked ? "true" : "")}
                    className="filter-checkbox"
                  />
                  <span className="filter-row-label">On Offer</span>
                </label>
                <label className="filter-row group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBest}
                    onChange={(e) => setParam("isBestseller", e.target.checked ? "true" : "")}
                    className="filter-checkbox"
                  />
                  <span className="filter-row-label">Best Sellers</span>
                </label>
                <label className="filter-row group cursor-pointer">
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
          </>
        )}

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
  const priceRangeParam = searchParams.get("priceRange") || "";
  const rating = searchParams.get("rating") || "";
  const weightParam = searchParams.get("weight") || "";
  const hasOffer = searchParams.get("hasOffer") === "true";
  const page = parseInt(searchParams.get("page") || "1");

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [desktopSidebarOpen] = useState(true);

  const priceRanges = useMemo(
    () => priceRangeParam.split(",").filter(Boolean),
    [priceRangeParam]
  );

  // memoized so its identity is stable across renders unless weightParam actually changes —
  // otherwise buildQuery's useCallback would never memoize and re-fetch on every render
  const weights = useMemo(
    () => weightParam.split(",").filter(Boolean),
    [weightParam]
  );

  const queryParams = useMemo(() => {
    const p = {};
    if (search) p.search = search;
    if (category) p.category = category;
    if (sort) p.sort = sort;
    if (inStock) p.inStock = "true";
    if (isBest) p.isBestseller = "true";
    if (isNew) p.isNew = "true";
    if (priceRanges.length) {
      p.priceRange = priceRanges.join(",");
    } else {
      if (minPrice) p.minPrice = minPrice;
      if (maxPrice) p.maxPrice = maxPrice;
    }
    if (rating) p.rating = rating;
    if (weights.length) p.weight = weights.join(",");
    if (hasOffer) p.hasOffer = "true";
    p.page = String(page);
    p.limit = "12";
    return p;
  }, [search, category, sort, inStock, isBest, isNew, priceRanges, minPrice, maxPrice, rating, weights, hasOffer, page]);

  const { data: catData = [] } = useProductCategories();
  const categories = catData;

  const { data: weightData = [] } = useWeightLabels();
  const allWeightLabels = weightData;

  const { data: combosData = [], isLoading: combosLoading } = useActiveCombos();

  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching } = useProductList(queryParams);
  const products = useMemo(() => productsData?.products || [], [productsData]);
  const pagination = productsData?.pagination || null;
  const loading = productsLoading || (combosLoading && page === 1);

  const filteredCombos = useMemo(() => {
    let list = [...combosData];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    if (priceRanges.length > 0) {
      list = list.filter((c) => {
        const p = c.comboPrice;
        return priceRanges.some((id) => {
          const r = PRICE_RANGES.find((pr) => pr.id === id);
          if (!r) return false;
          const min = r.min !== "" ? parseFloat(r.min) : 0;
          const max = r.max !== "" ? parseFloat(r.max) : Infinity;
          return p >= min && p <= max;
        });
      });
    } else if (minPrice || maxPrice) {
      const min = minPrice !== "" ? parseFloat(minPrice) : 0;
      const max = maxPrice !== "" ? parseFloat(maxPrice) : Infinity;
      list = list.filter((c) => c.comboPrice >= min && c.comboPrice <= max);
    }
    return list;
  }, [combosData, search, priceRanges, minPrice, maxPrice]);

  const combinedItems = useMemo(() => {
    const isCombosCategory = category === "combos" || category?.toLowerCase() === "combos";

    const productItems = products.map(p => ({
      type: "product",
      id: p.id,
      data: p,
      price: p.variants?.[0]?.price ?? p.minPrice ?? 0,
      createdAt: p.createdAt
    }));

    if (isCombosCategory) {
      return filteredCombos.map(c => ({
        type: "combo",
        id: c.id,
        data: c,
        price: c.comboPrice,
        createdAt: c.createdAt
      }));
    }

    if (category) {
      return productItems;
    }

    // Merge both (combos on Page 1 only)
    const comboItems = page === 1 ? filteredCombos.map(c => ({
      type: "combo",
      id: c.id,
      data: c,
      price: c.comboPrice,
      createdAt: c.createdAt
    })) : [];

    const merged = [...comboItems, ...productItems];

    if (sort === "price-low-high") {
      merged.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high-low") {
      merged.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    // default (popular): combos at the top, then products
    return merged;
  }, [products, filteredCombos, category, page, sort]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [queryParams]);

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
    const p = new URLSearchParams(searchParams);
    if (key === "priceRange") {
      p.delete("minPrice");
      p.delete("maxPrice");
    }
    if (next.length > 0) {
      p.set(key, next.join(","));
    } else {
      p.delete(key);
    }
    p.delete("page");
    setSearchParams(p);
  };

  const removeAllFilters = () => {
    setSearchParams({});
  };

  // ── active filters for pill display ──────────────────────────────
  const activeFilters = [
    search && { key: "search", label: `"${search}"` },
    category && { key: "category", label: categories.find((c) => c.slug === category)?.nameEn || category },
    inStock && { key: "inStock", label: "In Stock" },
    isBest && { key: "isBestseller", label: "Best Sellers" },
    isNew && { key: "isNew", label: "New Arrivals" },
    ...priceRanges.map((id) => {
      const r = PRICE_RANGES.find((p) => p.id === id);
      return {
        key: `priceRange:${id}`,
        label: r ? r.label : id,
        custom: () => toggleListParam("priceRange", priceRanges, id),
      };
    }),
    (!priceRanges.length && (minPrice || maxPrice)) && {
      key: "price",
      label: `₹${minPrice || 0} – ₹${maxPrice || "∞"}`,
      custom: () => { setParam("minPrice", ""); setParam("maxPrice", ""); }
    },
    rating && { key: "rating", label: `${rating}★ & above` },
    hasOffer && { key: "hasOffer", label: "Has Offer" },
    ...weights.map((w) => ({ key: `weight:${w}`, label: w, custom: () => toggleListParam("weight", weights, w) })),
  ].filter(Boolean);

  const hasFilters = activeFilters.length > 0 || sort !== "popular";

  const sidebarProps = {
    hasFilters,
    removeAllFilters,
    sort,
    setParam,
    category,
    categories,
    minPrice,
    maxPrice,
    priceRanges,
    rating,
    allWeightLabels,
    weights,
    toggleListParam,
    inStock,
    hasOffer,
    isBest,
    isNew,
  };

  const rawCount = pagination?.totalProducts ?? combinedItems.length;
  const isFetching = productsLoading || productsFetching;

  const [lastValidCount, setLastValidCount] = useState(rawCount);

  useEffect(() => {
    if (!isFetching && productsData) {
      setLastValidCount(rawCount);
    }
  }, [isFetching, productsData, rawCount]);

  const totalProductCount = isFetching ? (lastValidCount || rawCount) : rawCount;

  let pageTitle = "Buy Dry Fish Online — Karuvadu, Pickles & Seafood | Namma Oor Karuvattu Kadai";
  let pageDescription = "Shop authentic karuvadu (dry fish), nethili, sura, and traditional pickles — சுவை மிக்க கருவாடு மற்றும் ஊறுகாய் — sun-dried the traditional way, delivered across Tamil Nadu.";

  if (category && categories.length > 0) {
    const activeCat = categories.find((c) => c.slug === category);
    if (activeCat) {
      const en = activeCat.nameEn || "";
      const ta = activeCat.nameTa || "";
      const namesCombo = ta ? `${en} (${ta})` : en;
      pageTitle = `Buy ${namesCombo} Online | Namma Oor Karuvattu Kadai`;
      pageDescription = `Shop authentic ${namesCombo} — ${ta ? `${ta} ` : ""}prepared the traditional way. Premium quality, authentic taste, delivered across Tamil Nadu.`;
    }
  } else if (search) {
    pageTitle = `Search results for "${search}" | Namma Oor Karuvattu Kadai`;
    pageDescription = `Browse authentic karuvadu (dry fish) and pickles matching your search for "${search}". Authentic taste, delivered across Tamil Nadu.`;
  }

  const canonicalUrl = useMemo(() => {
    const base = "https://nammaoorkaruvattukadai.com/products";
    if (category) {
      return `${base}?category=${category}`;
    }
    return base;
  }, [category]);

  const breadcrumbItems = useMemo(() => {
    const items = [
      { name: "Home", item: "https://nammaoorkaruvattukadai.com/" },
      { name: "Products", item: "https://nammaoorkaruvattukadai.com/products" }
    ];
    if (category && categories.length > 0) {
      const activeCat = categories.find((c) => c.slug === category);
      if (activeCat) {
        items.push({
          name: activeCat.nameEn,
          item: `https://nammaoorkaruvattukadai.com/products?category=${activeCat.slug}`
        });
      }
    }
    return items;
  }, [category, categories]);

  const schemas = useMemo(() => [
    buildBreadcrumbSchema(breadcrumbItems)
  ], [breadcrumbItems]);

  const noindex = !!search;

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 pt-2 pb-6 md:py-6">
      <SEO
        title={pageTitle}
        description={pageDescription}
        url="https://nammaoorkaruvattukadai.com/products"
        canonical={canonicalUrl}
        noindex={noindex}
        schemas={schemas}
      />

      {/* ── Mobile Split Sort & Filter Top Header Bar (Image 1 style) ────── */}
      <div className="md:hidden border-b border-sandal-100 bg-surface mb-3">
        <div className="grid grid-cols-2 divide-x divide-sandal-100">
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="flex items-center justify-center gap-2 py-3 font-body text-sm font-bold text-brand-900 hover:bg-sandal-50 transition-colors"
          >
            <ArrowUpDown size={15} className="text-amber-500" />
            <span>Sort</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex items-center justify-center gap-2 py-3 font-body text-sm font-bold text-brand-900 hover:bg-sandal-50 transition-colors relative"
          >
            <SlidersHorizontal size={15} className="text-amber-500" />
            <span>Filter</span>
            {activeFilters.length > 0 && (
              <span className="bg-brand-800 text-white font-num text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0 ml-0.5">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Chips Strip */}
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-t border-sandal-100/50">
          {activeFilters.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              onRemove={f.custom || (() => setParam(f.key, ""))}
            />
          ))}

          <button
            onClick={() => setParam("isBestseller", isBest ? "" : "true")}
            className={`px-3 py-1 rounded-full font-body text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 ${
              isBest
                ? "bg-brand-800 text-white border-brand-800"
                : "bg-sandal-50 text-brand-900 border-sandal-200 hover:bg-sandal-100"
            }`}
          >
            ⭐ Best Sellers
          </button>

          <button
            onClick={() => setParam("inStock", inStock ? "" : "true")}
            className={`px-3 py-1 rounded-full font-body text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 ${
              inStock
                ? "bg-brand-800 text-white border-brand-800"
                : "bg-sandal-50 text-brand-900 border-sandal-200 hover:bg-sandal-100"
            }`}
          >
            📦 In Stock
          </button>

          <button
            onClick={() => setParam("hasOffer", hasOffer ? "" : "true")}
            className={`px-3 py-1 rounded-full font-body text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 ${
              hasOffer
                ? "bg-brand-800 text-white border-brand-800"
                : "bg-sandal-50 text-brand-900 border-sandal-200 hover:bg-sandal-100"
            }`}
          >
            🏷️ On Offer
          </button>

          <button
            onClick={() => setParam("isNew", isNew ? "" : "true")}
            className={`px-3 py-1 rounded-full font-body text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 ${
              isNew
                ? "bg-brand-800 text-white border-brand-800"
                : "bg-sandal-50 text-brand-900 border-sandal-200 hover:bg-sandal-100"
            }`}
          >
            ✨ New Arrivals
          </button>
        </div>
      </div>

      {/* ── Sort Bottom Sheet Modal (Image 1 style) ───────────────── */}
      <SortBottomSheetModal
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        sort={sort}
        setParam={setParam}
      />

      {/* ── Mobile 2-Column Filter Page / Drawer (Image 2 style) ──── */}
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        hasFilters={hasFilters}
        removeAllFilters={removeAllFilters}
        totalCount={totalProductCount}
        category={category}
        categories={categories}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceRanges={priceRanges}
        rating={rating}
        allWeightLabels={allWeightLabels}
        weights={weights}
        toggleListParam={toggleListParam}
        setParam={setParam}
        inStock={inStock}
        hasOffer={hasOffer}
        isBest={isBest}
        isNew={isNew}
      />

      {/* ── Desktop Active filter pills ───────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="hidden md:flex flex-wrap gap-2 mb-4 px-4 sm:px-0">
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

        {/* ── Product grid ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <h1 className="sr-only">
            {category && categories.length > 0
              ? `${categories.find((c) => c.slug === category)?.nameEn || "Products"} Category`
              : "Buy Authentic Dry Fish & Pickles Online"}
          </h1>

          {loading ? (
            <div className="product-grid-compact">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>

          ) : combinedItems.length === 0 ? (
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
                {combinedItems.map((item) =>
                  item.type === "combo" ? (
                    <ProductCard key={`combo-${item.id}`} itemType="combo" combo={item.data} />
                  ) : (
                    <ProductCard
                      key={`prod-${item.id}`}
                      product={item.data}
                      selectedWeights={weights}
                      priceRanges={priceRanges}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                    />
                  )
                )}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap px-4 sm:px-0">
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

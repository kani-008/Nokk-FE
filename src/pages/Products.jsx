import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { productApi, categoryApi } from "../ApiCall/Api.jsx";
import { useCartStore }    from "../components/store/CartStore";
import { useWishlistStore } from "../components/store/WishlistStore";
import { useAuthStore }     from "../components/store/AuthStore";
import ProductCard from "../components/Product/ProductCard";

// ── sort options ───────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "popular",        label: "Most Popular" },
  { value: "newest",         label: "Newest First" },
  { value: "price-low-high", label: "Price: Low → High" },
  { value: "price-high-low", label: "Price: High → Low" },
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

// ── filter section (collapsible on mobile) ─────────────────────────────
function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-amber-100 pb-4 mb-4">
      <button
        className="w-full flex items-center justify-between mb-3 font-body text-sm font-semibold text-brand-900"
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

// ══════════════════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // read from URL
  const search   = searchParams.get("search")       || "";
  const category = searchParams.get("category")     || "";
  const sort     = searchParams.get("sort")          || "popular";
  const inStock  = searchParams.get("inStock")       === "true";
  const isBest   = searchParams.get("isBestseller") === "true";
  const isNew    = searchParams.get("isNew")         === "true";
  const page     = parseInt(searchParams.get("page") || "1");

  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  // ── build query string from URL state ────────────────────────────
  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (search)   p.set("search",       search);
    if (category) p.set("category",     category);
    if (sort)     p.set("sort",         sort);
    if (inStock)  p.set("inStock",      "true");
    if (isBest)   p.set("isBestseller", "true");
    if (isNew)    p.set("isNew",        "true");
    p.set("page",  String(page));
    p.set("limit", "12");
    return p.toString();
  }, [search, category, sort, inStock, isBest, isNew, page]);

  // ── set a single URL param ────────────────────────────────────────
  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page"); // reset to page 1 on any filter change
    setSearchParams(p);
  };

  const removeAllFilters = () => {
    setSearchParams({});
    setSearchInput("");
  };

  // ── fetch categories once ─────────────────────────────────────────
  useEffect(() => {
    categoryApi.list()
      .then((r) => setCategories(r.categories || []))
      .catch(() => {});
  }, []);

  // ── fetch products whenever filters change ────────────────────────
  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    productApi.list(buildQuery())
      .then((r) => {
        setProducts(r.products || []);
        setPagination(r.pagination || null);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [buildQuery]);

  // ── active filters for pill display ──────────────────────────────
  const activeFilters = [
    search   && { key: "search",       label: `"${search}"` },
    category && { key: "category",     label: categories.find((c) => c.slug === category)?.nameEn || category },
    inStock  && { key: "inStock",      label: "In Stock" },
    isBest   && { key: "isBestseller", label: "Best Sellers" },
    isNew    && { key: "isNew",        label: "New Arrivals" },
  ].filter(Boolean);

  const hasFilters = activeFilters.length > 0 || sort !== "popular";

  // ── sidebar ───────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="w-full md:w-52 shrink-0">
      <div className="card p-4 sticky top-24">

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
                className={`w-full text-left font-body text-sm px-2 py-1.5 rounded-lg transition-colors ${
                  !category ? "bg-brand-800 text-white" : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setParam("category", cat.slug)}
                  className={`w-full text-left font-body text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    category === cat.slug ? "bg-brand-800 text-white" : "text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  {cat.nameEn}
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>

        {/* Quick filters */}
        <FilterSection title="Quick Filters">
          <div className="space-y-2">
            {[
              { key: "inStock",      value: inStock, label: "In Stock Only" },
              { key: "isBestseller", value: isBest,  label: "Best Sellers" },
              { key: "isNew",        value: isNew,   label: "New Arrivals" },
            ].map((f) => (
              <label key={f.key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={f.value}
                  onChange={(e) => setParam(f.key, e.target.checked ? "true" : "")}
                  className="w-4 h-4 rounded accent-brand-700"
                />
                <span className="font-body text-sm text-amber-800 group-hover:text-brand-900 transition-colors">
                  {f.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

      </div>
    </aside>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-5">
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
      </div>

      {/* ── Top bar: search + sort + mobile filter toggle ─────────── */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">

        {/* inline search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setParam("search", searchInput); }}
          className="flex-1 min-w-[160px] max-w-sm"
        >
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              className="field-input pl-8 py-2 text-sm"
            />
          </div>
        </form>

        {/* sort */}
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="field-input w-auto py-2 text-sm pr-8 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* mobile filter button */}
        <button
          className="md:hidden flex items-center gap-1.5 btn-md btn-outline"
          onClick={() => setFilterOpen((s) => !s)}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilters.length > 0 && (
            <span className="badge-amber">{activeFilters.length}</span>
          )}
        </button>
      </div>

      {/* ── Active filter pills ───────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              onRemove={() => setParam(f.key, "")}
            />
          ))}
        </div>
      )}

      <div className="flex gap-6">

        {/* ── Desktop sidebar ──────────────────────────────────────── */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

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
              <Sidebar />
            </div>
          </div>
        )}

        {/* ── Product grid ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {loading ? (
            <div className="product-grid">
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
              <div className="product-grid">
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
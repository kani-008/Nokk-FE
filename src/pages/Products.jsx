import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, RefreshCw, X, ShoppingBag } from 'lucide-react';
import { mockAPI } from '../data/mockData';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Load Initial Data
  useEffect(() => {
    setProducts(mockAPI.getProducts());
    setCategories(mockAPI.getCategories());
  }, []);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedWeights, setSelectedWeights] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync with searchParams / URL query arguments
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    } else {
      setSelectedCategories([]);
    }

    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  // Handle resets
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 1000 });
    setSelectedWeights([]);
    setInStockOnly(false);
    setSortOption('popular');
    setSearchQuery('');
    setSearchParams({});
  };

  // Toggling filters
  const handleCategoryToggle = (slug) => {
    // Clear URL category search param if we interact manually
    if (searchParams.get('category')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams);
    }

    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const handleWeightToggle = (weight) => {
    setSelectedWeights((prev) =>
      prev.includes(weight) ? prev.filter((w) => w !== weight) : [...prev, weight]
    );
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search Filter (Tamil or English Name / Category)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchNameEn = p.nameEn.toLowerCase().includes(query);
          const matchNameTa = p.nameTa.toLowerCase().includes(query);
          const matchDesc = p.description.toLowerCase().includes(query);
          const matchCat = p.category.toLowerCase().includes(query);
          if (!matchNameEn && !matchNameTa && !matchDesc && !matchCat) return false;
        }

        // Category Filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) {
          return false;
        }

        // Stock Filter
        if (inStockOnly && !p.inStock) {
          return false;
        }

        // Price Filter (check if any variant falls in range)
        const hasVariantInPriceRange = p.variants.some(
          (v) => v.price >= priceRange.min && v.price <= priceRange.max
        );
        if (!hasVariantInPriceRange) {
          return false;
        }

        // Weight Filter (check if any variant matches selected weights)
        if (selectedWeights.length > 0) {
          const hasMatchingWeight = p.variants.some((v) =>
            selectedWeights.includes(v.weight)
          );
          if (!hasMatchingWeight) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sorting
        const aMinPrice = Math.min(...a.variants.map((v) => v.price));
        const bMinPrice = Math.min(...b.variants.map((v) => v.price));

        if (sortOption === 'price-low-high') {
          return aMinPrice - bMinPrice;
        }
        if (sortOption === 'price-high-low') {
          return bMinPrice - aMinPrice;
        }
        if (sortOption === 'newest') {
          return a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1;
        }
        // default popular
        return b.rating - a.rating;
      });
  }, [products, searchQuery, selectedCategories, inStockOnly, priceRange, selectedWeights, sortOption]);

  const breadcrumbItems = [{ label: 'Products', link: '/products' }];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-sand/65 pb-6 mb-8">
        <div>
          <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold">
            தயாரிப்புகள்
          </h1>
          <p className="font-playfair text-xs md:text-sm text-brand-ocean font-bold mt-1">
            Authentic Tamil Nadu coastal dry fish collections ({filteredProducts.length} items found)
          </p>
        </div>

        {/* Sorting controls & Mobile Filter button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 border border-brand-sand bg-white text-brand-ocean px-3.5 py-2 rounded-xl text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-primary" /> Filters
          </button>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-brand-dark/50">Sort By:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white border border-brand-sand rounded-xl px-3 py-2 text-brand-ocean focus:outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="popular">Popular / Rating</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:flex flex-col gap-6 sticky top-24 self-start bg-brand-cream/45 border border-brand-sand p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center border-b border-brand-sand pb-3.5">
            <h3 className="text-sm font-bold text-brand-ocean flex items-center gap-2">
              <SlidersHorizontal className="w-4.5 h-4.5 text-brand-primary" /> Filters
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-brand-secondary hover:text-brand-primary flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Search bar inside sidebar */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-dark/65">Search Keywords</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Nethili, Pickle..."
                className="w-full bg-white border border-brand-sand rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
              />
              <Search className="w-3.5 h-3.5 text-brand-dark/45 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category checklist */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-brand-dark/65">Categories</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer text-brand-dark/80 hover:text-brand-primary">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(c.slug)}
                    onChange={() => handleCategoryToggle(c.slug)}
                    className="accent-brand-primary w-3.5 h-3.5 border-brand-sand rounded"
                  />
                  <span>{c.nameEn} ({c.nameTa})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Slider */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-brand-dark/65">
              <span>Max Price Limit</span>
              <span className="font-space text-brand-primary">₹{priceRange.max}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
              className="accent-brand-primary w-full cursor-pointer h-1.5 bg-brand-sand rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-brand-dark/40 font-bold font-space">
              <span>₹0</span>
              <span>₹1000</span>
            </div>
          </div>

          {/* Weight Variant Filter */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-brand-dark/65">Weight Variant</label>
            <div className="flex flex-wrap gap-1.5">
              {['250g', '500g', '1kg'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleWeightToggle(w)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    selectedWeights.includes(w)
                      ? 'bg-brand-ocean text-brand-cream border-brand-ocean'
                      : 'bg-white text-brand-dark/75 border-brand-sand hover:border-brand-ocean/30'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Toggle */}
          <label className="flex items-center gap-2.5 text-xs font-bold text-brand-dark/70 cursor-pointer pt-2 border-t border-brand-sand/65">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-brand-primary w-4 h-4 border-brand-sand rounded"
            />
            <span>Show In-Stock Only</span>
          </label>
        </aside>

        {/* Products Grid */}
        <main className="md:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-brand-cream/20 border border-brand-sand rounded-3xl min-h-[350px]">
              <ShoppingBag className="w-12 h-12 text-brand-dark/30 mb-4 animate-pulse" />
              <h3 className="font-playfair text-lg font-bold text-brand-ocean">No matching products</h3>
              <p className="text-xs text-brand-dark/60 mt-1 max-w-xs leading-relaxed">
                We couldn't find any dry fish items matching your current filters. Try resetting or adjusting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-secondary active:scale-95 shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 8. Mobile Filter Slide-out Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-xs bg-brand-cream shadow-2xl flex flex-col h-full overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-brand-sand pb-4">
                <h3 className="text-sm font-bold text-brand-ocean flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-primary" /> Filters
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 hover:bg-brand-ocean/10 rounded-full"
                >
                  <X className="w-5 h-5 text-brand-dark/70" />
                </button>
              </div>

              {/* Keywords */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-dark/65">Search Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Nethili, Pickle..."
                    className="w-full bg-white border border-brand-sand rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-brand-dark/40 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-brand-dark/65">Categories</label>
                <div className="space-y-2">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs font-medium text-brand-dark/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(c.slug)}
                        onChange={() => handleCategoryToggle(c.slug)}
                        className="accent-brand-primary w-3.5 h-3.5 rounded"
                      />
                      <span>{c.nameEn}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Price */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-brand-dark/65">
                  <span>Max Price Limit</span>
                  <span className="font-space text-brand-primary">₹{priceRange.max}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                  className="accent-brand-primary w-full h-1.5 bg-brand-sand rounded-lg"
                />
              </div>

              {/* Weights */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-brand-dark/65">Weight Variant</label>
                <div className="flex flex-wrap gap-1.5">
                  {['250g', '500g', '1kg'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWeightToggle(w)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        selectedWeights.includes(w)
                          ? 'bg-brand-ocean text-brand-cream border-brand-ocean'
                          : 'bg-white text-brand-dark/75 border-brand-sand'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <label className="flex items-center gap-2.5 text-xs font-bold text-brand-dark/70 cursor-pointer pt-2 border-t border-brand-sand">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-brand-primary w-4 h-4 rounded"
                />
                <span>Show In-Stock Only</span>
              </label>

              {/* Bottom Drawer Actions */}
              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 border border-brand-ocean/30 text-brand-ocean py-2.5 rounded-xl text-xs font-bold hover:bg-brand-ocean/5 transition-all"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 bg-brand-primary text-brand-cream py-2.5 rounded-xl text-xs font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow"
                >
                  Apply Filters
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

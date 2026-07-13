import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useAdminProductList } from "../../hookqueries/useProducts";
import Dropdown from "./Dropdown.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/*
  ComboItemPicker — standalone product+variant picker embedded inside the
  Combo create/edit modal as the "Combo Items" section.

  Props:
    items      {array}   — [{ productId, variantId, quantity, productName, weightLabel, price, primaryImage }]
    onChange   {fn(items)}
*/
export default function ComboItemPicker({ items = [], onChange }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: productsData, isLoading } = useAdminProductList({
    search: debouncedSearch || undefined,
    limit: 8,
  });
  const results = debouncedSearch ? (productsData?.products || []) : [];

  const addItem = (product, variant) => {
    const existing = items.find((i) => i.variantId === variant.id);
    if (existing) {
      onChange(items.map((i) =>
        i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      onChange([
        ...items,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.nameEn,
          primaryImage: product.primaryImage,
          weightLabel: variant.weightLabel,
          price: variant.price,
          quantity: 1,
        },
      ]);
    }
    setSelectedProductId(null);
    setSelectedVariantId("");
    setSearch("");
    setDebouncedSearch("");
  };

  const updateQty = (variantId, qty) => {
    const n = Math.max(1, parseInt(qty) || 1);
    onChange(items.map((i) => (i.variantId === variantId ? { ...i, quantity: n } : i)));
  };

  const removeItem = (variantId) => {
    onChange(items.filter((i) => i.variantId !== variantId));
  };

  const runningTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="space-y-3">
      <label className="field-label">Combo Items</label>

      {/* search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedProductId(null); }}
          placeholder="Search products to add…"
          className="field-input pl-9"
        />
      </div>

      {debouncedSearch && (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
          {isLoading && <p className="font-body text-xs text-gray-400 px-3 py-2.5">Searching…</p>}
          {!isLoading && results.length === 0 && (
            <p className="font-body text-xs text-gray-400 px-3 py-2.5">No products found.</p>
          )}
          {results.map((p) => (
            <div key={p.id} className="p-2.5">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => { setSelectedProductId(p.id); setSelectedVariantId(""); }}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                  {p.primaryImage ? (
                    <img src={p.primaryImage} alt={p.nameEn} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <span className="font-body text-sm font-medium text-gray-800 truncate">{p.nameEn}</span>
              </div>

              {selectedProductId === p.id && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <Dropdown
                      value={selectedVariantId}
                      onChange={setSelectedVariantId}
                      placeholder="Select variant"
                      options={(p.variants || []).map((v) => ({
                        value: v.id,
                        label: `${v.weightLabel} — ${rupee(v.price)}`,
                      }))}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!selectedVariantId}
                    onClick={() => {
                      const variant = p.variants.find((v) => v.id === selectedVariantId);
                      if (variant) addItem(p, variant);
                    }}
                    className="font-body text-xs font-semibold text-white bg-brand-800 hover:bg-brand-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-3 h-[var(--admin-control-h)] shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* running list */}
      {items.length > 0 && (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((i) => (
            <div key={i.variantId} className="flex items-center gap-2.5 p-2.5">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                {i.primaryImage ? (
                  <img src={i.primaryImage} alt={i.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-gray-800 truncate">{i.productName}</p>
                <p className="font-body text-[11px] text-gray-400">{i.weightLabel} · {rupee(i.price)} each</p>
              </div>
              <input
                type="number"
                min={1}
                value={i.quantity}
                onChange={(e) => updateQty(i.variantId, e.target.value)}
                className="w-14 field-input text-center px-1"
              />
              <button
                type="button"
                onClick={() => removeItem(i.variantId)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                aria-label="Remove item"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length < 2 && (
        <p className="font-body text-xs text-amber-600">Add at least 2 items to make a combo.</p>
      )}

      {items.length > 0 && (
        <div className="flex justify-between items-center px-1">
          <span className="font-body text-xs text-gray-500">Individual total</span>
          <span className="font-num text-sm font-bold text-gray-900">{rupee(runningTotal)}</span>
        </div>
      )}
    </div>
  );
}

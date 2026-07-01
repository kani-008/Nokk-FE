import { useState } from "react";

export default function ProductDescription({ product }) {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { key: "description", label: "Description", content: product.description || "No description available." },
    { key: "howToUse", label: "How to Use", content: product.howToUse },
    { key: "storage", label: "Storage Tips", content: product.storageTips }
  ].filter(t => t.key === "description" || !!t.content?.trim());

  // If the active tab was filtered out, fallback to description
  const currentTab = tabs.find(t => t.key === activeTab) || tabs[0];

  return (
    <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5">
      {/* ── Desktop View: Stacked sections (hidden on mobile) ── */}
      <div className="hidden md:block space-y-6">
        {tabs.map((t) => (
          <div key={t.key}>
            <h4 className="font-display text-sm sm:text-base font-bold text-brand-900 mb-2 border-b border-sandal-100 pb-2">
              {t.label}
            </h4>
            <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
              {t.content}
            </p>
          </div>
        ))}
      </div>

      {/* ── Mobile View: Tabs layout (hidden on desktop) ── */}
      <div className="block md:hidden">
        {/* tab bar */}
        <div className="flex gap-1 overflow-x-auto border-b border-sandal-100 mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 font-body text-xs sm:text-sm font-bold px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${currentTab.key === t.key
                  ? "border-gray-800 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="min-h-[80px]">
          <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
            {currentTab.content}
          </p>
        </div>
      </div>
    </div>
  );
}

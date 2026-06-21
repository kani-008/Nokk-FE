import { useState } from "react";

export default function ProductDescription({ product }) {
  const [activeTab, setActiveTab] = useState("description");

  const TABS = [
    { key: "description", label: "Description" },
    { key: "howToUse", label: "How to Use" },
    { key: "storage", label: "Storage Tips" },
  ];

  return (
    <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5">
      {/* tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-sandal-100 mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 font-body text-xs sm:text-sm font-bold px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${activeTab === t.key
                ? "border-gray-800 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div className="min-h-[100px]">
        {activeTab === "description" && (
          <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
            {product.description || "No description available."}
          </p>
        )}

        {activeTab === "howToUse" && (
          <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
            {product.howToUse || "Cooking instructions not available."}
          </p>
        )}

        {activeTab === "storage" && (
          <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
            {product.storageTips || "Storage instructions not available."}
          </p>
        )}
      </div>
    </div>
  );
}

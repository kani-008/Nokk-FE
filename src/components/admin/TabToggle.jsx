// Shared segmented tab control — matches the bg-gray-50 pill pattern used in
// BannerManagement, OfferManagement, OrderManagement, and ReportManagement.
// Pass containerClassName to override the bg color (e.g. "bg-gray-100" for Reports).
// Pass tabClassName for per-page fluid-sizing clamp() classes from index.css.
// Pass icon as a Lucide component in the tabs array to render a 13px icon.
export default function TabToggle({ tabs, active, onChange, tabClassName = "", containerClassName = "" }) {
  return (
    <div className={`flex gap-1 bg-gray-50 p-1 rounded-xl w-full sm:w-fit shrink-0 ${containerClassName}`}>
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 sm:flex-none font-body text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            active === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
          } ${tabClassName}`}
        >
          {Icon && <Icon size={13} />}
          {label}
        </button>
      ))}
    </div>
  );
}

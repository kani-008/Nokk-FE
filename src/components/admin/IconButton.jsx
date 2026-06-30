// Shared icon-only action button — consistent sizing and hover colors across all admin pages.
// Use variant="brand" for edit/view, "danger" for delete, "amber" for toggle,
// "default" (default) for neutral actions (refresh, close, menu).
// Use size="lg" for card-level touch targets (p-2.5 sm:p-1.5) and "xl" for topbar (p-2 rounded-xl).
export default function IconButton({ variant = "default", size = "md", className = "", children, ...props }) {
  const sizes = {
    sm: "p-1 rounded-md",
    md: "p-1.5 rounded-lg",
    lg: "p-2.5 sm:p-1.5 rounded-lg",
    xl: "p-2 rounded-xl",
  };
  const variants = {
    default: "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
    brand:   "text-gray-400 hover:text-brand-700 hover:bg-brand-50",
    danger:  "text-gray-400 hover:text-red-500 hover:bg-red-50",
    amber:   "text-gray-400 hover:text-amber-600 hover:bg-amber-50",
  };
  return (
    <button
      type="button"
      className={`${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.default} transition-colors disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

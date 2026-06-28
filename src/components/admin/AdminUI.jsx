import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import DataTable from "./TableFormat.jsx";

// ── Rupee formatter ────────────────────────────────────────────────────
const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ══════════════════════════════════════════════════════════════════════
// StatCard  — KPI card with optional trend indicator
//
// Props:
//   label    {string}
//   value    {string|number}
//   icon     {LucideIcon}
//   color    {string}  — "amber"|"green"|"blue"|"purple"|"red"|"teal"
//   sub      {string}  — secondary line
//   trend    {number}  — positive/negative % change (optional)
//   currency {boolean} — format value as INR
// ══════════════════════════════════════════════════════════════════════
export function StatCard({
  label,
  value,
  icon: Icon,
  color = "amber",
  sub,
  trend,
  currency,
}) {
  const palettes = {
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      border: "border-amber-100",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      border: "border-green-100",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: "border-blue-100",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      border: "border-purple-100",
    },
    red: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-100" },
    teal: {
      bg: "bg-teal-50",
      icon: "text-teal-600",
      border: "border-teal-100",
    },
  };
  const p = palettes[color] ?? palettes.amber;

  const displayValue = currency ? rupee(Number(value) || 0) : value;

  const trendEl =
    trend !== undefined && trend !== null ? (
      <span
        className={`inline-flex items-center gap-0.5 font-num text-xs font-semibold ${
          trend > 0
            ? "text-green-600"
            : trend < 0
              ? "text-red-500"
              : "text-gray-400"
        }`}
      >
        {trend > 0 ? (
          <TrendingUp size={13} />
        ) : trend < 0 ? (
          <TrendingDown size={13} />
        ) : (
          <Minus size={13} />
        )}
        {Math.abs(trend)}%
      </span>
    ) : null;

  return (
    <div
      className={`bg-white border ${p.border} rounded-2xl p-5 admin-padding-fluid flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${p.bg}`}>
          <Icon size={19} className={p.icon} />
        </div>
        {trendEl}
      </div>
      <div>
        <p className="font-num text-2xl font-extrabold text-gray-900 leading-none admin-h2-fluid">
          {displayValue}
        </p>
        <p className="font-body text-sm text-gray-500 mt-1 leading-snug admin-text-fluid">
          {label}
        </p>
        {sub && <p className="font-body text-xs text-gray-400 mt-0.5 admin-text-fluid">{sub}</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AdminPage — page-level wrapper with title row
// ══════════════════════════════════════════════════════════════════════
export function AdminPage({ title, sub, action, children }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 leading-snug admin-h1-fluid">
            {title}
          </h2>
          {sub && (
            <p className="font-body text-sm text-gray-500 mt-0.5 admin-text-fluid">{sub}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0">{action}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export { DataTable };

// ══════════════════════════════════════════════════════════════════════
// AdminCard — generic white card container
// ══════════════════════════════════════════════════════════════════════
export function AdminCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-5 admin-padding-fluid ${className}`}
    >
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// StatusBadge — order / user status pill
// ══════════════════════════════════════════════════════════════════════
const STATUS_MAP = {
  pending: "bg-yellow-50  text-yellow-700  border-yellow-200",
  confirmed: "bg-blue-50    text-blue-700    border-blue-200",
  processing: "bg-indigo-50  text-indigo-700  border-indigo-200",
  shipped: "bg-purple-50  text-purple-700  border-purple-200",
  out_for_delivery: "bg-orange-50  text-orange-700  border-orange-200",
  delivered: "bg-green-50   text-green-700   border-green-200",
  cancelled: "bg-red-50     text-red-600     border-red-200",
  replacement_requested: "bg-pink-50    text-pink-700    border-pink-200",
  replacement_approved: "bg-blue-50    text-blue-700    border-blue-200",
  replacement_rejected: "bg-red-50     text-red-600     border-red-200",
  replacement_completed: "bg-teal-50    text-teal-700    border-teal-200",
  requested: "bg-pink-50    text-pink-700    border-pink-200",
  approved: "bg-blue-50    text-blue-700    border-blue-200",
  rejected: "bg-red-50     text-red-600     border-red-200",
  completed: "bg-teal-50    text-teal-700    border-teal-200",
  active: "bg-green-50   text-green-700   border-green-200",
  blocked: "bg-red-50     text-red-600     border-red-200",
  admin: "bg-purple-50  text-purple-700  border-purple-200",
  customer: "bg-gray-50    text-gray-600    border-gray-200",
};

export function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center font-num text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cls} whitespace-nowrap`}
    >
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AdminButton — primary / outline / danger
// ══════════════════════════════════════════════════════════════════════
export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
  className = "",
  ...rest
}) {
  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1",
    md: "text-sm px-4 py-2 gap-1.5",
    lg: "text-sm px-5 py-2.5 gap-2",
  };
  const variants = {
    primary: "bg-brand-800 hover:bg-brand-900 text-white",
    outline:
      "border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
  };

  return (
    <button
      {...rest}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-body font-semibold rounded-md
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]} ${variants[variant]} ${className}
      `}
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SearchBar — admin page search input
// ══════════════════════════════════════════════════════════════════════
export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 font-body text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 placeholder:text-gray-400"
      />
    </div>
  );
}

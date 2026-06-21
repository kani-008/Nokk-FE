import { Link } from "react-router-dom";

export default function Logo({ className = "", showText = true, inverse = false }) {
  // sand/sandal and gray colors matching our brand guidelines
  const iconColor = inverse ? "text-sandal-200" : "text-sandal-600";
  const primaryTextColor = inverse ? "text-white" : "text-gray-800";
  const secondaryTextColor = inverse ? "text-sandal-200" : "text-gray-500";

  return (
    <Link to="/" className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Premium Stylized Dry Fish SVG Icon */}
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${inverse ? "bg-gray-800 group-hover:bg-gray-700" : "bg-sandal-100 group-hover:bg-sandal-200"}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className={`w-7 h-7 stroke-current fill-none ${iconColor}`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main Fish Skeleton / Dry Fish Line Outline */}
          <path d="M4 24c4-7 12-11 20-11s16 4 20 11c-4 7-12 11-20 11S8 31 4 24z" />
          {/* Center Spine */}
          <line x1="8" y1="24" x2="38" y2="24" />
          {/* Vertical Bones */}
          <line x1="16" y1="18" x2="16" y2="30" />
          <line x1="24" y1="16" x2="24" y2="32" />
          <line x1="32" y1="18" x2="32" y2="30" />
          {/* Tail fin details */}
          <path d="M40 24l4-5v10z" />
          {/* Eye */}
          <circle cx="12" cy="24" r="1" className="fill-current" />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight flex flex-col justify-center">
          <span className={`font-display font-extrabold text-[17px] tracking-wide ${primaryTextColor} transition-colors`}>
            NammaOor
          </span>
          <span className={`font-tamil text-[10px] font-bold uppercase tracking-wider ${secondaryTextColor}`}>
            கருவாட்டு கடை
          </span>
        </div>
      )}
    </Link>
  );
}

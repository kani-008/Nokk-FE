import { Link } from "react-router-dom";

const IMAGEKIT_FALLBACK = "https://ik.imagekit.io/Nokk/logo/logo4.png";

export default function Logo({ className = "", showText = true, inverse = false }) {
  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = IMAGEKIT_FALLBACK;
  };

  return (
    <Link to="/" className={`flex items-center group select-none ${className}`}>
      {/* Mobile Logo */}
      <img
        src="/logo4.png"
        onError={handleImageError}
        alt="Namma Oor Karuvattu Kadai"
        className="block md:hidden h-10 w-auto object-contain"
      />
      {/* Desktop Logo */}
      <img
        src="/logo4.png"
        onError={handleImageError}
        alt="Namma Oor Karuvattu Kadai"
        className="hidden md:block h-32 w-auto object-contain"
      />
    </Link>
  );
}

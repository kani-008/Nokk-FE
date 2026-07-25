import { Link } from "react-router-dom";

const IMAGEKIT_FALLBACK = "https://ik.imagekit.io/Nokk/logo/logo4.png";

export default function Logo({
  className = "",
  imgClassName = "",
  showText = true,
  inverse = false,
}) {
  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = IMAGEKIT_FALLBACK;
  };

  return (
    <Link to="/" className={`inline-flex items-center group select-none ${className}`}>
      <img
        src="/logo4.png"
        onError={handleImageError}
        alt="Namma Oor Karuvattu Kadai"
        className={`w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
          imgClassName || "h-12 md:h-28"
        }`}
      />
    </Link>
  );
}
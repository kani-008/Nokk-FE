import { Link } from "react-router-dom";

export default function Logo({ className = "", showText = true, inverse = false }) {
  return (
    <Link to="/" className={`flex items-center pl-16 group select-none ${className}`}>
      {/* Mobile Logo: fav.png */}
      <img
        src="/logo2.png"
        alt="Namma Oor Karuvattu Kadai"
        className="block md:hidden h-10 w-auto object-contain"
      />
      {/* Desktop Logo: logo2.png */}
      <img
        src="/logo2.png"
        alt="Namma Oor Karuvattu Kadai"
        className="hidden md:block h-14 w-auto object-contain"
      />
    </Link>
  );
}

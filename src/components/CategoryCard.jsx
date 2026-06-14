import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative flex flex-col items-center p-4 bg-brand-cream border border-brand-sand/55 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-secondary/35 shrink-0 w-36 md:w-auto"
    >
      {/* Circle Image Wrapper */}
      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-brand-sand bg-white shadow-inner mb-3 group-hover:border-brand-secondary transition-colors duration-300">
        <img
          src={category.image}
          alt={category.nameEn}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Typography */}
      <div className="text-center">
        <h4 className="font-tiro-tamil text-sm md:text-base text-brand-primary leading-tight font-semibold">
          {category.nameTa}
        </h4>
        <h3 className="font-playfair text-xs md:text-sm text-brand-dark/70 font-bold mt-0.5">
          {category.nameEn}
        </h3>
      </div>

      {/* Explore Link */}
      <div className="mt-3 flex items-center gap-1 text-[10px] md:text-xs font-bold text-brand-secondary opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
        Explore <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

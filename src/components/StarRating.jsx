import React from 'react';
import { Star, StarHalf } from 'lucide-react';

export default function StarRating({ rating = 0, reviewsCount, showText = true }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const halfStars = hasHalf ? 1 : 0;
  const emptyStars = Math.max(0, 5 - fullStars - (rating % 1 >= 0.75 ? 1 : 0) - halfStars);
  const adjustedFullStars = rating % 1 >= 0.75 ? fullStars + 1 : fullStars;

  return (
    <div className="flex items-center gap-1.5 font-space">
      <div className="flex items-center text-amber-500">
        {[...Array(adjustedFullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4.5 h-4.5 fill-current" />
        ))}
        {halfStars === 1 && (
          <div className="relative">
            <StarHalf className="w-4.5 h-4.5 fill-current absolute top-0 left-0" />
            <Star className="w-4.5 h-4.5 text-amber-500" />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4.5 h-4.5 text-amber-300" />
        ))}
      </div>
      {showText && (
        <span className="text-xs text-brand-dark/70 font-medium ml-1">
          {rating.toFixed(1)} {reviewsCount !== undefined && `(${reviewsCount} reviews)`}
        </span>
      )}
    </div>
  );
}

import React from 'react';

export default function PriceDisplay({ price, mrp, discountPercent, size = 'md' }) {
  const isDiscounted = mrp && mrp > price;

  const sizeClasses = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold md:text-lg',
    lg: 'text-xl font-bold md:text-2xl lg:text-3xl'
  };

  const mrpSizeClasses = {
    sm: 'text-xs line-through text-brand-dark/45',
    md: 'text-sm line-through text-brand-dark/45',
    lg: 'text-lg line-through text-brand-dark/45'
  };

  const badgeSizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1'
  };

  return (
    <div className="flex items-center gap-2 font-space">
      <span className={`text-brand-primary ${sizeClasses[size]}`}>
        ₹{price.toFixed(2)}
      </span>
      {isDiscounted && (
        <>
          <span className={mrpSizeClasses[size]}>
            ₹{mrp.toFixed(2)}
          </span>
          {discountPercent && discountPercent > 0 && (
            <span className={`bg-brand-secondary/10 text-brand-secondary font-bold rounded-full ${badgeSizeClasses[size]}`}>
              {discountPercent}% OFF
            </span>
          )}
        </>
      )}
    </div>
  );
}

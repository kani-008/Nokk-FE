import React from 'react';
import { Plus, Minus } from 'lucide-react';

export default function QuantityStepper({ quantity, onChange, min = 1, max = 99, size = 'md' }) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const sizeClasses = size === 'sm' ? 'h-7 px-1.5' : 'h-10 px-3';
  const buttonClasses = 'p-1 hover:bg-brand-ocean/10 rounded text-brand-ocean active:scale-90 transition-transform';

  return (
    <div className={`inline-flex items-center gap-3 bg-brand-cream border border-brand-ocean/20 rounded-lg ${sizeClasses} font-space`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={`${buttonClasses} disabled:opacity-30 disabled:pointer-events-none`}
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold select-none min-w-[20px] text-center">
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className={`${buttonClasses} disabled:opacity-30 disabled:pointer-events-none`}
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center text-xs md:text-sm font-medium text-brand-dark/65 py-4 max-w-7xl mx-auto px-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-primary transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-brand-dark/40 mx-1 shrink-0" />
              {isLast ? (
                <span className="text-brand-primary font-semibold select-none" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.link} className="hover:text-brand-primary transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

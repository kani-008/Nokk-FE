import React, { useState } from 'react';

export default function ImageGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainImage = images[activeIndex] || '/placeholder.jpg';

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Showcase with Loupe/Zoom Hover */}
      <div 
        className="relative aspect-square rounded-2xl overflow-hidden border border-brand-sand bg-white shadow-inner cursor-zoom-in"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={mainImage}
          alt="Product details"
          className="w-full h-full object-cover transition-transform duration-200"
          style={{
            transform: isHovered ? 'scale(1.8)' : 'scale(1)',
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`
          }}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                activeIndex === index
                  ? 'border-brand-primary shadow-md scale-95'
                  : 'border-brand-sand hover:border-brand-ocean/45'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

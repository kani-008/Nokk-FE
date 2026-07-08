import { useState, useRef } from "react";
import { Share2, ChevronLeft, ChevronRight } from "lucide-react";

const PH = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function ImageGallery({ images, onShare }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);

  const list = images?.length ? images : [{ imageUrl: PH, isPrimary: true }];
  // Replicate primary image if only 1 exists, to demonstrate swipe transition & dots
  const showList = list.length === 1 ? [list[0], list[0], list[0]] : list;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const index = Math.round(scrollLeft / clientWidth);
    if (index !== active) {
      setActive(index);
    }
  };

  const scrollToImage = (index) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: "smooth"
    });
    setActive(index);
  };

  const prev = () => {
    const nextIdx = (active - 1 + showList.length) % showList.length;
    scrollToImage(nextIdx);
  };

  const next = () => {
    const nextIdx = (active + 1) % showList.length;
    scrollToImage(nextIdx);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* main image viewer */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-sandal-100 group select-none">

        {/* Horizontal scroll snap container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
          style={{ scrollBehavior: "auto" }}
        >
          {showList.map((img, i) => (
            <div key={i} className="w-full h-full shrink-0 snap-center relative">
              <img
                src={img.imageUrl || PH}
                alt={`Product view ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PH; }}
              />
            </div>
          ))}
        </div>

        {/* share button — top-right of the image */}
        <button
          onClick={onShare}
          aria-label="Share product"
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-surface rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
        >
          <Share2 size={16} className="text-gray-800" />
        </button>

        {showList.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-surface rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-surface rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Dots navigation */}
      {showList.length > 1 && (
        <div className="flex justify-center gap-1.5 py-1">
          {showList.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToImage(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === active ? "bg-sandal-600 w-5" : "bg-gray-300 w-2"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

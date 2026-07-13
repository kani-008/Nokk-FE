import { useState, useRef, useEffect, useCallback } from "react";
import { Share2, ChevronLeft, ChevronRight } from "lucide-react";

const PH = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function ImageGallery({ images, onShare }) {
  const list = images?.length ? images : [{ imageUrl: PH, isPrimary: true }];
  // Replicate primary image if only 1 exists, to demonstrate swipe transition & dots
  const showList = list.length === 1 ? [list[0], list[0], list[0]] : list;

  const count = showList.length;
  const slidesWithClones = count > 1 ? [showList[count - 1], ...showList, showList[0]] : showList;
  const trackLength = slidesWithClones.length;

  const [domIdx, setDomIdx] = useState(count > 1 ? 1 : 0);
  const [animate, setAnimate] = useState(true);

  const trackRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const isResetting = useRef(false);

  const minSwipeDistance = 50;

  const active = count > 1 ? (domIdx - 1 + count) % count : 0;

  const next = useCallback(() => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => d + 1);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => d - 1);
  }, [count]);

  const scrollToImage = (index) => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx(index + 1);
  };

  const handleTransitionEnd = () => {
    if (count <= 1) return;
    if (domIdx > count) {
      isResetting.current = true;
      setAnimate(false);
      setDomIdx(1);
    } else if (domIdx < 1) {
      isResetting.current = true;
      setAnimate(false);
      setDomIdx(count);
    }
  };

  useEffect(() => {
    if (!animate) {
      const t = requestAnimationFrame(() => {
        setAnimate(true);
        isResetting.current = false;
      });
      return () => cancelAnimationFrame(t);
    }
  }, [animate, domIdx]);

  const onTouchStart = (e) => {
    if (count <= 1 || isResetting.current) return;
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
    if (trackRef.current) trackRef.current.style.transition = "none";
  };

  const onTouchMove = (e) => {
    if (count <= 1 || isResetting.current || touchStartRef.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    touchEndRef.current = currentX;
    const diffX = currentX - touchStartRef.current;
    if (trackRef.current) {
      const baseTranslatePercent = -domIdx * (100 / trackLength);
      trackRef.current.style.transform = `translateX(calc(${baseTranslatePercent}% + ${diffX}px))`;
    }
  };

  const onTouchEnd = () => {
    if (count <= 1 || isResetting.current) return;
    if (trackRef.current) trackRef.current.style.transition = "";

    const start = touchStartRef.current;
    const end = touchEndRef.current;
    touchStartRef.current = null;
    touchEndRef.current = null;

    if (start === null || end === null) {
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${domIdx * (100 / trackLength)}%)`;
      }
      return;
    }

    const distance = start - end;
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        next();
      } else {
        prev();
      }
    } else if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${domIdx * (100 / trackLength)}%)`;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* main image viewer */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-sandal-100 group select-none">

        {/* Slide track wrapper */}
        <div
          className="w-full h-full overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          <div
            ref={trackRef}
            className={`flex h-full ${animate ? "transition-transform duration-500 ease-in-out" : ""}`}
            style={{
              width: `${trackLength * 100}%`,
              transform: `translateX(-${domIdx * (100 / trackLength)}%)`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slidesWithClones.map((img, i) => (
              <div
                key={i}
                className="h-full shrink-0 relative"
                style={{ width: `${100 / trackLength}%` }}
              >
                <img
                  src={img.imageUrl || PH}
                  alt={`Product view ${i}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = PH; }}
                />
              </div>
            ))}
          </div>
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
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-surface rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-surface rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10"
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
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === active ? "bg-sandal-600 w-5" : "bg-gray-300 w-2"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

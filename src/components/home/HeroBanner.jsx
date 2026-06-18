import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import comboImg from "../../assets/products/combo.jpg";

const PH_BANNER = comboImg;

// premium royalty-free ocean/coastal loop video URL
const HERO_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-crashing-waves-of-the-ocean-close-up-12628-large.mp4";

/*
  HERO BANNER SLIDER
  ───────────────────────────────────────────────────────────────────
  1. The slide track is sized to `trackLength * 100%`, and each slide
     to `100 / trackLength%`, so the translateX percentage math always
     lines up with the actual rendered widths — this is what keeps
     slide text from getting compressed/misplaced.

  2. Navigation never gets "stuck": clicks are only blocked during the
     literal clone-reset frame (via a ref, not a fixed timeout), and
     autoplay runs on a single stable interval that isn't torn down
     and recreated on every slide change.

  3. Direction: every transition — manual prev, manual next, dot
     click, swipe, or autoplay — animates strictly left-to-right.
     "prev" reaches the target slide by continuing forward (the long
     way around the loop) rather than reversing.
*/
export default function HeroBanner({ banners }) {
  const slides = banners.length
    ? banners
    : [
        {
          title: "Authentic Dry Fish & Coastal Pickles",
          subtitle: "Sourced directly from Rameswaram fishermen — traditionally sun-dried, naturally preserved.",
          linkUrl: "/products",
        },
      ];

  const count = slides.length;

  // Clones front and back enable seamless looping. With count slides we
  // render [cloneOfLast, ...slides, cloneOfFirst] = count + 2 items.
  const slidesWithClones = count > 1 ? [slides[count - 1], ...slides, slides[0]] : slides;
  const trackLength = slidesWithClones.length;

  // domIdx is the position within slidesWithClones; starts at 1 (first real slide)
  const [domIdx, setDomIdx] = useState(count > 1 ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const isResetting = useRef(false);
  const trackRef = useRef(null);

  const minSwipeDistance = 50;

  // logical (non-clone) index, derived from domIdx — used for dot highlighting
  const logicalIdx = count > 1 ? (domIdx - 1 + count) % count : 0;

  // ── advance forward by exactly one slide ──
  const stepForward = useCallback(() => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => d + 1);
  }, [count]);

  // ── step backward to previous slide ──
  const stepToPrevious = useCallback(() => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => d - 1);
  }, [count]);

  const goToLogical = useCallback((targetLogical) => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => {
      const currentLogical = (d - 1 + count) % count;
      let forwardSteps = targetLogical - currentLogical;
      if (forwardSteps <= 0) forwardSteps += count;
      return d + forwardSteps;
    });
  }, [count]);

  // ── snap back into the [1, count] range once a transition past a
  //    clone finishes, without animating the snap itself ──
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

  // turn animation back on right after a no-animation snap has applied
  // (using simple setTimeout/requestAnimationFrame to prevent react render loops)
  useEffect(() => {
    if (!animate) {
      const t = requestAnimationFrame(() => {
        setAnimate(true);
        isResetting.current = false;
      });
      return () => cancelAnimationFrame(t);
    }
  }, [animate, domIdx]);

  // ── stable autoplay — one interval for the component's lifetime ──
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(stepForward, 5000);
    return () => clearInterval(t);
  }, [count, stepForward]);

  // ── swipe handling with real-time tracking ──
  const onTouchStart = (e) => {
    if (count <= 1 || isResetting.current) return;
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
    }
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
    if (trackRef.current) {
      trackRef.current.style.transition = "";
    }

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
        stepForward(); // Swipe right-to-left (finger moves left) -> next slide
      } else {
        stepToPrevious(); // Swipe left-to-right (finger moves right) -> previous slide
      }
    } else {
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${domIdx * (100 / trackLength)}%)`;
      }
    }
  };

  const cur = slides[logicalIdx];

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative h-[480px] bg-gray-950 overflow-hidden group select-none flex items-center justify-center"
    >
      {/* loop video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-35"
        src={cur.videoUrl || HERO_VIDEO_URL}
        poster={cur.imageUrl || PH_BANNER}
      />

      {/* dark vignette overlay — sits above the video, below the text */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-gray-950/40" />

      {/* slide track — width is trackLength * 100% so each slide's
          100/trackLength% share matches the translateX percentage math */}
      <div className="relative z-10 w-full overflow-hidden">
        <div
          ref={trackRef}
          className={`flex ${animate ? "transition-transform duration-700 ease-in-out" : ""}`}
          style={{
            width: `${trackLength * 100}%`,
            transform: `translateX(-${domIdx * (100 / trackLength)}%)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slidesWithClones.map((slide, i) => (
            <div
              key={i}
              className="shrink-0 flex flex-col items-center justify-center text-center px-4"
              style={{ width: `${100 / trackLength}%` }}
            >
              <div className="max-w-4xl w-full mx-auto">
                <p className="font-num text-sandal-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3.5">
                  நம்ம ஊர் கருவாட்டு கடை
                </p>
                <h1 className="font-display text-white text-3xl sm:text-5xl font-extrabold leading-tight mb-5 drop-shadow-md">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="font-body text-sandal-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed drop-shadow">
                    {slide.subtitle}
                  </p>
                )}
                <Link
                  to={slide.linkUrl || "/products"}
                  className="btn-lg btn-primary bg-sandal-500 text-gray-950 hover:bg-sandal-400 border-none shadow-lg inline-flex items-center gap-2"
                >
                  Shop Now <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* arrows */}
      {count > 1 && (
        <>
          <button
            onClick={stepToPrevious}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={stepForward}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm z-20"
          >
            <ChevronRight size={20} />
          </button>

          {/* dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToLogical(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === logicalIdx ? "bg-sandal-400 w-6" : "bg-white/40 w-2.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import API from "../../ApiCall/Api.jsx";

/*
  HERO BANNER SLIDER
  ───────────────────────────────────────────────────────────────────
  1. The slide track is sized to `trackLength * 100%`, and each slide
     to `100 / trackLength%`, so the translateX percentage math always
     lines up with the actual rendered widths.

  2. Navigation never gets "stuck": clicks are only blocked during the
     literal clone-reset frame (via a ref, not a fixed timeout).

  3. Direction: every transition animates strictly left-to-right.

  4. MOBILE VIDEO AUTOPLAY (the important part):
     - The `muted` PROPERTY (not just attribute) is forced via a ref.
     - The video starts at opacity-0 and ONLY fades in when the real
       `onPlaying` event fires. If autoplay is blocked (Android data/
       battery saver) the video stays transparent and the poster shows
       instead of a black rectangle.
     - play() is retried on canplay, on tab re-focus, and on the first
       user touch anywhere on the page (a gesture unblocks playback
       that a saver mode refused to autoplay).
*/
export default function HeroBanner({ banners }) {
  const [slides, setSlides] = useState(() => {
    try {
      const cached = localStorage.getItem("nokk_all_banner_slides");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error("Failed to read cached slides:", err);
    }
    return [];
  });

  const count = slides.length;

  // Clones front and back enable seamless looping.
  const slidesWithClones = count > 1 ? [slides[count - 1], ...slides, slides[0]] : slides;
  const trackLength = slidesWithClones.length || 1;

  const [domIdx, setDomIdx] = useState(count > 1 ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const isResetting = useRef(false);
  const trackRef = useRef(null);
  const videoRef = useRef(null);

  // true once the video element emits a real `playing` event
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!banners || banners.length === 0) return;

    // Load from localStorage immediately for fast rendering
    try {
      const cached = localStorage.getItem("nokk_all_banner_slides");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("[HeroBanner] Loaded cached banner slides:", parsed);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSlides(parsed);
          setDomIdx(parsed.length > 1 ? 1 : 0);
        }
      }
    } catch (err) {
      console.error("Failed to load cached banner texts:", err);
    }

    const fetchBtexts = async () => {
      try {
        const activeBanners = banners.filter(b => b.isActive);
        if (activeBanners.length === 0) return;

        const promises = activeBanners.map((b) =>
          API.get(`/btext/get-by-banner?bannerId=${b.id}`).catch(() => ({ data: { btexts: [] } }))
        );
        const responses = await Promise.all(promises);

        const allSlides = [];
        responses.forEach((res, index) => {
          const banner = activeBanners[index];
          const btexts = res.data.btexts || [];
          btexts.forEach((bt) => {
            if (bt.isActive) {
              allSlides.push({
                ...bt,
                imageUrl: banner.imageUrl,
                videoUrl: banner.videoUrl,
              });
            }
          });
        });

        console.log("[HeroBanner] Fetched active banner slides/offer content:", allSlides);

        if (allSlides.length > 0) {
          setSlides(allSlides);
          setDomIdx(allSlides.length > 1 ? 1 : 0);
          localStorage.setItem("nokk_all_banner_slides", JSON.stringify(allSlides));
        }
      } catch (err) {
        console.error("Failed to load banner texts:", err);
      }
    };
    fetchBtexts();
  }, [banners]);

  const minSwipeDistance = 50;

  const logicalIdx = count > 1 ? (domIdx - 1 + count) % count : 0;

  // ── derive the background video + poster ──
  const activeVideoBanner =
    banners?.find((b) => b.videoUrl && b.isActive) ||
    banners?.find((b) => b.videoUrl) ||
    banners?.[0];
  const videoUrl = activeVideoBanner?.videoUrl || null;
  const posterUrl =
    activeVideoBanner?.imageUrl ||
    banners?.find((b) => b.imageUrl)?.imageUrl ||
    null;

  // ── advance forward by exactly one slide ──
  const stepForward = useCallback(() => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => d + 1);
  }, [count, setAnimate, setDomIdx]);

  const stepToPrevious = useCallback(() => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => d - 1);
  }, [count, setAnimate, setDomIdx]);

  const goToLogical = useCallback((targetLogical) => {
    if (count <= 1 || isResetting.current) return;
    setAnimate(true);
    setDomIdx((d) => {
      const currentLogical = (d - 1 + count) % count;
      let forwardSteps = targetLogical - currentLogical;
      if (forwardSteps <= 0) forwardSteps += count;
      return d + forwardSteps;
    });
  }, [count, setAnimate, setDomIdx]);

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

  // ── stable autoplay slider — one interval for the component's lifetime ──
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(stepForward, 5000);
    return () => clearInterval(t);
  }, [count, stepForward]);

  // ── force the BACKGROUND VIDEO to autoplay on real mobile ──
  // React only sets the muted *attribute*, not the *property*, and Android/iOS
  // block autoplay unless the element is genuinely muted. We also retry play()
  // on several signals because a single attempt is unreliable on mobile.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setVideoReady(false); // new source → wait for it to actually play

    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => { /* blocked by saver mode — poster stays visible */ });
      }
    };

    tryPlay();
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);

    // Android pauses backgrounded video; retry when the tab is visible again.
    const onVisible = () => { if (!document.hidden) tryPlay(); };
    document.addEventListener("visibilitychange", onVisible);

    // Last resort: the FIRST user gesture anywhere unblocks playback that a
    // data/battery saver refused to autoplay. Fires once, then cleans up.
    const onFirstGesture = () => tryPlay();
    document.addEventListener("touchstart", onFirstGesture, { once: true, passive: true });
    document.addEventListener("pointerdown", onFirstGesture, { once: true });

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("touchstart", onFirstGesture);
      document.removeEventListener("pointerdown", onFirstGesture);
    };
  }, [videoUrl]);

  // ── swipe handling ──
  const onTouchStart = (e) => {
    // a touch on the hero is also a gesture — nudge the video to play
    videoRef.current?.play?.().catch(() => {});
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
      if (distance > 0) stepForward();
      else stepToPrevious();
    } else if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${domIdx * (100 / trackLength)}%)`;
    }
  };

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative h-[480px] overflow-hidden group select-none flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950"
      style={{ touchAction: "pan-y" }}
    >
      {/* poster / fallback image — always visible, fades out once video plays.
          This eliminates the black-screen gap: the image appears instantly on
          page load, and the video cross-fades over it once buffered. */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* loop video background — starts at opacity-0; fades in when `onPlaying`
          fires. Native `poster` attribute gives the browser an image to paint
          while the first video frame is still buffering (no black flash). */}
      {videoUrl && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
          src={videoUrl}
          poster={posterUrl || undefined}
          onPlaying={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* dark vignette overlay — sits above the video, below the text */}
      <div className="absolute inset-0 z-[5] bg-black/45" />

      {/* slide track */}
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
                  Namma Oor Karuvattu Kadai
                </p>
                <h1 className="font-display text-white text-3xl sm:text-5xl font-extrabold leading-tight mb-5 drop-shadow-md hero-heading-fluid">
                  {slide.heading}
                </h1>
                {slide.subtext && (
                  <p className="font-body text-sandal-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed drop-shadow hero-subtext-fluid">
                    {slide.subtext}
                  </p>
                )}
                <Link
                  to="/products"
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
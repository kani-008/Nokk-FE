import { useState, useEffect } from "react";

/**
 * Returns a page-size limit tuned for the current viewport.
 *
 * Target viewport: 1440x900 (iMac M1 admin display).
 * Match range chosen to tolerate real-world variation — scrollbars,
 * browser chrome, slight zoom drift, and macOS display scaling:
 *   width  : 1400 – 1520  (covers 1440; excludes 1280 below and 1536+ above)
 *   height : 840  – 960   (covers 900; excludes 800 below and 1080 above)
 *
 * Returns `largeLimit` only when inside that range; `defaultLimit` for
 * every other viewport (mobile, 1280 laptop, 1920+ widescreen, etc.).
 *
 * Resize listener is debounced at 150 ms so it does not fire excessively
 * during window dragging.
 */
export default function useViewportPageSize(defaultLimit, largeLimit) {
  const isTarget = () =>
    window.innerWidth  >= 1400 && window.innerWidth  <= 1520 &&
    window.innerHeight >= 840  && window.innerHeight <= 960;

  const [limit, setLimit] = useState(() => (isTarget() ? largeLimit : defaultLimit));

  useEffect(() => {
    let timer;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setLimit(isTarget() ? largeLimit : defaultLimit);
      }, 150);
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      clearTimeout(timer);
    };
  }, [defaultLimit, largeLimit]);

  return limit;
}

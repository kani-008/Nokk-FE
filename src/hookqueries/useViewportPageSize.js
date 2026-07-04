import { useState, useEffect } from "react";

/**
 * Returns a page-size limit tuned for the current viewport.
 *
 * For ultra-large viewports (e.g. 4K, 4480x2520), it dynamically computes
 * a row limit to populate rows up to the full height of the display screen.
 *
 * Target viewport: 1440x900 (iMac M1 admin display).
 * Match range chosen to tolerate real-world variation — scrollbars,
 * browser chrome, slight zoom drift, and macOS display scaling:
 *   width  : 1400 – 1520  (covers 1440; excludes 1280 below and 1536+ above)
 *   height : 840  – 960   (covers 900; excludes 800 below and 1080 above)
 */
export default function useViewportPageSize(defaultLimit, largeLimit) {
  const getDynamicLimit = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // For ultra-large screens, scale rows up to fill the viewport height
    if (height > 1080 || width > 1920) {
      // Estimated header/padding height is ~280px, row height is ~56px
      const calculatedRows = Math.floor((height - 280) / 56);
      return Math.max(defaultLimit, calculatedRows);
    }

    const isTarget =
      width  >= 1400 && width  <= 1520 &&
      height >= 840  && height <= 960;

    return isTarget ? largeLimit : defaultLimit;
  };

  const [limit, setLimit] = useState(getDynamicLimit);

  useEffect(() => {
    let timer;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setLimit(getDynamicLimit());
      }, 150);
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      clearTimeout(timer);
    };
  }, [defaultLimit, largeLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  return limit;
}

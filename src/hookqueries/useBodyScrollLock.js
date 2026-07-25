import { useEffect } from "react";

/**
 * Custom hook to lock body scrolling when a modal or drawer is open.
 * Prevents background page scrolling across all mobile and desktop browsers (iOS Safari, Android Chrome, Firefox, etc.)
 */
export function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;
    const originalDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
    };
  }, [isOpen]);
}

export default useBodyScrollLock;

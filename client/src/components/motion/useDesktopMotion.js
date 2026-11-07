// this file enables heavy motion only on desktop with full motion prefs
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../../lib/motion.js";

/**
 * Heavy effects (parallax, magnetic cursor) only on coarse-desktop + full motion.
 * Also respects `data-motion-lite` from MotionRuntime.
 */
export function useDesktopMotion() {
  const reducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") {
      setEnabled(false);
      return undefined;
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const wideEnough = window.matchMedia("(min-width: 900px)");

    const sync = () => {
      const lite = document.documentElement.dataset.motionLite === "true";
      setEnabled(finePointer.matches && wideEnough.matches && !lite);
    };

    sync();
    finePointer.addEventListener("change", sync);
    wideEnough.addEventListener("change", sync);

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion-lite"],
    });

    return () => {
      finePointer.removeEventListener("change", sync);
      wideEnough.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return enabled;
}

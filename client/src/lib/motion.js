/**
 * Shared motion system — single source of truth for timing, springs, and variants.
 * Import from here in every animated component. Do not hardcode durations/easings elsewhere.
 *
 * Package: motion/react (LazyMotion + m in wrappers — STEP 3)
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

/** Spring physics — prefer `soft` for UI; reserve `bouncy` for rare delight. */
export const springs = {
  soft: { type: "spring", stiffness: 110, damping: 28, mass: 1.05 },
  snappy: { type: "spring", stiffness: 240, damping: 32, mass: 0.95 },
  bouncy: { type: "spring", stiffness: 220, damping: 18, mass: 1 },
};

/** Durations in seconds (UI 0.4–1.0; hero may stretch slightly). */
export const duration = {
  instant: 0.01,
  fast: 0.42,
  base: 0.62,
  slow: 0.85,
  hero: 1.05,
  hover: 0.24,
  page: 0.55,
  modal: 0.44,
};

/** Cubic-bezier easings for tween transitions (not springs). */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.45, 0, 0.55, 1],
  emphasize: [0.16, 1, 0.3, 1],
};

/** Transform distances (px) — keep small for premium, not theatrical. */
export const distance = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  slide: 28,
};

/** Stagger gaps (seconds). */
export const stagger = {
  tight: 0.07,
  base: 0.11,
  loose: 0.16,
};

/** Hover / tap micro-interaction scales. */
export const interaction = {
  hoverLift: -3,
  hoverScale: 1.02,
  tapScale: 0.97,
  cardHoverScale: 1.015,
};

/** Scroll reveal viewport — use with whileInView everywhere. */
export const viewport = {
  once: true,
  amount: 0.2,
};

/** Reduced-motion tween (near-instant opacity only). */
const reducedTween = {
  duration: duration.instant,
  ease: "linear",
};

/* -------------------------------------------------------------------------- */
/* Transition helpers                                                         */
/* -------------------------------------------------------------------------- */

export function springTransition(preset = "soft", overrides = {}) {
  const base = springs[preset] ?? springs.soft;
  return { ...base, ...overrides };
}

export function tweenTransition(msKey = "base", easeKey = "out", overrides = {}) {
  return {
    duration: duration[msKey] ?? duration.base,
    ease: ease[easeKey] ?? ease.out,
    ...overrides,
  };
}

/**
 * Pick a calm opacity-only transition when the user prefers reduced motion.
 */
export function withMotionTransition(reducedMotion, motionTransition) {
  if (reducedMotion) return reducedTween;
  return motionTransition;
}

/* -------------------------------------------------------------------------- */
/* Variant factories (always respect reduced motion)                          */
/* -------------------------------------------------------------------------- */

export function fadeUp(reducedMotion = false) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: reducedTween },
      exit: { opacity: 0, transition: reducedTween },
    };
  }
  // Tweens (not springs) for entrances — springs overshoot and look like a shake on refresh
  return {
    hidden: { opacity: 0, y: distance.md },
    visible: {
      opacity: 1,
      y: 0,
      transition: tweenTransition("base", "out"),
    },
    exit: {
      opacity: 0,
      y: distance.xs,
      transition: tweenTransition("fast", "out"),
    },
  };
}

export function scaleIn(reducedMotion = false) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: reducedTween },
      exit: { opacity: 0, transition: reducedTween },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: tweenTransition("base", "out"),
    },
    exit: {
      opacity: 0,
      scale: 0.99,
      transition: tweenTransition("fast", "out"),
    },
  };
}

export function clipReveal(reducedMotion = false, { heavy = true } = {}) {
  // clip-path is expensive — fall back to transform/opacity scale on lite/mobile
  if (reducedMotion || !heavy) {
    return scaleIn(reducedMotion);
  }
  return {
    hidden: {
      opacity: 0,
      clipPath: "inset(8% 0 92% 0)",
    },
    visible: {
      opacity: 1,
      // Fully open inset — clear to "none" in Reveal onAnimationComplete
      clipPath: "inset(0 0 0 0)",
      transition: tweenTransition("slow", "emphasize"),
    },
    exit: {
      opacity: 0,
      clipPath: "inset(0 0 100% 0)",
      transition: tweenTransition("fast", "out"),
    },
  };
}

export function staggerContainer(reducedMotion = false, { lite = false } = {}) {
  if (reducedMotion || lite) {
    return {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: lite && !reducedMotion ? stagger.tight : 0,
          delayChildren: 0,
        },
      },
      exit: {},
    };
  }
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger.base,
        delayChildren: stagger.tight,
      },
    },
    exit: {
      transition: {
        staggerChildren: stagger.tight,
        staggerDirection: -1,
      },
    },
  };
}

export function staggerItem(reducedMotion = false) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: reducedTween },
      exit: { opacity: 0, transition: reducedTween },
    };
  }
  return {
    hidden: { opacity: 0, y: distance.sm },
    visible: {
      opacity: 1,
      y: 0,
      transition: tweenTransition("base", "out"),
    },
    exit: {
      opacity: 0,
      y: distance.xs,
      transition: tweenTransition("fast", "out"),
    },
  };
}

export function slideIn(reducedMotion = false, axis = "y") {
  const from =
    axis === "x"
      ? { x: distance.slide, y: 0 }
      : { y: distance.slide, x: 0 };
  const exitTo =
    axis === "x"
      ? { x: -distance.sm, y: 0 }
      : { y: -distance.xs, x: 0 };

  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: reducedTween },
      exit: { opacity: 0, transition: reducedTween },
    };
  }
  return {
    hidden: { opacity: 0, ...from },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: tweenTransition("base", "out"),
    },
    exit: {
      opacity: 0,
      ...exitTo,
      transition: tweenTransition("page", "out"),
    },
  };
}

/** Soft word/line reveal — blur only when heavy effects are allowed. */
export function wordReveal(reducedMotion = false, { heavy = true } = {}) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: reducedTween },
      exit: { opacity: 0, transition: reducedTween },
    };
  }
  if (!heavy) {
    return {
      hidden: { opacity: 0, y: "0.35em" },
      visible: {
        opacity: 1,
        y: "0em",
        transition: tweenTransition("base", "out"),
      },
      exit: {
        opacity: 0,
        y: "0.15em",
        transition: tweenTransition("fast", "out"),
      },
    };
  }
  return {
    hidden: { opacity: 0, y: "0.35em", filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: "0em",
      filter: "blur(0px)",
      transition: tweenTransition("base", "out"),
    },
    exit: {
      opacity: 0,
      y: "0.15em",
      filter: "blur(2px)",
      transition: tweenTransition("fast", "out"),
    },
  };
}

/** Page enter/exit — mirror entrance on leave. */
export function pageTransition(reducedMotion = false) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: reducedTween },
      exit: { opacity: 0, transition: reducedTween },
    };
  }
  return {
    initial: { opacity: 0, y: distance.sm },
    animate: {
      opacity: 1,
      y: 0,
      transition: tweenTransition("page", "out"),
    },
    exit: {
      opacity: 0,
      y: -distance.xs,
      transition: tweenTransition("page", "out"),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * prefers-reduced-motion helper. Prefer this over calling useReducedMotion
 * directly so call sites stay consistent.
 */
export function usePrefersReducedMotion() {
  return Boolean(useReducedMotion());
}

/**
 * Tracks MotionRuntime's data-motion-lite + narrow viewports.
 * Heavy effects (clip-path, blur, parallax, magnetic) should check `allowHeavy`.
 */
function readIsNarrow() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(min-width: 900px)").matches;
}

function readIsLiteDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (document.documentElement.dataset.motionLite === "true") return true;
  const { hardwareConcurrency, deviceMemory } = navigator;
  return Boolean(
    (hardwareConcurrency && hardwareConcurrency <= 4)
    || (deviceMemory && deviceMemory <= 4)
  );
}

export function useMotionCapability() {
  const reducedMotion = usePrefersReducedMotion();
  // Seed from the real viewport on first paint — starting at false made phones
  // briefly run clipReveal (opacity 0) then switch variants and stay blank.
  const [lite, setLite] = useState(readIsLiteDevice);
  const [narrow, setNarrow] = useState(readIsNarrow);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const wide = window.matchMedia("(min-width: 900px)");
    const sync = () => {
      setLite(
        document.documentElement.dataset.motionLite === "true" || readIsLiteDevice()
      );
      setNarrow(!wide.matches);
    };
    sync();
    wide.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion-lite"],
    });
    return () => {
      wide.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  const allowHeavy = !reducedMotion && !lite && !narrow;
  return { reducedMotion, lite, narrow, allowHeavy };
}

/**
 * Full motion config for a component — variants already resolved for a11y + device class.
 */
export function useMotionConfig() {
  const { reducedMotion, lite, narrow, allowHeavy } = useMotionCapability();
  const calm = reducedMotion || lite;

  return {
    reducedMotion,
    lite,
    narrow,
    allowHeavy,
    viewport,
    springs,
    duration,
    ease,
    distance,
    stagger,
    interaction,
    transition: {
      soft: withMotionTransition(calm, springTransition("soft")),
      snappy: withMotionTransition(calm, springTransition("snappy")),
      bouncy: withMotionTransition(calm, springTransition("soft")),
      tween: withMotionTransition(calm, tweenTransition("base", "out")),
      page: withMotionTransition(calm, tweenTransition("page", "out")),
      hover: withMotionTransition(calm, tweenTransition("hover", "out")),
    },
    variants: {
      fadeUp: fadeUp(reducedMotion),
      clipReveal: clipReveal(reducedMotion, { heavy: allowHeavy }),
      staggerContainer: staggerContainer(reducedMotion, { lite }),
      staggerItem: staggerItem(reducedMotion),
      scaleIn: scaleIn(reducedMotion),
      slideIn: slideIn(reducedMotion, "y"),
      slideInX: slideIn(reducedMotion, "x"),
      wordReveal: wordReveal(reducedMotion, { heavy: allowHeavy }),
      page: pageTransition(reducedMotion),
    },
    hover: calm
      ? {}
      : { y: interaction.hoverLift, transition: springTransition("snappy") },
    tap: calm
      ? {}
      : { scale: interaction.tapScale, transition: springTransition("snappy") },
    hoverScale: calm
      ? {}
      : {
          scale: interaction.hoverScale,
          transition: springTransition("snappy"),
        },
  };
}

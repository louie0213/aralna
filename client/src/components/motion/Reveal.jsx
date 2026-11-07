// this file animates elements into view with motion variants
import { useRef } from "react";
import { useMotionConfig } from "../../lib/motion.js";
import { motionTag } from "./motionTag.js";

const VARIANT_MAP = {
  fadeUp: "fadeUp",
  clipReveal: "clipReveal",
  scaleIn: "scaleIn",
  slideIn: "slideIn",
  slideInX: "slideInX",
};

function parseDelay(delay) {
  if (delay == null || delay === false) return 0;
  if (typeof delay === "number") return delay;
  const raw = String(delay).trim();
  if (raw.endsWith("ms")) return (Number.parseFloat(raw) || 0) / 1000;
  if (raw.endsWith("s")) return Number.parseFloat(raw) || 0;
  return Number(raw) || 0;
}

/**
 * Scroll reveal wrapper — one focal entrance per block.
 * @param {"fadeUp"|"clipReveal"|"scaleIn"|"slideIn"|"slideInX"} variant
 * @param {boolean} immediate — animate on mount (above-the-fold); avoids stuck opacity:0
 */
export default function Reveal({
  as = "div",
  variant = "fadeUp",
  delay = 0,
  once,
  amount,
  immediate = false,
  className,
  style,
  children,
  onAnimationComplete,
  ...props
}) {
  const ref = useRef(null);
  const { variants, viewport, reducedMotion } = useMotionConfig();
  const MotionTag = motionTag(as);
  const key = VARIANT_MAP[variant] || "fadeUp";
  const resolved = variants[key] || variants.fadeUp;
  const delaySec = parseDelay(delay);

  const handleAnimationComplete = (definition) => {
    // Drop clip-path after a full open so borders/shadows are never clipped.
    // Do not force opacity here — fighting Motion mid-tween causes a visible shake.
    if (key === "clipReveal" && definition === "visible" && ref.current) {
      ref.current.style.clipPath = "none";
    }
    onAnimationComplete?.(definition);
  };

  return (
    <MotionTag
      className={className}
      style={style}
      variants={resolved}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={
        immediate
          ? undefined
          : {
              once: once ?? viewport.once,
              amount: amount ?? Math.min(viewport.amount, 0.1),
            }
      }
      transition={
        delaySec > 0
          ? { delay: reducedMotion ? 0 : delaySec }
          : undefined
      }
      {...props}
      ref={ref}
      onAnimationComplete={handleAnimationComplete}
    >
      {children}
    </MotionTag>
  );
}

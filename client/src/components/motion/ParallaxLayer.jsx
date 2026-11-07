// this file adds scroll-linked parallax movement
import { useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useMotionConfig } from "../../lib/motion.js";
import { useDesktopMotion } from "./useDesktopMotion.js";
import { motionTag } from "./motionTag.js";

/**
 * Scroll-linked parallax on transform only. Disabled on mobile / lite / reduced motion.
 * @param {number} offset — max translate in px (positive = moves slower / deeper)
 */
export default function ParallaxLayer({
  as = "div",
  offset = 40,
  className,
  style,
  children,
  ...props
}) {
  const ref = useRef(null);
  const desktop = useDesktopMotion();
  const { reducedMotion } = useMotionConfig();
  const MotionTag = motionTag(as);
  const enabled = desktop && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    enabled ? [offset, -offset] : [0, 0]
  );

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{
        ...style,
        y: enabled ? y : 0,
      }}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

import { useMotionValue, useSpring } from "motion/react";
import { useRef } from "react";
import { springs, useMotionConfig } from "../../lib/motion.js";
import { useDesktopMotion } from "./useDesktopMotion.js";
import { motionTag } from "./motionTag.js";

/**
 * Soft magnetic pull toward the cursor on desktop. Falls back to hover/tap scale.
 */
export default function MagneticButton({
  as = "button",
  strength = 0.18,
  className,
  style,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}) {
  const ref = useRef(null);
  const desktop = useDesktopMotion();
  const { hoverScale, tap, reducedMotion } = useMotionConfig();
  const MotionTag = motionTag(as);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springs.soft);
  const springY = useSpring(y, springs.soft);

  const handleMove = (event) => {
    onMouseMove?.(event);
    if (!desktop || reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  };

  const handleLeave = (event) => {
    onMouseLeave?.(event);
    x.set(0);
    y.set(0);
  };

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{
        ...style,
        x: desktop ? springX : 0,
        y: desktop ? springY : 0,
      }}
      whileHover={hoverScale}
      whileTap={tap}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

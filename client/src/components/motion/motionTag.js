// this file maps HTML tags to motion elements safely
import { m } from "motion/react";

const customCache = new Map();

/**
 * Resolve an HTML tag string or React component to a LazyMotion `m` component.
 */
export function motionTag(as = "div") {
  if (typeof as === "string") return m[as] || m.div;
  if (customCache.has(as)) return customCache.get(as);
  const Comp = m.create(as);
  customCache.set(as, Comp);
  return Comp;
}

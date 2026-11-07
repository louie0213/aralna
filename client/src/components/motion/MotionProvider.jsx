// this file provides LazyMotion so animations load once for the app
import { LazyMotion, domAnimation } from "motion/react";

/**
 * App-level LazyMotion gate — loads the domAnimation feature set once.
 * All wrappers must use `m` (not `motion`) so the strict tree stays lean.
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

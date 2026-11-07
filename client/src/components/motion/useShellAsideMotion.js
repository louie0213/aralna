// this file shares sidebar open and collapse motion targets
import { useMotionConfig } from "../../lib/motion.js";

/**
 * Shared aside x targets for student/admin shells.
 * Desktop collapse and mobile drawer both use transform only.
 */
// this hook shares sidebar open and collapse motion targets
export function useShellAsideMotion({ isMobile, mobileMenuOpen, sidebarCollapsed }) {
  const { reducedMotion, transition } = useMotionConfig();

  const x = isMobile
    ? mobileMenuOpen
      ? 0
      : "-105%"
    : sidebarCollapsed
      ? "-100%"
      : 0;

  return {
    animate: { x },
    transition: reducedMotion ? transition.tween : transition.soft,
    initial: false,
  };
}

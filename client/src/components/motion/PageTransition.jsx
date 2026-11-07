// this file animates page enter and exit on route changes
import { AnimatePresence, m } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { distance, useMotionConfig } from "../../lib/motion.js";

function getRouteOrder(pathname) {
  if (pathname === "/app") return 0;
  if (pathname === "/app/upload") return 1;
  if (pathname === "/app/reviewers") return 2;
  if (pathname.startsWith("/app/reviewers/")) return 3;
  if (pathname === "/app/quizzes") return 4;
  if (pathname.startsWith("/app/quizzes/")) return 5;
  if (pathname === "/admin") return 0;
  if (pathname === "/admin/users") return 1;
  if (pathname === "/admin/files") return 2;
  if (pathname === "/admin/quizzes") return 3;
  if (pathname === "/admin/admins/new") return 4;
  return -1;
}

/**
 * Route-level enter/exit using shared page variants.
 * Drop-in replacement for the CSS RouteTransition (wire in STEP 4).
 */
export default function PageTransition() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const { variants, reducedMotion } = useMotionConfig();
  const previousOrder = getRouteOrder(previousPath.current);
  const currentOrder = getRouteOrder(pathname);
  const goingBack =
    currentOrder >= 0 && previousOrder >= 0 && currentOrder < previousOrder;

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    previousPath.current = pathname;
  }, [pathname]);

  const enterY = reducedMotion ? 0 : goingBack ? -distance.sm : distance.sm;
  const exitY = reducedMotion ? 0 : goingBack ? distance.xs : -distance.xs;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        className="route-transition"
        initial={{ opacity: 0, y: enterY }}
        animate={variants.page.animate}
        exit={{
          opacity: 0,
          y: exitY,
          transition: variants.page.exit.transition,
        }}
      >
        <Outlet />
      </m.div>
    </AnimatePresence>
  );
}

import { AnimatePresence, m } from "motion/react";
import { useMotionConfig } from "../../lib/motion.js";

/**
 * Mobile drawer scrim — opacity only, mirrored enter/exit.
 */
export default function ShellBackdrop({ open, onClose, label = "Close navigation" }) {
  const { transition, reducedMotion } = useMotionConfig();

  return (
    <AnimatePresence>
      {open ? (
        <m.button
          key="shell-backdrop"
          type="button"
          className="admin-sidebar-backdrop"
          aria-label={label}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducedMotion ? transition.tween : transition.hover}
          onClick={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

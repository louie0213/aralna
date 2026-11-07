// this file staggers child enter animations as a group
import { useMotionConfig } from "../../lib/motion.js";
import { motionTag } from "./motionTag.js";

/**
 * Parent orchestrator — stagger children that use StaggerItem.
 * @param {boolean} immediate — animate on mount (above-the-fold)
 */
export function StaggerGroup({
  as = "div",
  className,
  style,
  delayChildren,
  staggerChildren,
  immediate = false,
  children,
  ...props
}) {
  const { variants, viewport, reducedMotion, lite, stagger } = useMotionConfig();
  const MotionTag = motionTag(as);

  const containerVariants = {
    ...variants.staggerContainer,
    visible: {
      ...variants.staggerContainer.visible,
      transition: {
        staggerChildren: reducedMotion || lite
          ? (lite && !reducedMotion ? stagger.tight : 0)
          : staggerChildren ?? stagger.base,
        delayChildren: reducedMotion || lite ? 0 : delayChildren ?? stagger.tight,
      },
    },
  };

  return (
    <MotionTag
      className={className}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={
        immediate
          ? undefined
          : {
              once: viewport.once,
              amount: Math.min(viewport.amount, 0.2),
            }
      }
      {...props}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Child of StaggerGroup — inherits orchestration via variants.
 */
export function StaggerItem({
  as = "div",
  className,
  style,
  children,
  ...props
}) {
  const { variants } = useMotionConfig();
  const MotionTag = motionTag(as);

  return (
    <MotionTag
      className={className}
      style={style}
      variants={variants.staggerItem}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

export default StaggerGroup;

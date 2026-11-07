// this file animates text by splitting letters or words
import { m } from "motion/react";
import { useMemo } from "react";
import { useMotionConfig } from "../../lib/motion.js";
import { motionTag } from "./motionTag.js";

/**
 * Per-word reveal with small y-offset + blur→sharp (falls back to opacity when reduced).
 * Defaults to immediate mount animation so nested headings never stay invisible.
 */
export default function SplitText({
  text = "",
  as = "span",
  className,
  style,
  immediate = true,
  children,
  ...props
}) {
  const { variants, viewport } = useMotionConfig();
  const MotionTag = motionTag(as);
  const content = children ?? text;

  const words = useMemo(() => {
    if (typeof content !== "string") return null;
    return content.split(/(\s+)/).filter((part) => part.length > 0);
  }, [content]);

  const viewProps = immediate
    ? { animate: "visible" }
    : { whileInView: "visible", viewport };

  if (!words) {
    return (
      <MotionTag
        className={className}
        style={style}
        variants={variants.fadeUp}
        initial="hidden"
        {...viewProps}
        {...props}
      >
        {content}
      </MotionTag>
    );
  }

  const isInlineHost = as === "span" || as === "a" || as === "em" || as === "strong";

  return (
    <MotionTag
      className={className}
      style={isInlineHost ? { display: "inline-block", ...style } : style}
      variants={variants.staggerContainer}
      initial="hidden"
      {...viewProps}
      {...props}
    >
      {words.map((word, index) => {
        if (/^\s+$/.test(word)) {
          return <span key={`space-${index}`}>{word}</span>;
        }
        return (
          <m.span
            key={`${word}-${index}`}
            style={{ display: "inline-block" }}
            variants={variants.wordReveal}
          >
            {word}
          </m.span>
        );
      })}
    </MotionTag>
  );
}

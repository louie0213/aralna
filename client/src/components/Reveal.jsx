// this file reveals elements with a simple scroll intersection animation
import { useLayoutEffect, useRef } from 'react';

let revealObserver;

function getRevealObserver() {
  if (revealObserver || typeof IntersectionObserver === 'undefined') return revealObserver;

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.revealed = 'true';
      delete entry.target.dataset.revealPending;
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  return revealObserver;
}

export default function Reveal({ as: Element = 'div', delay, style, children, ...props }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    const observer = getRevealObserver();
    if (!element || !observer) return undefined;

    element.dataset.revealPending = 'true';
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      delete element.dataset.revealPending;
    };
  }, []);

  const revealStyle = delay ? { ...style, '--motion-delay': delay } : style;
  return (
    <Element
      {...props}
      ref={ref}
      data-reveal="true"
      style={revealStyle}
    >
      {children}
    </Element>
  );
}

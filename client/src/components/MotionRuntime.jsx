// this file sets motion preferences based on device power
import { useEffect } from 'react';

function isLowPowerDevice() {
  const { hardwareConcurrency, deviceMemory } = navigator;
  return (hardwareConcurrency && hardwareConcurrency <= 4) || (deviceMemory && deviceMemory <= 4);
}

export default function MotionRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const ambientObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          target.dataset.motionActive = String(isIntersecting);
        });
      }, { rootMargin: '80px', threshold: 0 });

    if (isLowPowerDevice()) root.dataset.motionLite = 'true';

    const updateVisibility = () => {
      root.dataset.motionHidden = String(document.hidden);
    };
    const observeAmbient = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('[data-motion-ambient]')) ambientObserver?.observe(node);
      node.querySelectorAll('[data-motion-ambient]').forEach((element) => ambientObserver?.observe(element));
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    observeAmbient(document.body);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(observeAmbient));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      mutationObserver.disconnect();
      ambientObserver?.disconnect();
      delete root.dataset.motionLite;
      delete root.dataset.motionHidden;
      document.querySelectorAll('[data-motion-active]').forEach((element) => {
        delete element.dataset.motionActive;
      });
    };
  }, []);

  return null;
}

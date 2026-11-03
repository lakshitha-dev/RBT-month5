import { useLayoutEffect, type RefObject } from 'react';

/**
 * Sizes a one-line display word so it exactly fills its element's width, measured after the
 * webfont loads and again on every resize. The CSS size is the fallback before this runs.
 */
export function useFitWidth(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    const word = el?.firstElementChild as HTMLElement | null;
    if (!el || !word || typeof ResizeObserver === 'undefined') return;

    let lastWidth = -1;
    const fit = () => {
      const target = el.clientWidth;
      if (!target || target === lastWidth) return;
      lastWidth = target;
      el.style.fontSize = '';
      const base = parseFloat(getComputedStyle(el).fontSize);
      const actual = word.getBoundingClientRect().width;
      if (!actual) return;
      el.style.fontSize = `${Math.floor(base * (target / actual) * 0.995 * 100) / 100}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(() => {
      lastWidth = -1;
      fit();
    });
    return () => ro.disconnect();
  }, [ref]);
}

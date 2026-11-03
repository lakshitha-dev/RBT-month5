// Entrances for [data-reveal] elements: each rises into place once, the first time it enters the
// viewport. The hidden state only applies under html.js (set in index.html) and only without
// prefers-reduced-motion, so content is never left invisible if this script does not run.
export function watchReveals() {
  if (!('IntersectionObserver' in window)) {
    document.documentElement.classList.remove('js');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        // an attribute, not a class: React rewrites className when a prop changes, never this
        (e.target as HTMLElement).dataset.in = '';
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );

  const scan = () => {
    document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-watched])').forEach((el) => {
      el.dataset.watched = '';
      io.observe(el);
    });
  };
  // routes render after data arrives, so keep picking up new elements
  new MutationObserver(scan).observe(document.getElementById('root')!, { childList: true, subtree: true });
  scan();
}

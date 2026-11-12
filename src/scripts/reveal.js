// Blocks fade up the first time they scroll into view; ones that enter together stagger.
// Base.astro inlines this file at the end of <body>, so blocks are tagged before the first paint, and
// astro.config.mjs hashes it for the Content Security Policy.
// ponytail: tagged by selector, not by class, so CMS Markdown (which can't carry classes) reveals too.
if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach(({ target }, i) => {
          target.style.setProperty('--delay', `${Math.min(i, 6) * 70}ms`);
          target.dataset.reveal = 'shown';
          io.unobserve(target);
        });
    },
    { threshold: 0.1 },
  );
  document
    .querySelectorAll(
      'main :is(h1, h2, h3, p, ul, ol, dl, pre, blockquote, .card, .panel, .aspect-video):not([data-scene] *, .card *, .panel *, li *), footer .wrap > *',
    )
    .forEach((el) => {
      el.dataset.reveal = '';
      io.observe(el);
    });
}

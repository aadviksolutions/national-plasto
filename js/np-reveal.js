/**
 * Scroll-reveal for [data-scroll] blocks (the supreme.co.in slide-up / fade-in).
 * Supreme's own ScrollOut call needs half of an element on screen, so blocks
 * taller than two screens never appeared; here a block is revealed as soon as
 * a small part of it scrolls into view. Without IntersectionObserver, or with
 * reduced motion, nothing is hidden.
 */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var els = [].slice.call(document.querySelectorAll('[data-scroll]'));
  if (!els.length) return;

  var vh = window.innerHeight || document.documentElement.clientHeight;
  els.forEach(function (el) {
    el.classList.add('np-reveal');
    if (el.classList.contains('toTop')) el.classList.add('np-reveal-up');
    // already on screen: show it straight away, no animation
    var r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.classList.add('np-in');
  });
  document.documentElement.classList.add('np-anim');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('np-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  els.forEach(function (el) { if (!el.classList.contains('np-in')) io.observe(el); });

  // safety net: never leave anything hidden
  setTimeout(function () {
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || vh)) el.classList.add('np-in');
    });
  }, 4000);
})();

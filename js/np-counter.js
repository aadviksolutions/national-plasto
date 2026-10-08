/**
 * National Plasto - Animated Counter Component
 * Triggers smooth, premium ease-out counting animation when stats sections scroll into view.
 */
(function () {
  'use strict';

  // Respect user reduced-motion setting
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Ease-out cubic: starts with momentum, settles smoothly onto target
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Format numbers with comma grouping (e.g. 1200 -> "1,200")
  function formatValue(val, useComma) {
    var rounded = Math.round(val);
    if (useComma || rounded >= 1000) {
      return rounded.toLocaleString('en-US');
    }
    return rounded.toString();
  }

  function animateSingleCounter(el, delay) {
    var rawTarget = el.getAttribute('data-target');
    var target = parseFloat(rawTarget);
    if (isNaN(target)) {
      var numMatch = el.textContent.replace(/,/g, '').match(/\d+(\.\d+)?/);
      if (numMatch) {
        target = parseFloat(numMatch[0]);
      } else {
        return;
      }
    }

    var useComma = el.getAttribute('data-format') === 'comma' || target >= 1000;

    // Tailored duration for natural rhythm
    var duration = 1800;
    if (target <= 10) {
      duration = 950;
    } else if (target <= 50) {
      duration = 1350;
    } else if (target <= 300) {
      duration = 1600;
    } else {
      duration = 1950;
    }

    var customDur = parseFloat(el.getAttribute('data-duration'));
    if (!isNaN(customDur) && customDur > 0) duration = customDur;

    var start = 0;
    var startTime = null;
    var card = el.closest('.np-stat, .value_content, .plant_metric_item');

    setTimeout(function () {
      if (card) card.classList.add('is-counting');

      function step(now) {
        if (!startTime) startTime = now;
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = easeOutCubic(progress);
        var current = start + (target - start) * eased;

        el.textContent = formatValue(current, useComma);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = formatValue(target, useComma);
          if (card) {
            card.classList.remove('is-counting');
            card.classList.add('is-counted');
          }
        }
      }

      requestAnimationFrame(step);
    }, delay || 0);
  }

  function animateGroup(group) {
    if (group._npCounterDone) return;
    group._npCounterDone = true;

    var counters = group.querySelectorAll('.np-counter');
    if (!counters.length) return;

    counters.forEach(function (counter, index) {
      var stagger = index * 55; // 55ms staggered wave effect
      animateSingleCounter(counter, stagger);
    });
  }

  function initCounters() {
    var counters = document.querySelectorAll('.np-counter');
    if (!counters.length) return;

    var groups = [];
    counters.forEach(function (counter) {
      var group = counter.closest('.np-stats, .we_village_flex, .we_village_card, .plants_section') || counter.parentElement;
      if (group && groups.indexOf(group) === -1) {
        groups.push(group);
      }

      var target = counter.getAttribute('data-target');
      if (!target) {
        var numMatch = counter.textContent.replace(/,/g, '').match(/\d+(\.\d+)?/);
        if (numMatch) {
          counter.setAttribute('data-target', numMatch[0]);
        }
      }

      // Initialize counter at 0 for animation
      counter.textContent = '0';
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateGroup(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.15
      });

      groups.forEach(function (grp) {
        observer.observe(grp);
      });
    } else {
      groups.forEach(function (grp) {
        animateGroup(grp);
      });
    }

    // Safety fallback: Never leave counters at 0 if already in view
    setTimeout(function () {
      groups.forEach(function (grp) {
        if (!grp._npCounterDone) {
          var r = grp.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.top < vh && r.bottom > 0) {
            animateGroup(grp);
          }
        }
      });
    }, 2000);
  }

  window.npInitCounters = initCounters;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }
})();


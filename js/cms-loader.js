/**
 * National Plasto - Dynamic CMS Content Loader
 * Reads customized content from data/cms-content.json or /api/cms and hydrates page elements.
 */
(function () {
  'use strict';

  function fetchCMSData() {
    // Try API first, fallback to static JSON
    return fetch('/api/cms?t=' + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then(function (res) {
        return res.data || res;
      })
      .catch(function () {
        return fetch('data/cms-content.json?t=' + Date.now())
          .then(function (res) { return res.json(); })
          .catch(function (err) {
            console.warn('[CMS Loader] Could not fetch CMS data:', err);
            return null;
          });
      });
  }

  function applyCMS(data) {
    if (!data) return;

    // 1. Apply elements with explicit data-cms attribute
    // Example: <h1 data-cms="home.hero.title"></h1>
    var elements = document.querySelectorAll('[data-cms]');
    elements.forEach(function (el) {
      var keyPath = el.getAttribute('data-cms');
      var val = getNestedValue(data, keyPath);
      if (val !== undefined && val !== null) {
        if (el.tagName === 'IMG') {
          el.src = val;
        } else if (el.tagName === 'A' && el.getAttribute('data-cms-attr') === 'href') {
          el.href = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // 2. Hydrate global elements (phone numbers, email, address in footers)
    if (data.general) {
      var emailLinks = document.querySelectorAll('a[href^="mailto:"]');
      if (data.general.contactEmail && emailLinks.length > 0) {
        emailLinks.forEach(function (a) {
          a.href = 'mailto:' + data.general.contactEmail;
          if (a.textContent.includes('@')) a.textContent = data.general.contactEmail;
        });
      }
    }
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : undefined;
    }, obj);
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetchCMSData().then(applyCMS);
  });
})();

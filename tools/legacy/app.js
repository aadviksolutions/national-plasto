/**
 * National Plasto — Core Application Engine
 * Handles header scrolling, mega menu, search autocomplete,
 * animated stats, modals, and mobile off-canvas drawer.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header Shrink on Scroll
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteHeader?.classList.add('scrolled');
    } else {
      siteHeader?.classList.remove('scrolled');
    }
  }, { passive: true });

  // 2. Animated Number Counters (Intersection Observer)
  const counterElements = document.querySelectorAll('[data-counter-target]');
  if (counterElements.length > 0) {
    const observerOptions = { threshold: 0.25 };
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-counter-target'), 10);
          const duration = 1600;
          const start = 0;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = (target - start) / steps;
          let current = start;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(current);
            }
          }, stepTime);

          observer.unobserve(el);
        }
      });
    }, observerOptions);

    counterElements.forEach(el => counterObserver.observe(el));
  }

  // 3. Global Product Search & Autocomplete
  const searchTrigger = document.getElementById('searchTrigger');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  function openSearch() {
    searchOverlay?.classList.add('active');
    setTimeout(() => searchInput?.focus(), 150);
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    searchOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  searchTrigger?.addEventListener('click', openSearch);
  searchClose?.addEventListener('click', closeSearch);

  // Keyboard shortcut Ctrl+K or /
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeAllModals();
    }
  });

  searchInput?.addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    if (!searchResults) return;

    if (!q) {
      searchResults.innerHTML = '';
      return;
    }

    const allProducts = window.NPPL_STORE ? window.NPPL_STORE.getProducts() : [];
    const matches = allProducts.filter(p => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.collection && p.collection.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }).slice(0, 8);

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--corporate-muted);">
          No products found matching "<strong>${escapeHtml(q)}</strong>". Try searching for "Chair", "Table", "Activa", or "Storage".
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.map(p => {
      const imgUrl = (p.images && p.images[0]) ? p.images[0].url : 'images/products/np-ntl-058-89dcdcfa74.jpg';
      return `
        <div class="search-result-item" onclick="openProductQuickView('${p.sku}'); closeSearch();">
          <img src="${imgUrl}" alt="${escapeHtml(p.name)}" class="search-result-thumb" onerror="this.src='images/brand/company-photo.jpg'" />
          <div class="search-result-info">
            <div class="search-result-title">${escapeHtml(p.name)}</div>
            <div class="search-result-meta">${p.sku} &bull; ${escapeHtml(p.collection || 'NATIONAL')} &bull; ${escapeHtml(p.category || 'Moulded Furniture')}</div>
          </div>
          <span class="search-result-action">View Specs &rarr;</span>
        </div>
      `;
    }).join('');
  });

  // 4. Mobile Drawer Controls
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileDrawerClose = document.getElementById('mobileDrawerClose');

  mobileMenuToggle?.addEventListener('click', () => {
    mobileDrawer?.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  mobileDrawerClose?.addEventListener('click', () => {
    mobileDrawer?.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Mobile submenu accordion
  document.querySelectorAll('.mobile-nav-toggle-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = btn.closest('.mobile-nav-item');
      const submenu = parent?.querySelector('.mobile-submenu');
      submenu?.classList.toggle('active');
    });
  });
});

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// 5. Global Modal Helpers
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

// Quick View Modal
window.openProductQuickView = function (sku) {
  const all = window.NPPL_STORE ? window.NPPL_STORE.getProducts() : [];
  const product = all.find(p => p.sku === sku) || all[0];
  if (!product) return;

  const modal = document.getElementById('quickViewModal');
  const mainImg = document.getElementById('qvMainImg');
  const thumbsRow = document.getElementById('qvThumbsRow');
  const brandTier = document.getElementById('qvBrandTier');
  const nameEl = document.getElementById('qvName');
  const skuEl = document.getElementById('qvSku');
  const descEl = document.getElementById('qvDesc');
  const specsTbody = document.getElementById('qvSpecsTbody');
  const quoteBtn = document.getElementById('qvQuoteBtn');

  if (mainImg) {
    const primaryImg = (product.images && product.images[0]) ? product.images[0].url : 'images/products/np-ntl-058-89dcdcfa74.jpg';
    mainImg.src = primaryImg;
    mainImg.alt = product.name;
  }

  if (thumbsRow && product.images && product.images.length > 1) {
    thumbsRow.innerHTML = product.images.map((img, i) => `
      <img src="${img.url}" class="quick-view-thumb ${i === 0 ? 'active' : ''}" onclick="changeQvImage('${img.url}', this)" alt="${product.name}" />
    `).join('');
  } else if (thumbsRow) {
    thumbsRow.innerHTML = '';
  }

  if (brandTier) brandTier.textContent = product.collection || 'NATIONAL PLASTO';
  if (nameEl) nameEl.textContent = product.name;
  if (skuEl) skuEl.textContent = `Model SKU: ${product.sku} | 100% Quality Inspected`;
  if (descEl) descEl.textContent = `${product.name} is heavy-duty polymer moulded furniture engineered by National Plasto for extreme durability, ergonomic posture support, and long service life across Indian homes, banquets, and commercial spaces.`;

  if (specsTbody) {
    specsTbody.innerHTML = `
      <tr><th>Category</th><td>${product.category || 'Moulded Furniture'}</td></tr>
      <tr><th>Brand Vertical</th><td>${product.collection || 'National'}</td></tr>
      <tr><th>Polymer Material</th><td>${product.isPremium ? '100% Prime Virgin Polypropylene' : 'High-Impact Copolymer Blend'}</td></tr>
      <tr><th>Tested Static Load</th><td>200 kg Static Tested</td></tr>
      <tr><th>UV Resistance</th><td>All-Weather UV Stabilized</td></tr>
      <tr><th>Manufacturing Plant</th><td>ISO 9001:2015 Certified Units</td></tr>
    `;
  }

  if (quoteBtn) {
    quoteBtn.onclick = function () {
      closeAllModals();
      openEnquiryModal(`${product.name} (${product.sku})`);
    };
  }

  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.changeQvImage = function (url, el) {
  const mainImg = document.getElementById('qvMainImg');
  if (mainImg) mainImg.src = url;
  document.querySelectorAll('.quick-view-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
};

// RFQ / Lead Enquiry Modal
window.openEnquiryModal = function (productPrefill) {
  const modal = document.getElementById('enquiryModal');
  const reqInput = document.getElementById('enquiryRequirement');
  if (reqInput && productPrefill) {
    reqInput.value = `Requesting volume quotation, MOQ, and technical datasheet for: ${productPrefill}`;
  }
  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.submitEnquiryForm = function (e) {
  e.preventDefault();
  const form = document.getElementById('enquiryForm');
  const banner = document.getElementById('enquirySuccessBanner');
  if (banner && form) {
    form.style.display = 'none';
    banner.classList.add('active');
    setTimeout(() => {
      closeAllModals();
      form.reset();
      form.style.display = 'block';
      banner.classList.remove('active');
    }, 3500);
  }
};

// Distributor Application Modal
window.openDistributorModal = function () {
  const modal = document.getElementById('distributorModal');
  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.submitDistributorForm = function (e) {
  e.preventDefault();
  const form = document.getElementById('distributorForm');
  const banner = document.getElementById('distributorSuccessBanner');
  if (banner && form) {
    form.style.display = 'none';
    banner.classList.add('active');
    setTimeout(() => {
      closeAllModals();
      form.reset();
      form.style.display = 'block';
      banner.classList.remove('active');
    }, 4000);
  }
};

// Quick Catalogue Downloader
window.downloadCatalogueModal = function () {
  alert('Initiating download: National Plasto Corporate & Product Catalogue 2026 (PDF). Please check your browser downloads.');
};

// ==========================================================================
// SUPREME 1:1 CENTER HEADER SEARCH CONTROLLER
// ==========================================================================
window.searchToggle = function (btn, evt) {
  if (evt) evt.preventDefault();
  const searchMainBox = btn.closest('.search_main_box');
  if (!searchMainBox) return;

  const isActive = searchMainBox.classList.contains('active');
  if (isActive) {
    searchMainBox.classList.remove('active');
    const input = searchMainBox.querySelector('.header_search_input');
    if (input) input.blur();
  } else {
    searchMainBox.classList.add('active');
    const input = searchMainBox.querySelector('.header_search_input');
    if (input) {
      setTimeout(() => input.focus(), 80);
    }
  }
};

window.handleHeaderSearch = function (evt, inputEl) {
  if (evt.key === 'Enter') {
    window.executeHeaderSearch(inputEl);
  } else if (evt.key === 'Escape') {
    const searchMainBox = inputEl.closest('.search_main_box');
    if (searchMainBox) {
      searchMainBox.classList.remove('active');
      inputEl.blur();
    }
  }
};

window.executeHeaderSearch = function (triggerEl) {
  const searchMainBox = triggerEl.closest('.search_main_box');
  const input = searchMainBox ? searchMainBox.querySelector('.header_search_input') : null;
  const query = input ? input.value.trim() : '';
  if (query) {
    window.location.href = 'products.html?search=' + encodeURIComponent(query);
  }
};

// Global click outside to close center search
document.addEventListener('click', function (e) {
  const activeSearch = document.querySelector('.search_main_box.active');
  if (activeSearch && !activeSearch.contains(e.target)) {
    activeSearch.classList.remove('active');
  }
});

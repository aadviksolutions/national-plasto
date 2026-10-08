/**
 * National Plasto — Catalogue Page Engine (products.html)
 * High-performance client-side product discovery, multi-faceted filtering,
 * URL query param handling, sorting, and pagination.
 */

(function () {
  let allProducts = [];
  let filteredProducts = [];
  let currentPage = 1;
  const itemsPerPage = 16;

  // Active Filter State
  const activeFilters = {
    search: '',
    brands: new Set(),
    categories: new Set(),
    premiumOnly: false,
    sort: 'featured'
  };

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize dataset
    if (window.NPPL_STORE) {
      allProducts = window.NPPL_STORE.getProducts();
    }

    // 2. Read URL params (e.g. ?category=chairs or ?brand=next)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    const brandParam = urlParams.get('brand');
    const searchParam = urlParams.get('search');

    if (catParam) {
      activeFilters.categories.add(catParam.toLowerCase());
      const chk = document.querySelector(`input[data-filter-category="${catParam.toLowerCase()}"]`);
      if (chk) chk.checked = true;
    }

    if (brandParam) {
      activeFilters.brands.add(brandParam.toLowerCase());
      const chk = document.querySelector(`input[data-filter-brand="${brandParam.toLowerCase()}"]`);
      if (chk) chk.checked = true;
    }

    if (searchParam) {
      activeFilters.search = searchParam.toLowerCase();
      const sInput = document.getElementById('catalogSearchInput');
      if (sInput) sInput.value = searchParam;
    }

    // 3. Bind Filter Checkboxes
    document.querySelectorAll('input[data-filter-brand]').forEach(cb => {
      cb.addEventListener('change', () => {
        const val = cb.getAttribute('data-filter-brand').toLowerCase();
        if (cb.checked) activeFilters.brands.add(val);
        else activeFilters.brands.delete(val);
        currentPage = 1;
        applyFiltersAndRender();
      });
    });

    document.querySelectorAll('input[data-filter-category]').forEach(cb => {
      cb.addEventListener('change', () => {
        const val = cb.getAttribute('data-filter-category').toLowerCase();
        if (cb.checked) activeFilters.categories.add(val);
        else activeFilters.categories.delete(val);
        currentPage = 1;
        applyFiltersAndRender();
      });
    });

    const premiumCheck = document.getElementById('filterPremiumOnly');
    premiumCheck?.addEventListener('change', () => {
      activeFilters.premiumOnly = premiumCheck.checked;
      currentPage = 1;
      applyFiltersAndRender();
    });

    // 4. Bind Search Input
    const catalogSearchInput = document.getElementById('catalogSearchInput');
    catalogSearchInput?.addEventListener('input', function () {
      activeFilters.search = this.value.trim().toLowerCase();
      currentPage = 1;
      applyFiltersAndRender();
    });

    // 5. Bind Sort Select
    const sortSelect = document.getElementById('catalogSortSelect');
    sortSelect?.addEventListener('change', function () {
      activeFilters.sort = this.value;
      applyFiltersAndRender();
    });

    // 6. Reset Filters button
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      activeFilters.brands.clear();
      activeFilters.categories.clear();
      activeFilters.search = '';
      activeFilters.premiumOnly = false;
      document.querySelectorAll('.catalog-sidebar input[type="checkbox"]').forEach(c => c.checked = false);
      if (catalogSearchInput) catalogSearchInput.value = '';
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Initial render
    applyFiltersAndRender();
  });

  function applyFiltersAndRender() {
    filteredProducts = allProducts.filter(p => {
      // Search matching
      if (activeFilters.search) {
        const match =
          p.name.toLowerCase().includes(activeFilters.search) ||
          p.sku.toLowerCase().includes(activeFilters.search) ||
          (p.collection && p.collection.toLowerCase().includes(activeFilters.search)) ||
          (p.category && p.category.toLowerCase().includes(activeFilters.search));
        if (!match) return false;
      }

      // Brand matching
      if (activeFilters.brands.size > 0) {
        const pBrand = (p.collection || '').toLowerCase();
        let brandMatch = false;
        activeFilters.brands.forEach(b => {
          if (pBrand.includes(b)) brandMatch = true;
        });
        if (!brandMatch) return false;
      }

      // Category matching
      if (activeFilters.categories.size > 0) {
        const pCat = (p.categorySlug || p.category || '').toLowerCase();
        let catMatch = false;
        activeFilters.categories.forEach(c => {
          if (pCat.includes(c)) catMatch = true;
        });
        if (!catMatch) return false;
      }

      // Premium Virgin Polymer check
      if (activeFilters.premiumOnly && !p.isPremium) {
        return false;
      }

      return true;
    });

    // Sorting
    if (activeFilters.sort === 'name-asc') {
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeFilters.sort === 'name-desc') {
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
    } else if (activeFilters.sort === 'sku-asc') {
      filteredProducts.sort((a, b) => a.sku.localeCompare(b.sku));
    }

    renderGrid();
    renderPagination();
  }

  function renderGrid() {
    const grid = document.getElementById('catalogProductsGrid');
    const countEl = document.getElementById('catalogShowingCount');
    if (!grid) return;

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filteredProducts.length}</strong> of <strong>${allProducts.length}</strong> industrial &amp; consumer products`;
    }

    if (filteredProducts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: #FFFFFF; border: 1px solid var(--corporate-border); border-radius: 8px;">
          <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--corporate-navy); margin-bottom: 8px;">No Products Found</h3>
          <p style="color: var(--corporate-muted); font-size: 14px; margin-bottom: 20px;">Try adjusting your filters or search keywords.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="emptyResetBtn" onclick="document.getElementById('resetFiltersBtn')?.click()">Clear All Filters</button>
        </div>
      `;
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    grid.innerHTML = pageItems.map(p => {
      const imgUrl = (p.images && p.images[0]) ? p.images[0].url : 'images/products/np-ntl-058-89dcdcfa74.jpg';
      const collectionName = p.collection || 'NATIONAL';
      const isPremium = p.isPremium;

      return `
        <div class="product-card">
          <div class="product-card-top">
            <span class="product-brand-chip ${isPremium ? 'premium' : ''}">${collectionName}</span>
            <span class="product-sku-chip">${p.sku}</span>
          </div>

          <div class="product-card-img-wrap" onclick="openProductQuickView('${p.sku}')" style="cursor: pointer;">
            <img src="${imgUrl}" alt="${escapeHtml(p.name)}" class="product-card-img" loading="lazy" onerror="this.src='images/brand/company-photo.jpg'" />
          </div>

          <div>
            <h4 class="product-card-title">${escapeHtml(p.name)}</h4>
            <p class="product-card-cat">${escapeHtml(p.category || 'Moulded Furniture')}</p>

            <div class="product-card-specs">
              <span>200 kg Tested</span>
              <span>&bull;</span>
              <span>${isPremium ? 'Virgin Grade' : 'Semi-Virgin'}</span>
            </div>
          </div>

          <div class="product-card-actions">
            <button type="button" class="product-btn-view" onclick="openProductQuickView('${p.sku}')">Specs &rarr;</button>
            <button type="button" class="product-btn-quote" onclick="openEnquiryModal('${p.name} (${p.sku})')">Enquire</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderPagination() {
    const controls = document.getElementById('catalogPagination');
    if (!controls) return;

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (totalPages <= 1) {
      controls.innerHTML = '';
      return;
    }

    let html = '';
    if (currentPage > 1) {
      html += `<button type="button" class="page-btn" onclick="changeCatalogPage(${currentPage - 1})">&laquo;</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changeCatalogPage(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span style="padding: 0 4px; color: var(--corporate-muted);">&hellip;</span>`;
      }
    }

    if (currentPage < totalPages) {
      html += `<button type="button" class="page-btn" onclick="changeCatalogPage(${currentPage + 1})">&raquo;</button>`;
    }

    controls.innerHTML = html;
  }

  window.changeCatalogPage = function (pageNum) {
    currentPage = pageNum;
    renderGrid();
    renderPagination();
    document.getElementById('catalogProductsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
})();

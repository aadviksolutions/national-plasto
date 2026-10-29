/**
 * National Plasto - Admin CMS Management Script
 */
(function () {
  'use strict';

  // State
  let currentUser = null;
  let allProducts = [];
  let filteredProducts = [];
  let allMedia = [];
  let cmsData = {};
  let currentTargetFieldForMedia = null;
  let deletingProductId = null;

  // DOM Elements
  const authScreen = document.getElementById('authScreen');
  const appLayout = document.getElementById('appLayout');
  const loginForm = document.getElementById('loginForm');
  const authError = document.getElementById('authError');
  const pageTitle = document.getElementById('pageTitle');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const btnLogout = document.getElementById('btnLogout');
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');

  // App Mode ('server' or 'cloud')
  let appMode = 'cloud';

  // API Helper
  function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    const token = localStorage.getItem('np_admin_token') || sessionStorage.getItem('np_admin_token');
    if (token && !options.headers['Authorization']) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    options.credentials = 'same-origin';
    return fetch(url, options).then(async (res) => {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Endpoint returned non-JSON response');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && currentUser) {
          logout();
        }
        throw new Error(data.error || 'Request failed');
      }
      return data;
    });
  }

  function updateModeBadge() {
    const badge = document.getElementById('cmsModeBadge');
    if (!badge) return;
    if (appMode === 'server') {
      badge.style.background = '#DCFCE7';
      badge.style.color = '#15803D';
      badge.innerHTML = '<i class="fas fa-server"></i> Local Server Connected';
      badge.title = 'Connected to Express backend';
    } else {
      badge.style.background = '#E0F2FE';
      badge.style.color = '#0284C7';
      badge.innerHTML = '<i class="fas fa-cloud"></i> Vercel Cloud Mode';
      badge.title = 'Running in Vercel Cloud Mode. Edits are saved to browser storage and previewed live on the site.';
    }
  }

  // Toast System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" style="color: ${type === 'success' ? 'var(--success)' : 'var(--danger)'}"></i>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // ================= 1. AUTHENTICATION =================
  async function checkAuth() {
    // 1. Try server session check
    try {
      const res = await apiFetch('/api/auth/me');
      if (res && res.success && res.user) {
        currentUser = res.user;
        appMode = 'server';
        updateModeBadge();
        showApp();
        return;
      }
    } catch {
      // Local server not available or serverless session
    }

    // 2. Check client-side stored session in localStorage
    const savedToken = localStorage.getItem('np_admin_token') || sessionStorage.getItem('np_admin_token');
    const savedUser = localStorage.getItem('np_admin_user');
    if (savedToken && savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        appMode = 'cloud';
        updateModeBadge();
        showApp();
        return;
      } catch (e) {}
    }

    showAuth();
  }

  function showAuth() {
    currentUser = null;
    authScreen.style.display = 'flex';
    appLayout.style.display = 'none';
  }

  function showApp() {
    authScreen.style.display = 'none';
    appLayout.style.display = 'flex';
    sidebarUserName.textContent = (currentUser && currentUser.username) || 'Admin';
    updateModeBadge();
    initDashboard();

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && ['dashboard', 'products', 'cms', 'media', 'settings'].includes(initialHash)) {
      navigateTo(initialHash);
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'products', 'cms', 'media', 'settings'].includes(hash)) {
      navigateTo(hash);
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.style.display = 'none';
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    let loginSuccess = false;

    // 1. Try server login
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res && res.success) {
        currentUser = res.user || { username };
        appMode = 'server';
        const token = res.token || ('np_' + Date.now());
        localStorage.setItem('np_admin_token', token);
        localStorage.setItem('np_admin_user', JSON.stringify(currentUser));
        loginSuccess = true;
      }
    } catch (err) {
      console.warn('Server login not available, evaluating Cloud credentials:', err.message);
    }

    // 2. Fallback to Cloud verification if server unavailable / 405 / static
    if (!loginSuccess) {
      const validPass = localStorage.getItem('np_admin_password') || 'nationalplasto2026';
      if (username === 'admin' && password === validPass) {
        currentUser = {
          username: 'admin',
          lastLogin: new Date().toISOString(),
          mode: 'cloud'
        };
        appMode = 'cloud';
        const token = 'np_cloud_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('np_admin_token', token);
        localStorage.setItem('np_admin_user', JSON.stringify(currentUser));
        loginSuccess = true;
      }
    }

    if (loginSuccess) {
      updateModeBadge();
      showApp();
      showToast('Welcome back, Admin!');
    } else {
      authError.textContent = 'Invalid username or password';
      authError.style.display = 'block';
    }
  });

  function logout() {
    try {
      apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    localStorage.removeItem('np_admin_token');
    localStorage.removeItem('np_admin_user');
    sessionStorage.removeItem('np_admin_token');
    showAuth();
    showToast('Logged out successfully');
  }

  btnLogout.addEventListener('click', logout);

  // Mobile navigation toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // ================= 2. NAVIGATION =================
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.view-panel');

  window.navigateTo = function (target, subtab) {
    navItems.forEach((n) => {
      if (n.getAttribute('data-target') === target) {
        n.classList.add('active');
      } else {
        n.classList.remove('active');
      }
    });

    panels.forEach((p) => p.classList.remove('active'));
    const panelIdMap = {
      dashboard: 'panelDashboard',
      products: 'panelProducts',
      cms: 'panelCms',
      media: 'panelMedia',
      settings: 'panelSettings'
    };
    const targetPanel = document.getElementById(panelIdMap[target]) || document.getElementById(`panel${capitalize(target)}`) || document.getElementById('panelCMS');
    if (targetPanel) targetPanel.classList.add('active');

    const titles = {
      dashboard: 'Dashboard Overview',
      products: 'Products Manager',
      cms: 'Page Content CMS',
      media: 'Media Library',
      settings: 'Settings & Backup'
    };
    pageTitle.textContent = titles[target] || 'Dashboard';
    if (sidebar.classList.contains('open')) sidebar.classList.remove('open');

    // Trigger panel-specific loads
    if (target === 'dashboard') loadStats();
    if (target === 'products') loadProducts();
    if (target === 'cms') {
      loadCMS();
      switchCMSTab(subtab || 'home');
    }
    if (target === 'media') loadMedia();
  };

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      navigateTo(target);
    });
  });

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ================= 3. DASHBOARD =================
  async function initDashboard() {
    await loadProducts();
    await loadCMS();
    await loadMedia();
    await loadStats();
  }

  async function loadStats() {
    try {
      let stats = null;
      try {
        const res = await apiFetch('/api/stats');
        if (res && res.success) stats = res;
      } catch (e) {}

      // Calculate dynamically if API not available
      if (!stats) {
        const brands = {};
        const categories = {};
        (allProducts || []).forEach((p) => {
          if (p.b) brands[p.b] = (brands[p.b] || 0) + 1;
          if (p.c) categories[p.c] = (categories[p.c] || 0) + 1;
        });
        stats = {
          success: true,
          totalProducts: (allProducts || []).length,
          brands,
          categories,
          uploadedImagesCount: (allMedia || []).length
        };
      }

      document.getElementById('statTotalProducts').textContent = stats.totalProducts;
      document.getElementById('statTotalBrands').textContent = Object.keys(stats.brands || {}).length;
      document.getElementById('statTotalCategories').textContent = Object.keys(stats.categories || {}).length;
      document.getElementById('statTotalMedia').textContent = stats.uploadedImagesCount;

      // Render brand breakdown cards
      const container = document.getElementById('brandCardsContainer');
      if (container) {
        container.innerHTML = Object.entries(stats.brands || {})
          .map(([brand, count]) => `
            <div style="background:#F8FAFC; border:1px solid var(--slate-200); border-radius:12px; padding:16px;">
              <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--slate-500);">${escapeHtml(brand)}</div>
              <div style="font-size:24px; font-weight:800; color:var(--slate-900); margin:4px 0;">${count} <span style="font-size:13px; font-weight:500; color:var(--slate-500);">models</span></div>
              <button class="btn btn-secondary btn-sm" style="margin-top:6px;" onclick="filterProductsByBrand('${escapeHtml(brand)}')">View ${escapeHtml(brand)} &rarr;</button>
            </div>
          `).join('');
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  window.filterProductsByBrand = function (brand) {
    navigateTo('products');
    const pill = document.querySelector(`#brandPillGroup button[data-brand="${brand}"]`);
    if (pill) pill.click();
  };

  // Re-sync catalogue button
  const btnSyncCatalogue = document.getElementById('btnSyncCatalogue');
  const btnSettingsSync = document.getElementById('btnSettingsSync');
  async function triggerSync() {
    try {
      if (btnSyncCatalogue) {
        btnSyncCatalogue.disabled = true;
        btnSyncCatalogue.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
      }
      let serverSynced = false;
      try {
        const res = await apiFetch('/api/sync/catalogue', { method: 'POST' });
        if (res && res.success) {
          showToast(res.message || 'Catalogue re-synced successfully!');
          serverSynced = true;
        }
      } catch (e) {}

      if (!serverSynced) {
        exportData('catalogue');
        showToast('Compiled catalogue-2026.js & initiated download!');
      }
    } catch (err) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      if (btnSyncCatalogue) {
        btnSyncCatalogue.disabled = false;
        btnSyncCatalogue.innerHTML = '<i class="fas fa-sync-alt"></i> Re-Sync Catalogue';
      }
    }
  }
  if (btnSyncCatalogue) btnSyncCatalogue.addEventListener('click', triggerSync);
  if (btnSettingsSync) btnSettingsSync.addEventListener('click', triggerSync);

  // ================= 4. PRODUCTS MANAGEMENT =================
  async function loadProducts(silent = false) {
    try {
      // 1. Establish immediate baseline from cache if allProducts is empty
      const cached = localStorage.getItem('np_custom_products');
      if (cached && !allProducts.length) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allProducts = parsed;
            populateCategoryFilter();
            applyProductFilters();
          }
        } catch (e) {}
      }

      // 2. Fetch fresh live data from MySQL server API
      let loaded = false;
      try {
        const res = await apiFetch('/api/products?t=' + Date.now());
        if (res && res.success && Array.isArray(res.products)) {
          allProducts = res.products;
          try {
            localStorage.setItem('np_custom_products', JSON.stringify(allProducts));
          } catch (_) {}
          loaded = true;
        }
      } catch (e) {}

      // 3. Fallback to static data/products.json if server unreachable
      if (!loaded && !allProducts.length) {
        const staticRes = await fetch('data/products.json?t=' + Date.now());
        if (staticRes.ok) {
          allProducts = await staticRes.json();
          loaded = true;
        } else if (window.NP_CATALOGUE && Array.isArray(window.NP_CATALOGUE)) {
          allProducts = window.NP_CATALOGUE;
          loaded = true;
        }
      }

      if (loaded) {
        populateCategoryFilter();
        applyProductFilters();
      }
    } catch (err) {
      if (!silent) showToast('Error loading products: ' + err.message, 'error');
    }
  }

  function populateCategoryFilter() {
    const select = document.getElementById('categorySelectFilter');
    const currentVal = select.value;
    const cats = Array.from(new Set(allProducts.map((p) => p.c).filter(Boolean))).sort();
    select.innerHTML = '<option value="all">All Categories</option>' +
      cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    select.value = cats.includes(currentVal) ? currentVal : 'all';
  }

  // Filter toolbar bindings
  const searchInput = document.getElementById('productSearchInput');
  const categoryFilter = document.getElementById('categorySelectFilter');
  const brandPillGroup = document.getElementById('brandPillGroup');
  let activeBrandFilter = 'all';

  brandPillGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    brandPillGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeBrandFilter = btn.getAttribute('data-brand');
    applyProductFilters();
  });

  searchInput.addEventListener('input', () => applyProductFilters());
  categoryFilter.addEventListener('change', () => applyProductFilters());

  function applyProductFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = categoryFilter.value;

    filteredProducts = allProducts.filter((p) => {
      const matchBrand = activeBrandFilter === 'all' || (p.b && p.b.toLowerCase() === activeBrandFilter.toLowerCase());
      const matchCat = cat === 'all' || (p.c && p.c === cat);
      const matchQuery = !query ||
        (p.n && p.n.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.c && p.c.toLowerCase().includes(query));
      return matchBrand && matchCat && matchQuery;
    });

    document.getElementById('productFilteredCount').textContent = filteredProducts.length;
    renderProductsTable();
  }

  function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (filteredProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--slate-500);">No products found matching filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filteredProducts.slice(0, 50).map((p) => {
      const primaryImg = (p.img && p.img[0] && p.img[0].f) || 'images/brand/company-national-logo.png';
      const brandClass = `badge-${(p.b || 'national').toLowerCase()}`;
      const varCount = (p.img && p.img.length) || 1;

      return `
        <tr>
          <td>
            <img src="${escapeHtml(primaryImg)}" alt="" class="prod-img-thumb" onerror="this.src='images/brand/company-national-logo.png'">
          </td>
          <td><strong>${escapeHtml(p.n)}</strong></td>
          <td><code>${escapeHtml(p.sku || '-')}</code></td>
          <td><span class="badge ${brandClass}">${escapeHtml(p.b)}</span></td>
          <td>${escapeHtml(p.c)}</td>
          <td>${varCount} photos</td>
          <td style="text-align: right;">
            <div class="action-btns" style="justify-content: flex-end;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditProduct('${escapeHtml(p.id)}')" title="Edit Product">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="btn btn-outline-danger btn-sm" onclick="openDeleteProduct('${escapeHtml(p.id)}', '${escapeHtml(p.n)}')" title="Delete Product">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (filteredProducts.length > 50) {
      tbody.innerHTML += `
        <tr>
          <td colspan="7" style="text-align:center; padding:16px; font-size:13px; color:var(--slate-500); background:var(--slate-50);">
            Showing first 50 of ${filteredProducts.length} items. Use search bar to narrow results.
          </td>
        </tr>
      `;
    }
  }

  // --- Add / Edit Product Modal ---
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const btnOpenAddProduct = document.getElementById('btnOpenAddProduct');
  const btnQuickAddProduct = document.getElementById('btnQuickAddProduct');
  const btnSaveProduct = document.getElementById('btnSaveProduct');
  const prodImageUploadInput = document.getElementById('prodImageUploadInput');
  const prodPrimaryImage = document.getElementById('prodPrimaryImage');
  const prodImagePreviewWrap = document.getElementById('prodImagePreviewWrap');
  const prodImagePreview = document.getElementById('prodImagePreview');

  function openAddProduct() {
    productForm.reset();
    document.getElementById('prodEditId').value = '';
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    prodImagePreviewWrap.style.display = 'none';
    productModal.classList.add('active');
  }

  if (btnOpenAddProduct) btnOpenAddProduct.addEventListener('click', openAddProduct);
  if (btnQuickAddProduct) btnQuickAddProduct.addEventListener('click', () => {
    navigateTo('products');
    openAddProduct();
  });

  window.openEditProduct = function (id) {
    const prod = allProducts.find((p) => p.id === id || p.sku === id);
    if (!prod) return;

    document.getElementById('prodEditId').value = prod.id;
    document.getElementById('prodModelName').value = prod.n || '';
    document.getElementById('prodSku').value = prod.sku || '';
    document.getElementById('prodBrand').value = prod.b || 'National';
    document.getElementById('prodCategory').value = prod.c || 'Arm Chairs';

    const primaryImg = (prod.img && prod.img[0] && prod.img[0].f) || '';
    prodPrimaryImage.value = primaryImg;

    if (primaryImg) {
      prodImagePreview.src = primaryImg;
      prodImagePreviewWrap.style.display = 'block';
    } else {
      prodImagePreviewWrap.style.display = 'none';
    }

    const variants = (prod.img || []).map((i) => i.v).filter(Boolean).join(', ');
    document.getElementById('prodVariants').value = variants;

    document.getElementById('productModalTitle').textContent = 'Edit Product: ' + prod.n;
    productModal.classList.add('active');
  };

  window.closeProductModal = function () {
    productModal.classList.remove('active');
  };

  // Preview uploaded image
  prodImageUploadInput.addEventListener('change', async function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      showToast(`Optimizing "${file.name}"...`, 'info');
      try {
        const compressed = await compressImageFile(file, 900, 900, 0.82);
        prodPrimaryImage.value = compressed;
        prodImagePreview.src = compressed;
        prodImagePreviewWrap.style.display = 'block';
        showToast('Photo selected and preview ready!');

        // Try server upload if available
        try {
          const formData = new FormData();
          formData.append('files', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData }).then((r) => r.json());
          if (res && res.success && res.files && res.files[0]) {
            prodPrimaryImage.value = res.files[0].url.replace(/^\//, ''); // Clean leading slash
            prodImagePreview.src = prodPrimaryImage.value;
          }
        } catch (err) {
          console.warn('Server upload skipped in Cloud Mode, using Data URL');
        }
      } catch (e) {
        showToast('Error processing product photo: ' + e.message, 'danger');
      }
    }
  });

  prodPrimaryImage.addEventListener('input', function () {
    if (this.value) {
      prodImagePreview.src = this.value;
      prodImagePreviewWrap.style.display = 'block';
    } else {
      prodImagePreviewWrap.style.display = 'none';
    }
  });

  btnSaveProduct.addEventListener('click', async () => {
    const id = document.getElementById('prodEditId').value;
    const n = document.getElementById('prodModelName').value.trim();
    const sku = document.getElementById('prodSku').value.trim();
    const b = document.getElementById('prodBrand').value;
    const c = document.getElementById('prodCategory').value.trim();
    const primaryImg = prodPrimaryImage.value.trim();
    const variantsStr = document.getElementById('prodVariants').value.trim();

    if (!n || !b || !c || !primaryImg) {
      showToast('Please fill all required fields (*)', 'error');
      return;
    }

    const varList = variantsStr.split(',').map((v) => v.trim()).filter(Boolean);
    const imgArr = [{ f: primaryImg, v: varList[0] || '' }];
    for (let i = 1; i < varList.length; i++) {
      imgArr.push({ f: primaryImg, v: varList[i] });
    }

    const payload = { n, b, c, sku, img: imgArr };
    try {
      btnSaveProduct.disabled = true;

      if (id) {
        const idx = allProducts.findIndex((p) => p.id === id || p.sku === id);
        if (idx !== -1) {
          allProducts[idx] = { ...allProducts[idx], ...payload, id };
        }
      } else {
        const nextNum = allProducts.length + 1;
        const newId = `PROD-${Date.now().toString(36)}-${nextNum}`;
        const autoSku = payload.sku || `NP-${(payload.b || 'NTL').substring(0, 3).toUpperCase()}-${String(nextNum).padStart(3, '0')}`;
        allProducts.unshift({ ...payload, id: newId, sku: autoSku });
      }
      localStorage.setItem('np_custom_products', JSON.stringify(allProducts));

      // Try server sync
      try {
        if (id) {
          await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          await apiFetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (e) {
        console.warn('Server sync skipped, stored in Cloud storage');
      }

      // Broadcast real-time update across all systems and open browser windows
      if (window.NP_REALTIME) {
        window.NP_REALTIME.broadcast('products_updated', { action: id ? 'update' : 'create', id });
      }

      showToast('Product saved successfully!');
      closeProductModal();
      populateCategoryFilter();
      applyProductFilters();
      await loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      btnSaveProduct.disabled = false;
    }
  });

  // --- Delete Product Modal ---
  const deleteModal = document.getElementById('deleteModal');
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');

  window.openDeleteProduct = function (id, name) {
    deletingProductId = id;
    document.getElementById('deleteModalMessage').textContent = `Are you sure you want to permanently delete "${name}"? This will update the online catalogue immediately.`;
    deleteModal.classList.add('active');
  };

  window.closeDeleteModal = function () {
    deletingProductId = null;
    deleteModal.classList.remove('active');
  };

  btnConfirmDelete.addEventListener('click', async () => {
    if (!deletingProductId) return;
    try {
      btnConfirmDelete.disabled = true;

      const idx = allProducts.findIndex((p) => p.id === deletingProductId || p.sku === deletingProductId);
      if (idx !== -1) {
        allProducts.splice(idx, 1);
        localStorage.setItem('np_custom_products', JSON.stringify(allProducts));
      }

      try {
        await apiFetch(`/api/products/${encodeURIComponent(deletingProductId)}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Server delete skipped, updated in Cloud storage');
      }

      // Broadcast real-time deletion
      if (window.NP_REALTIME) {
        window.NP_REALTIME.broadcast('products_updated', { action: 'delete', id: deletingProductId });
      }

      showToast('Product deleted successfully');
      closeDeleteModal();
      populateCategoryFilter();
      applyProductFilters();
      await loadStats();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      btnConfirmDelete.disabled = false;
    }
  });

  // ================= 5. PAGE CONTENT CMS =================
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = (val !== undefined && val !== null) ? val : '';
    // Automatically synchronize any matching image preview
    const preview = document.getElementById(id + '_preview') ||
                    document.getElementById(id.replace('_photo', '_photo_preview')) ||
                    document.getElementById(id.replace('_img', '_img_preview')) ||
                    document.getElementById(id.replace('_image', '_image_preview'));
    if (preview && el.value) {
      preview.src = el.value;
      preview.style.display = 'block';
    }
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  window.updateImagePreview = function (inputEl, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    const url = inputEl.value ? inputEl.value.trim() : '';
    if (url) {
      preview.src = url;
      preview.style.display = 'block';
    } else {
      preview.src = 'images/brand/company-national-logo.png';
    }
  };

  window.pickMediaFor = function (targetId) {
    currentTargetFieldForMedia = targetId;
    navigateTo('media');
    showToast('Click "Select" on any photo below to apply it to ' + targetId, 'info');
  };

  window.selectMediaForField = async function (url) {
    if (!currentTargetFieldForMedia) return;
    const input = document.getElementById(currentTargetFieldForMedia);
    if (input) {
      input.value = url;
      setVal(currentTargetFieldForMedia, url);
      let activePage = 'home';
      if (currentTargetFieldForMedia.includes('about')) activePage = 'about';
      else if (currentTargetFieldForMedia.includes('product') || currentTargetFieldForMedia.includes('coll')) activePage = 'products';
      else if (currentTargetFieldForMedia.includes('mfg')) activePage = 'manufacturing';
      else if (currentTargetFieldForMedia.includes('dist')) activePage = 'distributor';
      else if (currentTargetFieldForMedia.includes('contact') || currentTargetFieldForMedia.includes('social')) activePage = 'contact';
      else if (currentTargetFieldForMedia.includes('policy')) activePage = 'policies';

      if (typeof window.saveCurrentCMS === 'function') {
        try { await window.saveCurrentCMS(activePage); } catch (_) {}
      }
      showToast('Photo selected and applied live to site!', 'success');
    }
    currentTargetFieldForMedia = null;
    navigateTo('cms');
  };

  // ================= 4.5 CLIENT-SIDE PERSISTENCE & IMAGE COMPRESSION (INDEXEDDB + CANVAS) =================
  const DB_NAME = 'np_cms_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'cms_store';

  function getDB() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) return resolve(null);
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = function (e) {
          resolve(e.target.result);
        };
        req.onerror = function () {
          resolve(null);
        };
      } catch (_) {
        resolve(null);
      }
    });
  }

  const idbStorage = {
    async get(key) {
      const db = await getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
    },
    async set(key, value) {
      const db = await getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(value, key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    },
    async remove(key) {
      const db = await getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }
  };

  // Safe client-side image compression: converts heavy 5MB-10MB photos into lightweight ~70KB-120KB Web JPEGs
  function compressImageFile(file, maxWidth = 1200, maxHeight = 900, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file provided'));
      if (file.type === 'image/svg+xml' || (file.size < 40 * 1024 && file.type === 'image/png')) {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;

          // Proportional scaling
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (file.type !== 'image/png') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const outType = (file.type === 'image/png' && file.size < 250 * 1024) ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(outType, quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.uploadImageForField = function (targetId) {
    let fileInput = document.getElementById('cmsGlobalImagePicker');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'cmsGlobalImagePicker';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
    }

    fileInput.onchange = async function () {
      if (!fileInput.files || !fileInput.files[0]) return;
      const file = fileInput.files[0];

      showToast(`Optimizing "${file.name}"...`, 'info');

      try {
        const isBanner = targetId.includes('hero') || targetId.includes('banner');
        const maxW = isBanner ? 1400 : 900;
        const maxH = isBanner ? 900 : 800;
        const dataUrl = await compressImageFile(file, maxW, maxH, 0.82);

        // 1. Update the target input field value and fire events
        const inputEl = document.getElementById(targetId);
        if (inputEl) {
          inputEl.value = dataUrl;
          try {
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          } catch (_) {}
        }

        // 2. Synchronize preview thumbnail directly
        setVal(targetId, dataUrl);

        const preview = document.getElementById(targetId + '_preview') ||
                        document.getElementById(targetId.replace('_photo', '_photo_preview')) ||
                        document.getElementById(targetId.replace('_img', '_img_preview')) ||
                        document.getElementById(targetId.replace('_image', '_image_preview'));
        if (preview) {
          preview.src = dataUrl;
          preview.style.display = 'block';
        }

        // 3. Save to Custom Media Library in IndexedDB and lean localStorage
        const mediaItem = {
          name: file.name,
          url: dataUrl,
          tag: 'Uploads',
          size: Math.round(dataUrl.length * 0.75),
          mtime: Date.now()
        };
        allMedia = [mediaItem, ...(allMedia || [])];
        await idbStorage.set('np_custom_media', allMedia);

        // Keep localStorage lean (only 3 items max) so it never causes quota failure
        try {
          const leanMedia = (allMedia || []).slice(0, 3);
          localStorage.setItem('np_custom_media', JSON.stringify(leanMedia));
        } catch (_) {
          try { localStorage.removeItem('np_custom_media'); } catch (_) {}
        }

        // 4. If server backend is reachable, upload in parallel
        try {
          const fd = new FormData();
          fd.append('files', file);
          fetch('/api/upload', { method: 'POST', body: fd }).catch(() => {});
        } catch (_) {}

        // Auto-save the active page so updates apply to the live site immediately
        let activePage = 'home';
        if (targetId.includes('about')) activePage = 'about';
        else if (targetId.includes('product') || targetId.includes('coll')) activePage = 'products';
        else if (targetId.includes('mfg')) activePage = 'manufacturing';
        else if (targetId.includes('dist')) activePage = 'distributor';
        else if (targetId.includes('contact') || targetId.includes('social')) activePage = 'contact';
        else if (targetId.includes('policy')) activePage = 'policies';

        if (typeof window.saveCurrentCMS === 'function') {
          try { await window.saveCurrentCMS(activePage); } catch (_) {}
        }

        showToast(`"${file.name}" uploaded, optimized, and saved live!`, 'success');
      } catch (err) {
        console.error('Upload processing error:', err);
        showToast('Failed to process image: ' + err.message, 'danger');
      } finally {
        fileInput.value = '';
      }
    };

    fileInput.click();
  };

  function getDefaultCMS() {
    try {
      const el = document.getElementById('np_default_cms');
      if (el && el.textContent.trim()) {
        return JSON.parse(el.textContent);
      }
    } catch (e) {
      console.warn('Error reading np_default_cms:', e);
    }
    return null;
  }

  async function loadCMS(silent = false) {
    try {
      // 1. Immediately establish baseline from embedded master data so UI responds instantly
      const masterCMS = getDefaultCMS();
      if (masterCMS && (!cmsData || !Object.keys(cmsData).length)) {
        cmsData = Object.assign({}, masterCMS);
        populateCMSForms();
      }

      // 2. Fetch authoritative live data from MySQL server API
      let serverData = null;
      try {
        const sRes = await fetch('/api/cms?t=' + Date.now());
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson && (sJson.data || sJson.home)) serverData = sJson.data || sJson;
        }
      } catch (_) {}

      // Fallback to static cms-content.json if API failed
      if (!serverData && (!cmsData || !Object.keys(cmsData).length)) {
        try {
          const staticRes = await fetch('data/cms-content.json?t=' + Date.now());
          if (staticRes.ok) serverData = await staticRes.json();
        } catch (_) {}
      }

      // Authoritative MySQL server data takes top priority
      if (serverData && Object.keys(serverData).length > 0) {
        cmsData = Object.assign({}, masterCMS || {}, serverData);
        await idbStorage.set('np_custom_cms', cmsData).catch(() => {});
        try { localStorage.setItem('np_custom_cms', JSON.stringify(cmsData)); } catch (_) {}
      } else {
        // Fallback to local storage if offline
        let customData = await idbStorage.get('np_custom_cms');
        if (!customData) {
          const cached = localStorage.getItem('np_custom_cms');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed === 'object') customData = parsed;
            } catch (e) {}
          }
        }
        cmsData = Object.assign({}, masterCMS || {}, customData || {});
      }

      populateCMSForms();
    } catch (err) {
      if (!silent) console.warn('Error loading CMS data:', err);
    }
  }


  function populateCMSForms() {
    if (!cmsData) return;

    // A. Home
    if (cmsData.home) {
      setVal('cms_home_hero_eyebrow', cmsData.home.hero?.eyebrow || 'Since 1997');
      setVal('cms_home_hero_title1', cmsData.home.hero?.title1 || 'Shaping Spaces, Engineering Trust');
      setVal('cms_home_hero_title2', cmsData.home.hero?.title2 || 'Designed for Life, Built for Generations');
      setVal('cms_home_hero_title3', cmsData.home.hero?.title3 || 'Empowering India with Premium Living');
      setVal('cms_home_hero_video', cmsData.home.hero?.videoUrl || 'videos/hero/national-plasto-overview.mp4');
      setVal('cms_home_hero_poster', cmsData.home.hero?.videoPoster || 'images/hero/overview-video-poster.jpg');
      setVal('cms_home_hero_image', cmsData.home.hero?.bannerImage || 'images/brand/company-photo.jpg');
      setVal('cms_home_hero_ctaText', cmsData.home.hero?.ctaText || 'About the Company');
      setVal('cms_home_hero_ctaLink', cmsData.home.hero?.ctaLink || 'about.html');

      // 6 Virtues
      (cmsData.home.virtues || []).forEach((v, idx) => {
        setVal('cms_home_virtue_' + idx + '_title', v.title);
        setVal('cms_home_virtue_' + idx + '_desc', v.desc);
      });

      // CMD Message
      if (cmsData.home.cmdTestimonial) {
        setVal('cms_home_cmd_quote', cmsData.home.cmdTestimonial.quote);
        setVal('cms_home_cmd_name', cmsData.home.cmdTestimonial.name);
        setVal('cms_home_cmd_role', cmsData.home.cmdTestimonial.role);
        setVal('cms_home_cmd_photo', cmsData.home.cmdTestimonial.photo);
        setVal('cms_home_cmd_btnText', cmsData.home.cmdTestimonial.btnText);
        setVal('cms_home_cmd_btnLink', cmsData.home.cmdTestimonial.btnLink);
      }

      // Metrics Section (8 stats)
      if (cmsData.home.metricsSection) {
        setVal('cms_home_metrics_heading', cmsData.home.metricsSection.heading);
        setVal('cms_home_metrics_desc', cmsData.home.metricsSection.desc);
        (cmsData.home.metricsSection.stats || []).forEach((st, idx) => {
          setVal('cms_home_stat_' + idx, st.value + ' ' + (st.unit || '') + (st.label ? ' - ' + st.label : ''));
        });
      }

      // Plant Highlights (2)
      (cmsData.home.plantHighlights || []).forEach((ph, idx) => {
        setVal('cms_home_highlight_' + idx + '_title', ph.title);
        setVal('cms_home_highlight_' + idx + '_image', ph.image);
      });

      // Brands (4)
      (cmsData.home.brandsSection?.brands || []).forEach((b, idx) => {
        setVal('cms_home_brand_' + idx + '_tagline', b.tagline);
        setVal('cms_home_brand_' + idx + '_desc', b.desc);
        setVal('cms_home_brand_' + idx + '_image', b.image);
      });

      // Milestones (Dynamic)
      if (typeof window.renderMilestoneRows === 'function') {
        window.renderMilestoneRows(cmsData.home.milestones);
      }

      // Sustainability
      if (cmsData.home.sustainability) {
        setVal('cms_home_sust_title', cmsData.home.sustainability.title);
        setVal('cms_home_sust_p1', cmsData.home.sustainability.p1);
        setVal('cms_home_sust_p2', cmsData.home.sustainability.p2);
        setVal('cms_home_sust_btnText', cmsData.home.sustainability.btnText);
        setVal('cms_home_sust_btnLink', cmsData.home.sustainability.btnLink);
      }

      // Touching Lives
      if (cmsData.home.touchingLives) {
        setVal('cms_home_touch_title', cmsData.home.touchingLives.title);
        setVal('cms_home_touch_desc', cmsData.home.touchingLives.desc);
        setVal('cms_home_touch_image', cmsData.home.touchingLives.image);
        setVal('cms_home_touch_btnText', cmsData.home.touchingLives.btnText);
        setVal('cms_home_touch_btnLink', cmsData.home.touchingLives.btnLink);
      }

      // Innovative Products
      if (cmsData.home.innovativeProducts) {
        setVal('cms_home_inno_title', cmsData.home.innovativeProducts.title);
        setVal('cms_home_inno_desc', cmsData.home.innovativeProducts.desc);
        setVal('cms_home_inno_image', cmsData.home.innovativeProducts.image);
        setVal('cms_home_inno_btnText', cmsData.home.innovativeProducts.btnText);
        setVal('cms_home_inno_btnLink', cmsData.home.innovativeProducts.btnLink);
      }

      // Reels (4)
      (cmsData.home.reels || []).forEach((r, idx) => {
        setVal('cms_home_reel_' + idx + '_name', r.name);
        setVal('cms_home_reel_' + idx + '_poster', r.poster);
        setVal('cms_home_reel_' + idx + '_video', r.video);
      });

      // Network
      if (cmsData.home.network) {
        setVal('cms_home_network_title', cmsData.home.network.title);
        setVal('cms_home_network_subtitle', cmsData.home.network.subtitle);
        setVal('cms_home_network_plants', cmsData.home.network.plantsStat);
        setVal('cms_home_network_capacity', cmsData.home.network.dailyCapacityStat);
        setVal('cms_home_network_dealers', cmsData.home.network.dealersStat);
        setVal('cms_home_network_states', cmsData.home.network.statesStat);
      }
    }

    // B. About Us
    if (cmsData.about) {
      setVal('cms_about_hero_breadcrumb', cmsData.about.hero?.breadcrumb || 'About Us');
      setVal('cms_about_hero_title', cmsData.about.hero?.title);
      setVal('cms_about_hero_subtitle', cmsData.about.hero?.subtitle);
      setVal('cms_about_hero_image', cmsData.about.hero?.bannerImage);

      setVal('cms_about_overview_title', cmsData.about.overview?.title);
      setVal('cms_about_overview_lead', cmsData.about.overview?.leadText);
      setVal('cms_about_overview_desc', cmsData.about.overview?.desc);

      setVal('cms_about_vision', cmsData.about.missionVision?.vision);
      setVal('cms_about_mission', cmsData.about.missionVision?.mission);

      (cmsData.about.stats || []).forEach((s, idx) => {
        setVal('cms_about_stat_' + idx + '_label', s.label);
        setVal('cms_about_stat_' + idx + '_value', s.value);
      });

      // 4 Pillars
      (cmsData.about.pillars || []).forEach((p, idx) => {
        setVal('cms_about_pillar_' + idx + '_title', p.title);
        setVal('cms_about_pillar_' + idx + '_desc', p.desc);
        setVal('cms_about_pillar_' + idx + '_img', p.image);
      });

      // Management Intro Narrative
      if (cmsData.about.managementIntro) {
        setVal('cms_about_mgmt_title', cmsData.about.managementIntro.title || 'Our Management');
        setVal('cms_about_mgmt_p1', cmsData.about.managementIntro.p1 || '');
        setVal('cms_about_mgmt_p2', cmsData.about.managementIntro.p2 || '');
        setVal('cms_about_mgmt_p3', cmsData.about.managementIntro.p3 || '');
      }

      // Board of Directors (5 members)
      (cmsData.about.leadership || []).forEach((l, idx) => {
        setVal('cms_about_lead_' + idx + '_name', l.name);
        setVal('cms_about_lead_' + idx + '_role', l.role);
        setVal('cms_about_lead_' + idx + '_photo', l.photo);
        setVal('cms_about_lead_' + idx + '_bio', Array.isArray(l.bio) ? l.bio.join('\n\n') : (l.bio || ''));
        setVal('cms_about_lead_' + idx + '_quote', l.quote || '');
      });
    }

    // C. Products Page
    if (cmsData.products) {
      setVal('cms_products_hero_breadcrumb', cmsData.products.hero?.breadcrumb || 'Products');
      setVal('cms_products_hero_title', cmsData.products.hero?.title);
      setVal('cms_products_hero_subtitle', cmsData.products.hero?.subtitle);
      setVal('cms_products_hero_image', cmsData.products.hero?.bannerImage);

      setVal('cms_products_brand_title', cmsData.products.shopByBrandHeader?.title);
      setVal('cms_products_brand_desc', cmsData.products.shopByBrandHeader?.desc);

      setVal('cms_products_collection_title', cmsData.products.exploreCollectionsHeader?.title);
      setVal('cms_products_collection_desc', cmsData.products.exploreCollectionsHeader?.desc);

      // 12 Collections
      (cmsData.products.collections || []).forEach((c, idx) => {
        setVal('cms_coll_' + idx + '_count', c.count);
        setVal('cms_coll_' + idx + '_img', c.image);
      });

      setVal('cms_products_brochure_title', cmsData.products.brochure?.title);
      setVal('cms_products_brochure_url', cmsData.products.brochure?.pdfUrl);
      setVal('cms_products_brochure_btn', cmsData.products.brochure?.btnText);
    }

    // D. Manufacturing
    if (cmsData.manufacturing) {
      setVal('cms_mfg_hero_breadcrumb', cmsData.manufacturing.hero?.breadcrumb || 'Manufacturing');
      setVal('cms_mfg_hero_title', cmsData.manufacturing.hero?.title);
      setVal('cms_mfg_hero_subtitle', cmsData.manufacturing.hero?.subtitle);
      setVal('cms_mfg_hero_image', cmsData.manufacturing.hero?.bannerImage);

      // 4 Plants
      (cmsData.manufacturing.plants || []).forEach((p, idx) => {
        setVal('cms_mfg_plant_' + idx + '_loc', p.location);
        setVal('cms_mfg_plant_' + idx + '_cap', p.capacity);
        setVal('cms_mfg_plant_' + idx + '_mach', p.machines);
        setVal('cms_mfg_plant_' + idx + '_img', p.image);
      });

      setVal('cms_mfg_qa_title', cmsData.manufacturing.qualityTesting?.title);
      setVal('cms_mfg_qa_desc', cmsData.manufacturing.qualityTesting?.desc);
    }

    // E. Dealer Desk (Distributor)
    if (cmsData.distributor) {
      setVal('cms_dist_hero_breadcrumb', cmsData.distributor.hero?.breadcrumb || 'Dealer Desk');
      setVal('cms_dist_hero_title', cmsData.distributor.hero?.title);
      setVal('cms_dist_hero_image', cmsData.distributor.hero?.bannerImage || 'images/brand/dealer.jpg');

      setVal('cms_dist_benefits_title', cmsData.distributor.benefits?.title || cmsData.distributor.whyPartner?.title || 'Dealer Desk Benefits');
      setVal('cms_dist_benefits_subtitle', cmsData.distributor.benefits?.subtitle || cmsData.distributor.hero?.subtitle || 'With its expanding manufacturing and distribution network across the nation, National Plasto offers lucrative margins, territorial protection, and direct factory supply.');
      setVal('cms_dist_badge_title', cmsData.distributor.benefits?.badgeTitle || 'Authorised Dealer Desk');
      setVal('cms_dist_badge_sub', cmsData.distributor.benefits?.badgeSubtitle || 'Verified Partnership');

      const defaultBars = [
        { punchline: 'Earn Maximum Profit on Every Sale', subtext: 'Lucrative distributor price margins with high-turnover annual volume rebates.' },
        { punchline: 'Zero Competition in Your Territory', subtext: 'Demarcated sales zones guaranteeing exclusive regional distribution rights.' },
        { punchline: 'Fast-Moving Models Across 4 Brands', subtext: 'Complete portfolio covering Next, National, Captain & Sapphire furniture.' },
        { punchline: 'Direct Supply from 4 Mega Plants', subtext: 'Uninterrupted factory shipments backed by high-tonnage injection machines.' }
      ];
      const bars = (cmsData.distributor.benefits?.bars && cmsData.distributor.benefits.bars.length) ? cmsData.distributor.benefits.bars : defaultBars;
      bars.forEach((bar, idx) => {
        setVal('cms_dist_bar_' + idx + '_punchline', bar.punchline);
        setVal('cms_dist_bar_' + idx + '_subtext', bar.subtext);
      });

      setVal('cms_dist_unique_heading', cmsData.distributor.unique?.heading || 'What makes us unique?');
      setVal('cms_dist_unique_desc', cmsData.distributor.unique?.desc || 'National Plasto is an approved partner and trusted manufacturer to major commercial enterprises and over 2,500+ authorized dealers across India. With over 29 years of furniture excellence, our high-precision plastic moulded furniture and material handling solutions are manufactured at 4 high-tech, ISO 9001, 14001, 45001, 50001, CE, and BIFMA-certified plants.');
      setVal('cms_dist_unique_btn', cmsData.distributor.unique?.btnText || 'KNOW OUR STORY');
      setVal('cms_dist_unique_img', cmsData.distributor.unique?.bannerImage || 'images/ghj.png');

      setVal('cms_dist_cta_heading', cmsData.distributor.cta?.heading || 'Ready to Grow With National Plasto?');
      setVal('cms_dist_cta_desc', cmsData.distributor.cta?.desc || 'Bring a trusted product portfolio to your market and build a stronger business with us.');
      setVal('cms_dist_cta_btn', cmsData.distributor.cta?.primaryBtnText || 'BECOME A DEALER');
      setVal('cms_dist_cta_cat_btn', cmsData.distributor.cta?.catalogueBtnText || 'DOWNLOAD CATALOGUE');

      setVal('cms_dist_contact_phone', cmsData.distributor.contactInfo?.hotline || '+91 98300 12345');
      setVal('cms_dist_contact_email', cmsData.distributor.contactInfo?.email || 'dealer@nationalplasto.com');
      setVal('cms_dist_contact_hours', cmsData.distributor.contactInfo?.hours || 'Monday – Saturday: 9:30 AM to 6:30 PM');
    }

    // F. Contact Us
    if (cmsData.contact || cmsData.general) {
      setVal('cms_contact_hero_breadcrumb', cmsData.contact?.hero?.breadcrumb || 'Contact Us');
      setVal('cms_contact_hero_title', cmsData.contact?.hero?.title);
      setVal('cms_contact_hero_subtitle', cmsData.contact?.hero?.subtitle);
      setVal('cms_contact_hero_image', cmsData.contact?.hero?.bannerImage);

      setVal('cms_contact_email', cmsData.general?.contactEmail);
      setVal('cms_contact_phone', cmsData.general?.contactPhone);
      setVal('cms_contact_tollfree', cmsData.general?.tollFree);
      setVal('cms_contact_whatsapp', cmsData.general?.whatsapp);
      setVal('cms_contact_address', cmsData.contact?.corporateOffice?.address || cmsData.general?.headOffice);
      setVal('cms_contact_map_url', cmsData.contact?.corporateOffice?.mapUrl);

      if (cmsData.contact?.channels && Array.isArray(cmsData.contact.channels) && cmsData.contact.channels.length > 0) {
        window.renderChannelRows(cmsData.contact.channels);
      } else {
        window.renderChannelRows([
          { label: 'Authorized Dealer & Trade Helpline', type: 'phone', value: '+91 33 2242 1997 / 1998', placement: 'both', note: 'Mon - Sat: 9:30 AM - 6:30 PM' },
          { label: 'Retail, Bulk & WhatsApp Support', type: 'whatsapp', value: '+91 98300 12345', placement: 'both', note: 'Instant WhatsApp Chat' },
          { label: 'Official Correspondence', type: 'email', value: 'info@nationalplasto.com', placement: 'both', note: 'General inquiries & feedback' },
          { label: 'Commercial & Bulk Trade Desk', type: 'email', value: 'trade@nationalplasto.com', placement: 'contact_card', note: 'Institutional bulk purchases' }
        ]);
      }

      if (cmsData.contact?.factories && Array.isArray(cmsData.contact.factories) && cmsData.contact.factories.length > 0) {
        window.renderFactoryRows(cmsData.contact.factories);
      } else {
        window.renderFactoryRows([
          { name: 'Howrah Plant', subtitle: 'West Bengal', placement: 'both', address: 'Jalan Industrial Estate, Dakshin Jhapardaha, Howrah, West Bengal 711411', phone: '+91 33 2669 0001', email: 'howrah@nationalplasto.com' },
          { name: 'Guwahati Plant', subtitle: 'Assam', placement: 'both', address: 'E.P.I.P. Complex, Amingaon, Guwahati, Assam 781031', phone: '+91 361 284 0002', email: 'guwahati@nationalplasto.com' },
          { name: 'Roorkee Plant', subtitle: 'Uttarakhand', placement: 'both', address: 'Raipur Industrial Area, Bhagwanpur, Roorkee, Uttarakhand 247661', phone: '+91 1332 235 003', email: 'roorkee@nationalplasto.com' },
          { name: 'Hajipur Plant', subtitle: 'Bihar', placement: 'both', address: 'EPIP Industrial Area, Hajipur, Vaishali, Bihar 844101', phone: '+91 6224 271 004', email: 'hajipur@nationalplasto.com' }
        ]);
      }

      setVal('cms_social_fb', cmsData.general?.socialLinks?.facebook);
      setVal('cms_social_ig', cmsData.general?.socialLinks?.instagram);
      setVal('cms_social_li', cmsData.general?.socialLinks?.linkedin);
      setVal('cms_social_amz', cmsData.general?.socialLinks?.amazon);
    }

    // G. Policies
    if (cmsData.policies) {
      setVal('cms_policy_hero_breadcrumb', cmsData.policies.hero?.breadcrumb || 'Policies');
      setVal('cms_policy_hero_title', cmsData.policies.hero?.title);
      setVal('cms_policy_hero_subtitle', cmsData.policies.hero?.subtitle);
      setVal('cms_policy_hero_image', cmsData.policies.hero?.bannerImage);
      setVal('cms_policy_warranty', cmsData.policies.qualityWarranty?.text);
      setVal('cms_policy_privacy', cmsData.policies.privacy?.text);
      setVal('cms_policy_returns', cmsData.policies.returnsReplacement?.text);
      setVal('cms_policy_shipping', cmsData.policies.shippingDispatch?.text);
    }
  }

  window.saveCurrentCMS = async function (page) {
    try {
      showToast('Saving ' + page.toUpperCase() + ' sections...');

      if (page === 'home') {
        cmsData.home = cmsData.home || {};
        cmsData.home.hero = {
          eyebrow: getVal('cms_home_hero_eyebrow') || 'Since 1997',
          title1: getVal('cms_home_hero_title1') || 'Shaping Spaces, Engineering Trust',
          title2: getVal('cms_home_hero_title2') || 'Designed for Life, Built for Generations',
          title3: getVal('cms_home_hero_title3') || 'Empowering India with Premium Living',
          title: getVal('cms_home_hero_title1'),
          videoUrl: getVal('cms_home_hero_video'),
          videoPoster: getVal('cms_home_hero_poster'),
          bannerImage: getVal('cms_home_hero_image'),
          ctaText: getVal('cms_home_hero_ctaText'),
          ctaLink: getVal('cms_home_hero_ctaLink')
        };

        // 6 Virtues
        cmsData.home.virtues = [0, 1, 2, 3, 4, 5].map((i) => ({
          title: getVal('cms_home_virtue_' + i + '_title') || (cmsData.home.virtues && cmsData.home.virtues[i]?.title) || '',
          desc: getVal('cms_home_virtue_' + i + '_desc') || (cmsData.home.virtues && cmsData.home.virtues[i]?.desc) || '',
          icon: (cmsData.home.virtues && cmsData.home.virtues[i]?.icon) || 'images/icons/hand.gif'
        }));

        // CMD Testimonial
        cmsData.home.cmdTestimonial = {
          quote: getVal('cms_home_cmd_quote'),
          name: getVal('cms_home_cmd_name'),
          role: getVal('cms_home_cmd_role'),
          photo: getVal('cms_home_cmd_photo'),
          btnText: getVal('cms_home_cmd_btnText'),
          btnLink: getVal('cms_home_cmd_btnLink')
        };

        // Plant Highlights (2)
        cmsData.home.plantHighlights = [0, 1].map((i) => ({
          title: getVal('cms_home_highlight_' + i + '_title'),
          image: getVal('cms_home_highlight_' + i + '_image'),
          link: i === 0 ? 'manufacturing.html' : 'products.html'
        }));

        // Brands (4)
        const brandNames = ['NEXT — Premium Furniture', 'NATIONAL — Moulded Furniture', 'CAPTAIN — Economical Furniture', 'SAPPHIRE — Value Seating'];
        cmsData.home.brandsSection = cmsData.home.brandsSection || {};
        cmsData.home.brandsSection.brands = [0, 1, 2, 3].map((i) => ({
          name: brandNames[i],
          tagline: getVal('cms_home_brand_' + i + '_tagline'),
          desc: getVal('cms_home_brand_' + i + '_desc'),
          image: getVal('cms_home_brand_' + i + '_image'),
          logo: (cmsData.home.brandsSection.brands && cmsData.home.brandsSection.brands[i]?.logo) || '',
          link: 'products.html?brand=' + brandNames[i].split(' ')[0].toLowerCase()
        }));

        // Milestones (Dynamic)
        cmsData.home.milestones = harvestMilestonesFromDOM();

        // Sustainability
        cmsData.home.sustainability = {
          title: getVal('cms_home_sust_title'),
          p1: getVal('cms_home_sust_p1'),
          p2: getVal('cms_home_sust_p2'),
          btnText: getVal('cms_home_sust_btnText'),
          btnLink: getVal('cms_home_sust_btnLink')
        };

        // Touching Lives
        cmsData.home.touchingLives = {
          title: getVal('cms_home_touch_title'),
          desc: getVal('cms_home_touch_desc'),
          image: getVal('cms_home_touch_image'),
          btnText: getVal('cms_home_touch_btnText'),
          btnLink: getVal('cms_home_touch_btnLink')
        };

        // Innovative Products
        cmsData.home.innovativeProducts = {
          title: getVal('cms_home_inno_title'),
          desc: getVal('cms_home_inno_desc'),
          image: getVal('cms_home_inno_image'),
          btnText: getVal('cms_home_inno_btnText'),
          btnLink: getVal('cms_home_inno_btnLink')
        };

        // Reels
        cmsData.home.reels = [0, 1, 2, 3].map((i) => ({
          name: getVal('cms_home_reel_' + i + '_name'),
          poster: getVal('cms_home_reel_' + i + '_poster'),
          video: getVal('cms_home_reel_' + i + '_video')
        }));

        // Network
        cmsData.home.network = {
          title: getVal('cms_home_network_title'),
          subtitle: getVal('cms_home_network_subtitle'),
          plantsStat: getVal('cms_home_network_plants'),
          dailyCapacityStat: getVal('cms_home_network_capacity'),
          dealersStat: getVal('cms_home_network_dealers'),
          statesStat: getVal('cms_home_network_states')
        };
      } else if (page === 'about') {
        cmsData.about = cmsData.about || {};
        cmsData.about.hero = {
          breadcrumb: getVal('cms_about_hero_breadcrumb') || 'About Us',
          title: getVal('cms_about_hero_title'),
          subtitle: getVal('cms_about_hero_subtitle'),
          bannerImage: getVal('cms_about_hero_image')
        };
        cmsData.about.overview = {
          title: getVal('cms_about_overview_title'),
          leadText: getVal('cms_about_overview_lead'),
          desc: getVal('cms_about_overview_desc')
        };
        cmsData.about.missionVision = {
          vision: getVal('cms_about_vision'),
          mission: getVal('cms_about_mission')
        };
        // 4 stats
        cmsData.about.stats = [0, 1, 2, 3].map((i) => ({
          label: getVal('cms_about_stat_' + i + '_label'),
          value: getVal('cms_about_stat_' + i + '_value')
        }));
        // 4 pillars
        cmsData.about.pillars = [0, 1, 2, 3].map((i) => ({
          number: '0' + (i + 1),
          title: getVal('cms_about_pillar_' + i + '_title'),
          desc: getVal('cms_about_pillar_' + i + '_desc'),
          image: getVal('cms_about_pillar_' + i + '_img')
        }));
        // Management Intro Narrative
        cmsData.about.managementIntro = {
          title: getVal('cms_about_mgmt_title') || 'Our Management',
          p1: getVal('cms_about_mgmt_p1'),
          p2: getVal('cms_about_mgmt_p2'),
          p3: getVal('cms_about_mgmt_p3')
        };
        // 5 board members
        cmsData.about.leadership = [0, 1, 2, 3, 4].map((i) => ({
          name: getVal('cms_about_lead_' + i + '_name'),
          role: getVal('cms_about_lead_' + i + '_role'),
          photo: getVal('cms_about_lead_' + i + '_photo'),
          bio: getVal('cms_about_lead_' + i + '_bio'),
          quote: getVal('cms_about_lead_' + i + '_quote')
        }));
      } else if (page === 'products') {
        cmsData.products = cmsData.products || {};
        cmsData.products.hero = {
          breadcrumb: getVal('cms_products_hero_breadcrumb') || 'Products',
          title: getVal('cms_products_hero_title'),
          subtitle: getVal('cms_products_hero_subtitle'),
          bannerImage: getVal('cms_products_hero_image')
        };
        cmsData.products.shopByBrandHeader = {
          title: getVal('cms_products_brand_title'),
          desc: getVal('cms_products_brand_desc')
        };
        cmsData.products.exploreCollectionsHeader = {
          title: getVal('cms_products_collection_title'),
          desc: getVal('cms_products_collection_desc')
        };
        // 12 collections
        const collNames = [
          'Arm Chairs', 'Premium Arm Chairs', 'Armless Chairs', 'Premium Armless Chairs',
          'Metallic Chairs', 'Steel Moulded Chairs', 'Baby Chairs', 'Stools',
          'Tables', 'Dining Sets', 'Trolleys & Racks', 'Wardrobes'
        ];
        cmsData.products.collections = collNames.map((name, i) => ({
          name: name,
          count: getVal('cms_coll_' + i + '_count') || (cmsData.products.collections && cmsData.products.collections[i]?.count) || '',
          desc: (cmsData.products.collections && cmsData.products.collections[i]?.desc) || '',
          image: getVal('cms_coll_' + i + '_img') || (cmsData.products.collections && cmsData.products.collections[i]?.image) || '',
          link: 'products.html?cat=' + name.toLowerCase().replace(/\s+/g, '-')
        }));
        cmsData.products.brochure = {
          title: getVal('cms_products_brochure_title'),
          pdfUrl: getVal('cms_products_brochure_url'),
          btnText: getVal('cms_products_brochure_btn')
        };
      } else if (page === 'manufacturing') {
        cmsData.manufacturing = cmsData.manufacturing || {};
        cmsData.manufacturing.hero = {
          breadcrumb: getVal('cms_mfg_hero_breadcrumb') || 'Manufacturing',
          title: getVal('cms_mfg_hero_title'),
          subtitle: getVal('cms_mfg_hero_subtitle'),
          bannerImage: getVal('cms_mfg_hero_image')
        };
        const plantNames = [
          'Howrah Manufacturing Hub',
          'Guwahati Manufacturing Hub',
          'Roorkee Manufacturing Hub',
          'Hajipur Manufacturing Hub'
        ];
        const plantRegions = ['West Bengal', 'Assam', 'Uttarakhand', 'Bihar'];
        cmsData.manufacturing.plants = [0, 1, 2, 3].map((i) => ({
          name: plantNames[i],
          region: plantRegions[i],
          location: getVal('cms_mfg_plant_' + i + '_loc'),
          capacity: getVal('cms_mfg_plant_' + i + '_cap'),
          machines: getVal('cms_mfg_plant_' + i + '_mach'),
          image: getVal('cms_mfg_plant_' + i + '_img')
        }));
        cmsData.manufacturing.qualityTesting = {
          title: getVal('cms_mfg_qa_title'),
          desc: getVal('cms_mfg_qa_desc')
        };
      } else if (page === 'distributor') {
        cmsData.distributor = cmsData.distributor || {};
        cmsData.distributor.hero = {
          breadcrumb: getVal('cms_dist_hero_breadcrumb') || 'Dealer Desk',
          title: getVal('cms_dist_hero_title'),
          subtitle: getVal('cms_dist_benefits_subtitle'),
          bannerImage: getVal('cms_dist_hero_image')
        };
        cmsData.distributor.benefits = {
          title: getVal('cms_dist_benefits_title'),
          subtitle: getVal('cms_dist_benefits_subtitle'),
          badgeTitle: getVal('cms_dist_badge_title'),
          badgeSubtitle: getVal('cms_dist_badge_sub'),
          bars: [0, 1, 2, 3].map((i) => ({
            punchline: getVal('cms_dist_bar_' + i + '_punchline'),
            subtext: getVal('cms_dist_bar_' + i + '_subtext')
          }))
        };
        cmsData.distributor.unique = {
          heading: getVal('cms_dist_unique_heading'),
          desc: getVal('cms_dist_unique_desc'),
          btnText: getVal('cms_dist_unique_btn'),
          bannerImage: getVal('cms_dist_unique_img')
        };
        cmsData.distributor.cta = {
          heading: getVal('cms_dist_cta_heading'),
          desc: getVal('cms_dist_cta_desc'),
          primaryBtnText: getVal('cms_dist_cta_btn'),
          catalogueBtnText: getVal('cms_dist_cta_cat_btn')
        };
        cmsData.distributor.contactInfo = {
          hotline: getVal('cms_dist_contact_phone'),
          email: getVal('cms_dist_contact_email'),
          hours: getVal('cms_dist_contact_hours')
        };
        cmsData.distributor.whyPartner = cmsData.distributor.whyPartner || {};
        cmsData.distributor.whyPartner.title = getVal('cms_dist_benefits_title');
        cmsData.distributor.whyPartner.subtitle = getVal('cms_dist_benefits_subtitle');
      } else if (page === 'contact') {
        cmsData.contact = cmsData.contact || {};
        cmsData.general = cmsData.general || {};
        cmsData.contact.hero = {
          breadcrumb: getVal('cms_contact_hero_breadcrumb') || 'Contact Us',
          title: getVal('cms_contact_hero_title'),
          subtitle: getVal('cms_contact_hero_subtitle'),
          bannerImage: getVal('cms_contact_hero_image')
        };
        cmsData.general.contactEmail = getVal('cms_contact_email');
        cmsData.general.contactPhone = getVal('cms_contact_phone');
        cmsData.general.tollFree = getVal('cms_contact_tollfree');
        cmsData.general.whatsapp = getVal('cms_contact_whatsapp');
        cmsData.general.headOffice = getVal('cms_contact_address');
        cmsData.contact.corporateOffice = {
          address: getVal('cms_contact_address'),
          mapUrl: getVal('cms_contact_map_url')
        };

        const channelCards = document.querySelectorAll('#cms_channels_container .channel-row-card');
        const channels = [];
        channelCards.forEach((c) => {
          const label = c.querySelector('.channel-label')?.value?.trim() || '';
          const type = c.querySelector('.channel-type')?.value || 'phone';
          const value = c.querySelector('.channel-value')?.value?.trim() || '';
          const placement = c.querySelector('.channel-placement')?.value || 'both';
          const note = c.querySelector('.channel-note')?.value?.trim() || '';
          if (label || value) {
            channels.push({ label, type, value, placement, note });
          }
        });
        cmsData.contact.channels = channels;
        const factoryCards = document.querySelectorAll('#cms_factories_container .factory-row-card');
        const factories = [];
        factoryCards.forEach((c) => {
          const name = c.querySelector('.factory-name')?.value?.trim() || '';
          const subtitle = c.querySelector('.factory-subtitle')?.value?.trim() || '';
          const placement = c.querySelector('.factory-placement')?.value || 'both';
          const address = c.querySelector('.factory-address')?.value?.trim() || '';
          const phone = c.querySelector('.factory-phone')?.value?.trim() || '';
          const email = c.querySelector('.factory-email')?.value?.trim() || '';
          if (name || address) {
            factories.push({ name, subtitle, placement, address, phone, email });
          }
        });
        cmsData.contact.factories = factories;
        cmsData.general.socialLinks = {
          facebook: getVal('cms_social_fb'),
          instagram: getVal('cms_social_ig'),
          linkedin: getVal('cms_social_li'),
          amazon: getVal('cms_social_amz')
        };
      } else if (page === 'policies') {
        cmsData.policies = cmsData.policies || {};
        cmsData.policies.hero = {
          breadcrumb: getVal('cms_policy_hero_breadcrumb') || 'Policies',
          title: getVal('cms_policy_hero_title'),
          subtitle: getVal('cms_policy_hero_subtitle'),
          bannerImage: getVal('cms_policy_hero_image')
        };
        cmsData.policies.qualityWarranty = {
          title: 'Quality Standards & 1-Year Structural Warranty',
          text: getVal('cms_policy_warranty')
        };
        cmsData.policies.privacy = {
          title: 'Privacy & Data Protection Policy',
          text: getVal('cms_policy_privacy')
        };
        cmsData.policies.returnsReplacement = {
          title: 'Return & Replacement Policy',
          text: getVal('cms_policy_returns')
        };
        cmsData.policies.shippingDispatch = {
          title: 'Logistics, Shipping & Pan-India Dispatch',
          text: getVal('cms_policy_shipping')
        };
      }

      // 1. Always persist in IndexedDB (virtually unlimited capacity, zero quota limits)
      await idbStorage.set('np_custom_cms', cmsData);

      // 2. Also persist to localStorage for fast synchronous bootstrap if within quota
      try {
        localStorage.setItem('np_custom_cms', JSON.stringify(cmsData));
      } catch (quotaErr) {
        console.warn('LocalStorage quota reached. Purging temporary media cache:', quotaErr);
        try {
          localStorage.removeItem('np_custom_media');
          localStorage.setItem('np_custom_cms', JSON.stringify(cmsData));
        } catch (_) {
          console.warn('LocalStorage quota still exceeded, saved safely in IndexedDB without data loss.');
        }
      }

      try {
        localStorage.setItem('np_custom_cms_timestamp', Date.now().toString());
      } catch (_) {}

      // Attempt server sync if available
      try {
        const syncRes = await apiFetch('/api/cms/' + page, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cmsData[page])
        });
        console.log('[CMS Sync] Server updated successfully for page:', page, syncRes);

        // Also persist general if updated
        if (page === 'contact' && cmsData.general) {
          await apiFetch('/api/cms/general', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cmsData.general)
          });
        }
      } catch (e) {
        console.warn('Server sync skipped or error:', e);
      }

      // 3. Broadcast real-time update across all systems and open browser windows
      if (window.NP_REALTIME) {
        window.NP_REALTIME.broadcast('cms_updated', { page: page });
      }

      // 4. Notify all other open browser tabs to instantly reload content
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('np_cms_channel');
          bc.postMessage({ type: 'cms_updated', page: page });
        } catch (_) {}
      }
      showToast('All ' + page.toUpperCase() + ' sections saved and live on site!', 'success');
    } catch (err) {
      showToast(err.message || 'Save failed: ' + err, 'error');
    }
  };

  // Subtab switching for CMS Page Tabs
  const cmsTabs = document.querySelectorAll('.cms-tab-btn');
  const cmsForms = document.querySelectorAll('.cms-page-form');

  cmsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const page = tab.getAttribute('data-cmspage');
      switchCMSTab(page);
    });
  });

  window.switchCMSTab = function (page) {
    cmsTabs.forEach((t) => {
      if (t.getAttribute('data-cmspage') === page) t.classList.add('active');
      else t.classList.remove('active');
    });

    cmsForms.forEach((f) => {
      if (f.id === 'cmsForm_' + page) f.style.display = 'block';
      else f.style.display = 'none';
    });

    // Auto-refresh form inputs & active previews whenever switching tabs
    if (!cmsData || Object.keys(cmsData).length === 0) {
      const master = getDefaultCMS();
      if (master) cmsData = master;
    }
    if (cmsData) populateCMSForms();
  };

  // ================= 6. MEDIA LIBRARY =================
  const mediaDropzone = document.getElementById('mediaDropzone');
  const mediaFileInput = document.getElementById('mediaFileInput');
  const mediaGrid = document.getElementById('mediaGrid');
  const mediaPillGroup = document.getElementById('mediaPillGroup');
  let activeMediaTag = 'all';

  async function loadMedia() {
    try {
      let loaded = false;
      try {
        const res = await apiFetch('/api/media');
        if (res && res.success && Array.isArray(res.media)) {
          allMedia = res.media;
          loaded = true;
        }
      } catch (e) {}

      if (!loaded) {
        const staticRes = await fetch('data/media.json?t=' + Date.now());
        if (staticRes.ok) {
          allMedia = await staticRes.json();
          loaded = true;
        }
      }

      // Merge custom uploaded images from IndexedDB (first) or localStorage
      const idbMedia = await idbStorage.get('np_custom_media');
      if (Array.isArray(idbMedia) && idbMedia.length > 0) {
        allMedia = [...idbMedia, ...allMedia];
      } else {
        const customMediaStr = localStorage.getItem('np_custom_media');
        if (customMediaStr) {
          try {
            const customMedia = JSON.parse(customMediaStr);
            if (Array.isArray(customMedia)) {
              allMedia = [...customMedia, ...allMedia];
            }
          } catch (e) {}
        }
      }

      document.getElementById('mediaCount').textContent = allMedia.length;
      renderMediaGrid();
    } catch (err) {
      console.warn('Error loading media:', err);
    }
  }

  mediaPillGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    mediaPillGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeMediaTag = btn.getAttribute('data-mediatag');
    renderMediaGrid();
  });

  function renderMediaGrid() {
    const items = allMedia.filter((m) => activeMediaTag === 'all' || m.tag === activeMediaTag);
    if (items.length === 0) {
      mediaGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--slate-500);">No media items found.</div>`;
      return;
    }

    mediaGrid.innerHTML = items.map((m) => {
      const cleanUrl = m.url.replace(/^\//, '');
      const isUpload = m.tag === 'Uploads';
      return `
        <div class="media-item">
          <div class="media-thumb-wrap">
            <img src="${escapeHtml(cleanUrl)}" alt="" class="media-thumb" onerror="this.src='images/brand/company-national-logo.png'">
          </div>
          <div class="media-info">
            <div class="media-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</div>
            <div class="media-actions">
              ${currentTargetFieldForMedia ? `
                <button type="button" class="btn btn-primary btn-sm" onclick="selectMediaForField('${escapeHtml(cleanUrl)}')">
                  <i class="fas fa-check"></i> Select
                </button>
              ` : `
                <button type="button" class="btn btn-secondary btn-sm" onclick="copyMediaUrl('${escapeHtml(cleanUrl)}')">
                  <i class="fas fa-copy"></i> Copy
                </button>
              `}
              ${isUpload ? `
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteUploadFile('${escapeHtml(m.name)}')">
                  <i class="fas fa-trash"></i>
                </button>
              ` : `
                <span class="badge badge-national" style="font-size:10px;">${escapeHtml(m.tag)}</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.copyMediaUrl = function (url) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Image URL copied to clipboard: ' + url);
    });
  };

  window.deleteUploadFile = async function (filename) {
    if (!confirm(`Permanently delete "${filename}" from uploads?`)) return;
    try {
      // Remove from local custom media
      const customMediaStr = localStorage.getItem('np_custom_media');
      if (customMediaStr) {
        let customMedia = JSON.parse(customMediaStr) || [];
        customMedia = customMedia.filter((m) => m.name !== filename);
        localStorage.setItem('np_custom_media', JSON.stringify(customMedia));
      }
      allMedia = allMedia.filter((m) => m.name !== filename);

      try {
        await apiFetch(`/api/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Server delete skipped');
      }

      showToast('File deleted');
      renderMediaGrid();
      await loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to delete file', 'error');
    }
  };

  // Dropzone file upload
  mediaDropzone.addEventListener('click', () => mediaFileInput.click());
  mediaDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    mediaDropzone.classList.add('dragover');
  });
  mediaDropzone.addEventListener('dragleave', () => mediaDropzone.classList.remove('dragover'));
  mediaDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    mediaDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  });
  mediaFileInput.addEventListener('change', () => {
    if (mediaFileInput.files && mediaFileInput.files.length) {
      uploadFiles(mediaFileInput.files);
    }
  });

  async function uploadFiles(fileList) {
    showToast(`Optimizing & uploading ${fileList.length} file(s)...`);

    const newMediaItems = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const compressedUrl = await compressImageFile(file, 1200, 900, 0.82);
        const item = {
          name: file.name,
          url: compressedUrl,
          tag: 'Uploads',
          size: Math.round(compressedUrl.length * 0.75),
          mtime: Date.now()
        };
        newMediaItems.push(item);
      } catch (err) {
        console.warn('Error processing media file:', file.name, err);
      }
    }

    // Prepend to current in-memory media list
    allMedia = [...newMediaItems, ...allMedia];

    // Save to IndexedDB (virtually unlimited capacity)
    await idbStorage.set('np_custom_media', allMedia);

    // Keep localStorage lean (only 3 recent items max)
    try {
      const lean = allMedia.slice(0, 3);
      localStorage.setItem('np_custom_media', JSON.stringify(lean));
    } catch (_) {
      try { localStorage.removeItem('np_custom_media'); } catch (_) {}
    }

    // Try server upload if available
    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
      }
      await fetch('/api/upload', { method: 'POST', body: formData }).then((r) => r.json());
    } catch (e) {
      console.warn('Server upload skipped in Cloud Mode');
    }

    renderMediaGrid();
    document.getElementById('mediaCount').textContent = allMedia.length;
    await loadStats();
    showToast(`Added ${newMediaItems.length} optimized photo(s) to Media Library!`);
  }

  // --- Media Picker Modal for CMS and Products ---
  const mediaPickerModal = document.getElementById('mediaPickerModal');
  const pickerMediaGrid = document.getElementById('pickerMediaGrid');

  window.pickMediaFor = function (targetInputId) {
    currentTargetFieldForMedia = targetInputId;
    pickerMediaGrid.innerHTML = allMedia.map((m) => {
      const cleanUrl = m.url.replace(/^\//, '');
      return `
        <div class="media-item" style="cursor:pointer;" onclick="selectMedia('${escapeHtml(cleanUrl)}')">
          <div class="media-thumb-wrap">
            <img src="${escapeHtml(cleanUrl)}" alt="" class="media-thumb">
          </div>
          <div class="media-info">
            <div class="media-name">${escapeHtml(m.name)}</div>
          </div>
        </div>
      `;
    }).join('');
    mediaPickerModal.classList.add('active');
  };

  window.selectMedia = function (url) {
    if (currentTargetFieldForMedia) {
      const target = document.getElementById(currentTargetFieldForMedia);
      if (target) {
        target.value = url;
        // If product primary image preview
        if (currentTargetFieldForMedia === 'prodPrimaryImage') {
          prodImagePreview.src = url;
          prodImagePreviewWrap.style.display = 'block';
        }
      }
    }
    closeMediaPickerModal();
    showToast('Image selected: ' + url);
  };

  window.closeMediaPickerModal = function () {
    currentTargetFieldForMedia = null;
    mediaPickerModal.classList.remove('active');
  };

  // ================= 7. SETTINGS & EXPORT =================
  const changePasswordForm = document.getElementById('changePasswordForm');
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const storedPass = localStorage.getItem('np_admin_password') || 'nationalplasto2026';

    let success = false;
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res && res.success) success = true;
    } catch (err) {}

    if (currentPassword === storedPass) {
      localStorage.setItem('np_admin_password', newPassword);
      success = true;
    }

    if (success) {
      showToast('Password updated successfully!');
      changePasswordForm.reset();
    } else {
      showToast('Current password is incorrect', 'error');
    }
  });

  window.downloadFile = function (filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.exportData = function (type) {
    if (type === 'products') {
      window.downloadFile('products.json', JSON.stringify(allProducts, null, 2), 'application/json');
      showToast('Exported products.json');
    } else if (type === 'cms') {
      window.downloadFile('cms-content.json', JSON.stringify(cmsData, null, 2), 'application/json');
      showToast('Exported cms-content.json');
    } else if (type === 'catalogue') {
      const header = '/* National Plasto product catalogue - Generated from Admin CMS */\nwindow.NP_CATALOGUE = ';
      const jsContent = header + JSON.stringify(allProducts, null, 2) + ';\n';
      window.downloadFile('catalogue-2026.js', jsContent, 'application/javascript');
      showToast('Exported catalogue-2026.js');
    }
  };

  window.exportAllBundle = function () {
    exportData('products');
    setTimeout(() => exportData('cms'), 300);
    setTimeout(() => exportData('catalogue'), 600);
    showToast('Downloaded products.json, cms-content.json, and catalogue-2026.js!');
  };

  window.resetToPublishedDefaults = async function () {
    if (!confirm('Are you sure you want to reset all browser overrides back to published site defaults? Any unpublished browser edits will be cleared.')) return;
    localStorage.removeItem('np_custom_products');
    localStorage.removeItem('np_custom_cms');
    localStorage.removeItem('np_custom_media');
    await idbStorage.remove('np_custom_cms');
    await idbStorage.remove('np_custom_media');
    showToast('Reset to published defaults. Reloading...');
    setTimeout(() => window.location.reload(), 800);
  };

  // Self-heal any bloated local storage from previous uncompressed uploads
  try {
    const existingMedia = localStorage.getItem('np_custom_media');
    if (existingMedia && existingMedia.length > 500000) {
      const parsed = JSON.parse(existingMedia);
      idbStorage.set('np_custom_media', parsed);
      localStorage.setItem('np_custom_media', JSON.stringify(parsed.slice(0, 2)));
    }
  } catch (_) {}

  // Start app by checking authentication
  
  // Dynamic Factory & Regional Location rows management
  
  // Dynamic Support Helplines & Department Channels management
  window.renderChannelRows = function (list) {
    const container = document.getElementById('cms_channels_container');
    if (!container) return;
    container.innerHTML = '';
    const items = (Array.isArray(list) && list.length > 0) ? list : [
      { label: 'Authorized Dealer & Trade Helpline', type: 'phone', value: '+91 33 2242 1997 / 1998', placement: 'both', note: 'Mon - Sat: 9:30 AM - 6:30 PM' },
      { label: 'Retail, Bulk & WhatsApp Support', type: 'whatsapp', value: '+91 98300 12345', placement: 'both', note: 'Instant WhatsApp Chat' },
      { label: 'Official Correspondence', type: 'email', value: 'info@nationalplasto.com', placement: 'both', note: 'General inquiries & feedback' },
      { label: 'Commercial & Bulk Trade Desk', type: 'email', value: 'trade@nationalplasto.com', placement: 'contact_card', note: 'Institutional bulk purchases' }
    ];
    items.forEach((item) => {
      window.addChannelRow(item, false);
    });
  };

  window.addChannelRow = function (data = {}, autoScroll = true) {
    const container = document.getElementById('cms_channels_container');
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'channel-row-card';
    card.style.cssText = 'background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; position:relative; box-shadow:0 1px 3px rgba(0,0,0,0.04);';

    const label = data.label || '';
    const type = data.type || 'phone';
    const value = data.value || '';
    const placement = data.placement || 'both';
    const note = data.note || '';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">
        <span style="font-weight:700; color:#1E293B; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
          <i class="fas fa-headset" style="color:#2563EB;"></i> Helpline / Channel #<span class="channel-num"></span>
        </span>
        <button type="button" class="btn btn-sm" onclick="removeChannelRow(this)" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; padding:3px 8px; border-radius:6px; font-size:12px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:4px; transition:0.2s;">
          <i class="fas fa-trash-alt"></i> Remove
        </button>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-bottom:10px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Channel / Department Label</label>
          <input type="text" class="form-control channel-label" placeholder="e.g. Sales Desk, Dealer Helpline" value="${label.replace(/"/g, '&quot;')}" style="font-size:13px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Channel Type</label>
          <select class="form-control channel-type" style="font-size:13px; font-weight:500;">
            <option value="phone"${type === 'phone' ? ' selected' : ''}>Phone / Helpline</option>
            <option value="whatsapp"${type === 'whatsapp' ? ' selected' : ''}>WhatsApp Direct</option>
            <option value="email"${type === 'email' ? ' selected' : ''}>Email Address</option>
            <option value="landline"${type === 'landline' ? ' selected' : ''}>Office Landline</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Contact Value (Number / Email)</label>
          <input type="text" class="form-control channel-value" placeholder="e.g. +91 98300 12345 or info@..." value="${value.replace(/"/g, '&quot;')}" style="font-size:13px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block; color:#0F172A;">
            <i class="fas fa-layer-group" style="color:#2563EB;"></i> Frontend Placement
          </label>
          <select class="form-control channel-placement" style="font-size:13px; font-weight:600; background:#FFFFFF; border-color:#93C5FD;">
            <option value="both"${placement === 'both' ? ' selected' : ''}>Both (Contact Box &amp; Footer)</option>
            <option value="contact_card"${placement === 'contact_card' ? ' selected' : ''}>Contact Page (Registered Office Box)</option>
            <option value="footer"${placement === 'footer' ? ' selected' : ''}>Website Footer (Contact Column)</option>
            <option value="whatsapp_bar"${placement === 'whatsapp_bar' ? ' selected' : ''}>Floating WhatsApp Quick Bar</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="margin:0;">
        <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Subtitle / Hours / Note (Optional)</label>
        <input type="text" class="form-control channel-note" placeholder="e.g. Mon - Sat: 9:30 AM - 6:30 PM or Instant Response" value="${note.replace(/"/g, '&quot;')}" style="font-size:13px;">
      </div>
    `;

    container.appendChild(card);
    updateChannelRowIndices();

    if (autoScroll) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const firstInput = card.querySelector('.channel-label');
      if (firstInput) firstInput.focus();
    }
  };

  window.removeChannelRow = function (btn) {
    const card = btn.closest('.channel-row-card');
    if (!card) return;
    const container = document.getElementById('cms_channels_container');
    if (container.querySelectorAll('.channel-row-card').length <= 1) {
      alert('At least one helpline / channel row must be kept.');
      return;
    }
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.2s';
    setTimeout(() => {
      card.remove();
      updateChannelRowIndices();
    }, 200);
  };

  function updateChannelRowIndices() {
    const cards = document.querySelectorAll('#cms_channels_container .channel-row-card');
    cards.forEach((c, idx) => {
      const numSpan = c.querySelector('.channel-num');
      if (numSpan) numSpan.textContent = idx + 1;
    });
  }

  window.renderFactoryRows = function (list) {
    const container = document.getElementById('cms_factories_container');
    if (!container) return;
    container.innerHTML = '';
    const items = (Array.isArray(list) && list.length > 0) ? list : [
      { name: 'Howrah Plant', subtitle: 'West Bengal', placement: 'both', address: 'Jalan Industrial Estate, Dakshin Jhapardaha, Howrah, West Bengal 711411', phone: '+91 33 2669 0001', email: 'howrah@nationalplasto.com' },
      { name: 'Guwahati Plant', subtitle: 'Assam', placement: 'both', address: 'E.P.I.P. Complex, Amingaon, Guwahati, Assam 781031', phone: '+91 361 284 0002', email: 'guwahati@nationalplasto.com' },
      { name: 'Roorkee Plant', subtitle: 'Uttarakhand', placement: 'both', address: 'Raipur Industrial Area, Bhagwanpur, Roorkee, Uttarakhand 247661', phone: '+91 1332 235 003', email: 'roorkee@nationalplasto.com' },
      { name: 'Hajipur Plant', subtitle: 'Bihar', placement: 'both', address: 'EPIP Industrial Area, Hajipur, Vaishali, Bihar 844101', phone: '+91 6224 271 004', email: 'hajipur@nationalplasto.com' }
    ];
    items.forEach((item) => {
      window.addFactoryRow(item, false);
    });
  };

  window.addFactoryRow = function (data = {}, autoScroll = true) {
    const container = document.getElementById('cms_factories_container');
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'factory-row-card';
    card.style.cssText = 'background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px; position:relative; box-shadow:0 1px 3px rgba(0,0,0,0.04);';

    const name = data.name || '';
    const subtitle = data.subtitle || '';
    const placement = data.placement || 'both';
    const address = data.address || '';
    const phone = data.phone || '';
    const email = data.email || '';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:8px;">
        <span style="font-weight:700; color:#1E293B; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
          <i class="fas fa-map-marker-alt" style="color:var(--brand-primary, #C8102E);"></i> Location / Facility #<span class="row-num"></span>
        </span>
        <button type="button" class="btn btn-sm" onclick="removeFactoryRow(this)" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; padding:4px 10px; border-radius:6px; font-size:12px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:4px; transition:0.2s;">
          <i class="fas fa-trash-alt"></i> Remove
        </button>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:10px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Location / Plant Name</label>
          <input type="text" class="form-control factory-name" placeholder="e.g. Howrah Plant, Pune Regional Hub" value="${name.replace(/"/g, '&quot;')}" style="font-size:13px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">State / Territory / Badge</label>
          <input type="text" class="form-control factory-subtitle" placeholder="e.g. West Bengal, Maharashtra, Hub 2" value="${subtitle.replace(/"/g, '&quot;')}" style="font-size:13px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block; color:#0F172A;">
            <i class="fas fa-layer-group" style="color:#2563EB;"></i> Frontend Placement
          </label>
          <select class="form-control factory-placement" style="font-size:13px; font-weight:600; background:#FFFFFF; border-color:#93C5FD;">
            <option value="both"${placement === 'both' ? ' selected' : ''}>Both (Map Tabs &amp; Regional Hub Card)</option>
            <option value="factory"${placement === 'factory' || placement === 'map' ? ' selected' : ''}>Map Tabs (Interactive Map Section)</option>
            <option value="depot"${placement === 'depot' ? ' selected' : ''}>Regional Hub Card (Logistics Footprint)</option>
            <option value="office"${placement === 'office' ? ' selected' : ''}>Corporate / Branch Office Listing</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:10px;">
        <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Full Physical Address</label>
        <textarea class="form-control factory-address" rows="2" placeholder="Full postal address with district, state, and PIN code" style="font-size:13px; line-height:1.4;">${address}</textarea>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin:0;">
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Contact Helpline / Phone (Optional)</label>
          <input type="text" class="form-control factory-phone" placeholder="e.g. +91 33 2669 0001" value="${phone.replace(/"/g, '&quot;')}" style="font-size:13px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" style="font-size:12px; font-weight:600; margin-bottom:4px; display:block;">Email Address (Optional)</label>
          <input type="text" class="form-control factory-email" placeholder="e.g. howrah@nationalplasto.com" value="${email.replace(/"/g, '&quot;')}" style="font-size:13px;">
        </div>
      </div>
    `;

    container.appendChild(card);
    updateFactoryRowIndices();

    if (autoScroll) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const firstInput = card.querySelector('.factory-name');
      if (firstInput) firstInput.focus();
    }
  };

  window.removeFactoryRow = function (btn) {
    const card = btn.closest('.factory-row-card');
    if (!card) return;
    const container = document.getElementById('cms_factories_container');
    if (container.querySelectorAll('.factory-row-card').length <= 1) {
      alert('At least one location / factory row must be kept.');
      return;
    }
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.2s';
    setTimeout(() => {
      card.remove();
      updateFactoryRowIndices();
    }, 200);
  };

  function updateFactoryRowIndices() {
    const cards = document.querySelectorAll('#cms_factories_container .factory-row-card');
    cards.forEach((c, idx) => {
      const numSpan = c.querySelector('.row-num');
      if (numSpan) numSpan.textContent = idx + 1;
    });
  }

  // --- Dynamic Milestone Timeline Management ---
  let milestoneCounter = 100;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.renderMilestoneRows = function (list) {
    const container = document.getElementById('cms_home_milestones_container');
    if (!container) return;
    container.innerHTML = '';
    const items = (Array.isArray(list) && list.length > 0) ? list : [
      { year: '1997', date: 'Howrah, West Bengal · The Beginning', desc: 'National Plasto began its journey in Howrah, West Bengal, establishing the foundation for a manufacturing business built on quality, reliability, and customer trust.', image: 'images/home/milestone-1997.jpg' },
      { year: '2007', date: 'Guwahati, Assam · Expanding to the Northeast', desc: 'The expansion into Guwahati strengthened National Plasto’s presence in Northeast India, bringing manufacturing closer to regional markets and supporting a wider distribution network.', image: 'images/home/milestone-2007.jpg' },
      { year: '2010', date: 'Roorkee, Uttarakhand · Strengthening Northern Operations', desc: 'The establishment of the Roorkee facility marked another important step in the company’s growth, strengthening manufacturing capabilities and improving its reach across northern India.', image: 'images/home/milestone-2010.jpg' },
      { year: '2012', date: 'Hajipur, Bihar · Building a Stronger Manufacturing Network', desc: 'The Hajipur expansion further strengthened National Plasto’s manufacturing footprint, supporting broader market coverage and the company’s continued commitment to serving customers across India.', image: 'images/home/milestone-2012.jpg' },
      { year: '2026', date: 'Pan-India · Continuing Our Journey', desc: 'National Plasto continues its nationwide journey with 4 advanced manufacturing plants, 470+ verified partners across 17 states, and sustainable polymer innovations driving the future of furniture in India.', image: 'images/home/milestone-2026.jpg' }
    ];
    items.forEach((item) => {
      window.addMilestoneRow(item, false);
    });
  };

  window.addMilestoneRow = function (data = {}, autoScroll = true) {
    const container = document.getElementById('cms_home_milestones_container');
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'cms-item-box milestone-row-card';
    card.style.cssText = 'position:relative; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:16px;';

    const idx = ++milestoneCounter;
    const year = data.year || '';
    const date = data.date || '';
    const desc = data.desc || '';
    const image = data.image || 'images/home/milestone-1981.jpg';
    const displayTitle = year || `Milestone ${container.querySelectorAll('.milestone-row-card').length + 1}`;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #F1F5F9; padding-bottom:8px;">
        <div class="cms-item-box-title" id="cms_ms_box_title_${idx}" style="font-weight:700; color:#0284C7; font-size:14.5px; margin:0;">
          ${escapeHtml(displayTitle)}
        </div>
        <button type="button" class="btn btn-sm" onclick="removeMilestoneRow(this)" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; padding:3px 9px; border-radius:6px; font-size:11.5px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:4px; transition:0.2s;">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </div>

      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700; color:#0F172A; font-size:12.5px;">Milestone Title / Year <span style="color:#DC2626;">*</span></label>
        <input type="text" id="cms_home_ms_${idx}_year" class="form-control milestone-year" value="${escapeHtml(year)}" placeholder="e.g. 1981: Foundation or 2012: Hajipur Plant" oninput="updateMilestoneCardTitle(this, ${idx})" style="font-weight:600; font-size:13.5px;">
      </div>

      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:600; color:#334155; font-size:12px;">Subtitle (e.g. Location · Tagline)</label>
        <input type="text" id="cms_home_ms_${idx}_date" class="form-control milestone-date" value="${escapeHtml(date)}" placeholder="e.g. Hajipur, Bihar · Building a Stronger Manufacturing Network" style="font-size:13px;">
      </div>

      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:600; color:#334155; font-size:12px;">Description</label>
        <textarea id="cms_home_ms_${idx}_desc" class="form-control milestone-desc" rows="3" placeholder="Milestone description..." style="font-size:13px; line-height:1.5;">${escapeHtml(desc)}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-weight:600; color:#334155; font-size:12px;">Image URL</label>
        <div style="display:flex; gap:6px; margin-top:4px; margin-bottom:6px;">
          <input type="text" id="cms_home_ms_${idx}_img" class="form-control milestone-img" value="${escapeHtml(image)}" oninput="updateImagePreview(this, 'cms_home_ms_${idx}_img_preview')" style="font-size:13px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="uploadImageForField('cms_home_ms_${idx}_img')" style="white-space:nowrap;"><i class="fas fa-cloud-upload-alt"></i> Upload New</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_ms_${idx}_img')"><i class="fas fa-images"></i> Pick</button>
        </div>
        <div onclick="uploadImageForField('cms_home_ms_${idx}_img')" style="display:flex; align-items:center; gap:10px; padding:6px 12px; background:#fff; border:1px dashed #CBD5E1; border-radius:6px; cursor:pointer; flex-wrap:wrap;" title="Click to upload and change photo">
          <img id="cms_home_ms_${idx}_img_preview" src="${escapeHtml(image || 'images/brand/company-national-logo.png')}" alt="Milestone Photo" style="width:50px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #CBD5E1;" onerror="this.src='images/brand/company-national-logo.png'">
          <div>
            <div style="font-size:11px; font-weight:700; color:#0284C7; text-transform:uppercase;"><i class="fas fa-camera"></i> Applied Active Photo</div>
            <div style="font-size:11px; color:#64748B;">Click here or click "Upload New" to replace with a file from device</div>
            <div class="cms-size-hint" style="width:100%; display:flex; align-items:center; gap:6px; margin-top:6px; font-size:11px; font-weight:600; color:#047857; background:#ECFDF5; border:1px solid #A7F3D0; padding:4px 8px; border-radius:4px;"><i class="fas fa-ruler-combined" style="color:#059669;"></i> Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG</div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
    if (autoScroll) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const firstInput = card.querySelector('.milestone-year');
      if (firstInput) firstInput.focus();
    }
  };

  window.removeMilestoneRow = function (btn) {
    const card = btn.closest('.milestone-row-card');
    if (!card) return;
    const container = document.getElementById('cms_home_milestones_container');
    if (container.querySelectorAll('.milestone-row-card').length <= 1) {
      alert('At least one milestone must be kept in the timeline.');
      return;
    }
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.2s';
    setTimeout(() => {
      card.remove();
    }, 200);
  };

  window.updateMilestoneCardTitle = function (input, idx) {
    const titleEl = document.getElementById('cms_ms_box_title_' + idx);
    if (titleEl) {
      titleEl.textContent = input.value.trim() || 'Milestone';
    }
  };

  function harvestMilestonesFromDOM() {
    const cards = document.querySelectorAll('#cms_home_milestones_container .milestone-row-card');
    const result = [];
    cards.forEach((card) => {
      const year = card.querySelector('.milestone-year')?.value?.trim() || '';
      const date = card.querySelector('.milestone-date')?.value?.trim() || '';
      const desc = card.querySelector('.milestone-desc')?.value?.trim() || '';
      const image = card.querySelector('.milestone-img')?.value?.trim() || '';
      if (year || date || desc) {
        result.push({ year, date, desc, image });
      }
    });
    return result;
  }

  // ================= 10. REAL-TIME MULTI-USER SYNCHRONIZATION =================
  function updateRealtimeBadge(status, mode) {
    const badge = document.getElementById('realtimeSyncBadge');
    const text = document.getElementById('realtimeSyncText');
    const dot = document.querySelector('.realtime-dot');
    if (!badge || !text) return;

    if (status === 'connected') {
      badge.style.background = '#DCFCE7';
      badge.style.color = '#15803D';
      text.textContent = mode === 'sse' ? 'Real-Time Live (SSE)' : 'Real-Time Sync Active';
      if (dot) dot.style.background = '#22C55E';
    } else {
      badge.style.background = '#FEF3C7';
      badge.style.color = '#B45309';
      text.textContent = 'Real-Time Connecting...';
      if (dot) dot.style.background = '#F59E0B';
    }
  }

  function attachAdminRealtime() {
    if (!window.NP_REALTIME) {
      setTimeout(attachAdminRealtime, 200);
      return;
    }

    // 1. Live product updates from another administrator
    window.NP_REALTIME.on('products_updated', async (payload, meta) => {
      if (meta && meta.source === 'local') return;
      await loadProducts(true);
      await loadStats();
      showToast('Products updated in real-time by another administrator', 'info');
    });

    // 2. Live CMS updates from another administrator
    window.NP_REALTIME.on('cms_updated', async (payload, meta) => {
      if (meta && meta.source === 'local') return;
      const isTyping = document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

      if (!isTyping) {
        await loadCMS(true);
        const pageName = (payload && payload.page && payload.page !== 'all') ? payload.page.toUpperCase() : 'Site';
        showToast(`${pageName} updated in real-time by another administrator`, 'info');
      } else {
        showToast('New content published by another administrator', 'info');
      }
    });

    // 3. Live customer inquiry notifications
    window.NP_REALTIME.on('inquiry_received', (payload) => {
      showToast(`New inquiry received from ${payload.inquiry?.name || 'customer'}!`, 'success');
      loadInquiries().catch(() => {});
    });

    // 4. Connection state updates
    window.NP_REALTIME.on('connection_state', (payload) => {
      updateRealtimeBadge(payload.status, payload.mode);
    });

    // Initial badge update
    const curStatus = window.NP_REALTIME.getStatus();
    if (curStatus && curStatus.connected) {
      updateRealtimeBadge('connected', curStatus.mode);
    }
  }

  attachAdminRealtime();
  checkAuth();
})();

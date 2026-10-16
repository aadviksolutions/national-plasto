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

  // API Helper
  function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    return fetch(url, options).then(async (res) => {
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
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.success && res.user) {
        currentUser = res.user;
        showApp();
      } else {
        showAuth();
      }
    } catch {
      showAuth();
    }
  }

  function showAuth() {
    currentUser = null;
    authScreen.style.display = 'flex';
    appLayout.style.display = 'none';
  }

  function showApp() {
    authScreen.style.display = 'none';
    appLayout.style.display = 'flex';
    sidebarUserName.textContent = currentUser.username || 'Admin';
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

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.success) {
        currentUser = res.user;
        showApp();
        showToast('Welcome back, Admin!');
      }
    } catch (err) {
      authError.textContent = err.message || 'Invalid login credentials';
      authError.style.display = 'block';
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn(e);
    }
    showAuth();
    showToast('Logged out successfully');
  });

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
    await loadStats();
    await loadProducts();
    await loadCMS();
    await loadMedia();
  }

  async function loadStats() {
    try {
      const stats = await apiFetch('/api/stats');
      if (stats.success) {
        document.getElementById('statTotalProducts').textContent = stats.totalProducts;
        document.getElementById('statTotalBrands').textContent = Object.keys(stats.brands || {}).length;
        document.getElementById('statTotalCategories').textContent = Object.keys(stats.categories || {}).length;
        document.getElementById('statTotalMedia').textContent = stats.uploadedImagesCount;

        // Render brand breakdown cards
        const container = document.getElementById('brandCardsContainer');
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
      btnSyncCatalogue.disabled = true;
      btnSyncCatalogue.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
      const res = await apiFetch('/api/sync/catalogue', { method: 'POST' });
      showToast(res.message || 'Catalogue re-synced successfully!');
    } catch (err) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      btnSyncCatalogue.disabled = false;
      btnSyncCatalogue.innerHTML = '<i class="fas fa-sync-alt"></i> Re-Sync Catalogue';
    }
  }
  if (btnSyncCatalogue) btnSyncCatalogue.addEventListener('click', triggerSync);
  if (btnSettingsSync) btnSettingsSync.addEventListener('click', triggerSync);

  // ================= 4. PRODUCTS MANAGEMENT =================
  async function loadProducts() {
    try {
      const res = await apiFetch('/api/products');
      if (res.success) {
        allProducts = res.products;
        populateCategoryFilter();
        applyProductFilters();
      }
    } catch (err) {
      showToast('Error loading products: ' + err.message, 'error');
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
      const formData = new FormData();
      formData.append('files', this.files[0]);
      try {
        showToast('Uploading photo...');
        const res = await fetch('/api/upload', { method: 'POST', body: formData }).then((r) => r.json());
        if (res.success && res.files && res.files[0]) {
          prodPrimaryImage.value = res.files[0].url.replace(/^\//, ''); // Clean leading slash
          prodImagePreview.src = prodPrimaryImage.value;
          prodImagePreviewWrap.style.display = 'block';
          showToast('Image uploaded successfully!');
        }
      } catch (err) {
        showToast('Upload failed: ' + err.message, 'error');
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
      let res;
      if (id) {
        res = await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      showToast(res.message || 'Product saved successfully!');
      closeProductModal();
      await loadProducts();
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
      const res = await apiFetch(`/api/products/${encodeURIComponent(deletingProductId)}`, { method: 'DELETE' });
      showToast(res.message || 'Product deleted');
      closeDeleteModal();
      await loadProducts();
      await loadStats();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      btnConfirmDelete.disabled = false;
    }
  });

  // ================= 5. PAGE CONTENT CMS =================
  async function loadCMS() {
    try {
      const res = await apiFetch('/api/cms');
      if (res.success && res.data) {
        cmsData = res.data;
        populateCMSForms();
      }
    } catch (err) {
      console.warn('Error loading CMS data:', err);
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

      // Milestones (5)
      (cmsData.home.milestones || []).forEach((ms, idx) => {
        setVal('cms_home_ms_' + idx + '_date', ms.date);
        setVal('cms_home_ms_' + idx + '_desc', ms.desc);
        setVal('cms_home_ms_' + idx + '_img', ms.image);
      });

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

      // Board of Directors (5 members)
      (cmsData.about.leadership || []).forEach((l, idx) => {
        setVal('cms_about_lead_' + idx + '_name', l.name);
        setVal('cms_about_lead_' + idx + '_role', l.role);
        setVal('cms_about_lead_' + idx + '_photo', l.photo);
        setVal('cms_about_lead_' + idx + '_bio', l.bio);
        setVal('cms_about_lead_' + idx + '_quote', l.quote);
      });
    }

    // C. Products Page
    if (cmsData.products) {
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
      setVal('cms_dist_hero_title', cmsData.distributor.hero?.title);
      setVal('cms_dist_hero_subtitle', cmsData.distributor.hero?.subtitle);
      setVal('cms_dist_hero_image', cmsData.distributor.hero?.bannerImage);

      setVal('cms_dist_perks_title', cmsData.distributor.whyPartner?.title);
      setVal('cms_dist_contact_phone', cmsData.distributor.contactInfo?.hotline);
      setVal('cms_dist_contact_email', cmsData.distributor.contactInfo?.email);
      setVal('cms_dist_contact_hours', cmsData.distributor.contactInfo?.hours);

      (cmsData.distributor.process?.steps || []).forEach((st, idx) => {
        setVal('cms_dist_step_' + idx + '_title', st.title);
        setVal('cms_dist_step_' + idx + '_desc', st.desc);
      });
    }

    // F. Contact Us
    if (cmsData.contact || cmsData.general) {
      setVal('cms_contact_hero_title', cmsData.contact?.hero?.title);
      setVal('cms_contact_hero_subtitle', cmsData.contact?.hero?.subtitle);
      setVal('cms_contact_hero_image', cmsData.contact?.hero?.bannerImage);

      setVal('cms_contact_email', cmsData.general?.contactEmail);
      setVal('cms_contact_phone', cmsData.general?.contactPhone);
      setVal('cms_contact_tollfree', cmsData.general?.tollFree);
      setVal('cms_contact_whatsapp', cmsData.general?.whatsapp);
      setVal('cms_contact_address', cmsData.contact?.corporateOffice?.address || cmsData.general?.headOffice);
      setVal('cms_contact_map_url', cmsData.contact?.corporateOffice?.mapUrl);

      if (cmsData.contact?.factories) {
        setVal('cms_contact_factory_0', cmsData.contact.factories[0]?.address);
        setVal('cms_contact_factory_1', cmsData.contact.factories[1]?.address);
        setVal('cms_contact_factory_2', cmsData.contact.factories[2]?.address);
        setVal('cms_contact_factory_3', cmsData.contact.factories[3]?.address);
      }

      setVal('cms_social_fb', cmsData.general?.socialLinks?.facebook);
      setVal('cms_social_ig', cmsData.general?.socialLinks?.instagram);
      setVal('cms_social_li', cmsData.general?.socialLinks?.linkedin);
      setVal('cms_social_amz', cmsData.general?.socialLinks?.amazon);
    }

    // G. Policies
    if (cmsData.policies) {
      setVal('cms_policy_hero_title', cmsData.policies.hero?.title);
      setVal('cms_policy_hero_subtitle', cmsData.policies.hero?.subtitle);
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

        // Milestones (5)
        const milestoneYears = ['1981', '1997', '2007', '2010', '2026'];
        cmsData.home.milestones = [0, 1, 2, 3, 4].map((i) => ({
          year: milestoneYears[i],
          date: getVal('cms_home_ms_' + i + '_date'),
          desc: getVal('cms_home_ms_' + i + '_desc'),
          image: getVal('cms_home_ms_' + i + '_img')
        }));

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
          title: getVal('cms_dist_hero_title'),
          subtitle: getVal('cms_dist_hero_subtitle'),
          bannerImage: getVal('cms_dist_hero_image')
        };
        cmsData.distributor.whyPartner = cmsData.distributor.whyPartner || {};
        cmsData.distributor.whyPartner.title = getVal('cms_dist_perks_title');
        cmsData.distributor.contactInfo = {
          hotline: getVal('cms_dist_contact_phone'),
          email: getVal('cms_dist_contact_email'),
          hours: getVal('cms_dist_contact_hours')
        };
        cmsData.distributor.process = cmsData.distributor.process || { steps: [] };
        cmsData.distributor.process.steps = [0, 1, 2, 3].map((i) => ({
          step: '0' + (i + 1),
          title: getVal('cms_dist_step_' + i + '_title'),
          desc: getVal('cms_dist_step_' + i + '_desc')
        }));
      } else if (page === 'contact') {
        cmsData.contact = cmsData.contact || {};
        cmsData.general = cmsData.general || {};
        cmsData.contact.hero = {
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
        cmsData.contact.factories = [
          { name: 'Howrah Plant (West Bengal)', address: getVal('cms_contact_factory_0') },
          { name: 'Guwahati Plant (Assam)', address: getVal('cms_contact_factory_1') },
          { name: 'Roorkee Plant (Uttarakhand)', address: getVal('cms_contact_factory_2') },
          { name: 'Hajipur Plant (Bihar)', address: getVal('cms_contact_factory_3') }
        ];
        cmsData.general.socialLinks = {
          facebook: getVal('cms_social_fb'),
          instagram: getVal('cms_social_ig'),
          linkedin: getVal('cms_social_li'),
          amazon: getVal('cms_social_amz')
        };
      } else if (page === 'policies') {
        cmsData.policies = cmsData.policies || {};
        cmsData.policies.hero = {
          title: getVal('cms_policy_hero_title'),
          subtitle: getVal('cms_policy_hero_subtitle')
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

      // Send to server
      const res = await apiFetch('/api/cms/' + page, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmsData[page])
      });

      // Also persist general if updated
      if (page === 'contact' && cmsData.general) {
        await apiFetch('/api/cms/general', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cmsData.general)
        });
      }

      showToast(res.message || 'All ' + page.toUpperCase() + ' sections saved successfully!');
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
  };

  // ================= 6. MEDIA LIBRARY =================
  const mediaDropzone = document.getElementById('mediaDropzone');
  const mediaFileInput = document.getElementById('mediaFileInput');
  const mediaGrid = document.getElementById('mediaGrid');
  const mediaPillGroup = document.getElementById('mediaPillGroup');
  let activeMediaTag = 'all';

  async function loadMedia() {
    try {
      const res = await apiFetch('/api/media');
      if (res.success && res.media) {
        allMedia = res.media;
        document.getElementById('mediaCount').textContent = allMedia.length;
        renderMediaGrid();
      }
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
              <button type="button" class="btn btn-secondary btn-sm" onclick="copyMediaUrl('${escapeHtml(cleanUrl)}')">
                <i class="fas fa-copy"></i> Copy
              </button>
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
    if (!confirm(`Permanently delete "${filename}" from server uploads?`)) return;
    try {
      const res = await apiFetch(`/api/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      showToast(res.message || 'File deleted');
      await loadMedia();
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
    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }
    try {
      showToast(`Uploading ${fileList.length} file(s)...`);
      const res = await fetch('/api/upload', { method: 'POST', body: formData }).then((r) => r.json());
      if (res.success) {
        showToast(res.message || 'Files uploaded successfully!');
        await loadMedia();
        await loadStats();
      } else {
        throw new Error(res.error || 'Upload failed');
      }
    } catch (err) {
      showToast('Upload error: ' + err.message, 'error');
    }
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
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      showToast(res.message || 'Password updated successfully!');
      changePasswordForm.reset();
    } catch (err) {
      showToast(err.message || 'Password update failed', 'error');
    }
  });

  window.exportData = function (type) {
    let filename = 'national-plasto-products.json';
    let dataStr = JSON.stringify(allProducts, null, 2);
    if (type === 'cms') {
      filename = 'national-plasto-cms.json';
      dataStr = JSON.stringify(cmsData, null, 2);
    }
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`);
  };

  // Start app by checking authentication
  checkAuth();
})();

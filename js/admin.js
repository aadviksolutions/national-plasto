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
  }

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
    const targetPanel = document.getElementById(`panel${capitalize(target)}`);
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
      if (subtab) switchCMSTab(subtab);
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
    // Home
    if (cmsData.home) {
      setVal('cms_home_hero_title', cmsData.home.hero?.title);
      setVal('cms_home_hero_subtitle', cmsData.home.hero?.subtitle);
      setVal('cms_home_hero_badge', cmsData.home.hero?.badge);
      setVal('cms_home_hero_image', cmsData.home.hero?.bannerImage);
      setVal('cms_home_hero_ctaText', cmsData.home.hero?.ctaText);
      setVal('cms_home_hero_ctaLink', cmsData.home.hero?.ctaLink);
      setVal('cms_home_story_title', cmsData.home.uniqueStory?.title);
      setVal('cms_home_story_desc', cmsData.home.uniqueStory?.desc);
      setVal('cms_home_story_image', cmsData.home.uniqueStory?.image);
    }

    // About
    if (cmsData.about) {
      setVal('cms_about_hero_title', cmsData.about.hero?.title);
      setVal('cms_about_hero_subtitle', cmsData.about.hero?.subtitle);
      setVal('cms_about_hero_image', cmsData.about.hero?.bannerImage);
      setVal('cms_about_overview_desc', cmsData.about.overview?.desc);
    }

    // Products
    if (cmsData.products) {
      setVal('cms_products_hero_title', cmsData.products.hero?.title);
      setVal('cms_products_hero_subtitle', cmsData.products.hero?.subtitle);
      setVal('cms_products_hero_image', cmsData.products.hero?.bannerImage);
      setVal('cms_products_brand_title', cmsData.products.shopByBrandHeader?.title);
      setVal('cms_products_brand_desc', cmsData.products.shopByBrandHeader?.desc);
      setVal('cms_products_collection_title', cmsData.products.exploreCollectionsHeader?.title);
      setVal('cms_products_collection_desc', cmsData.products.exploreCollectionsHeader?.desc);
    }

    // Manufacturing
    if (cmsData.manufacturing) {
      setVal('cms_mfg_hero_title', cmsData.manufacturing.hero?.title);
      setVal('cms_mfg_hero_subtitle', cmsData.manufacturing.hero?.subtitle);
      setVal('cms_mfg_hero_image', cmsData.manufacturing.hero?.bannerImage);
    }

    // Distributor
    if (cmsData.distributor) {
      setVal('cms_dist_hero_title', cmsData.distributor.hero?.title);
      setVal('cms_dist_hero_subtitle', cmsData.distributor.hero?.subtitle);
      setVal('cms_dist_hero_image', cmsData.distributor.hero?.bannerImage);
    }

    // Contact
    if (cmsData.general) {
      setVal('cms_contact_email', cmsData.general.contactEmail);
      setVal('cms_contact_phone', cmsData.general.contactPhone);
      setVal('cms_contact_tollfree', cmsData.general.tollFree);
      setVal('cms_contact_whatsapp', cmsData.general.whatsapp);
      setVal('cms_contact_address', cmsData.general.headOffice);
      setVal('cms_social_fb', cmsData.general.socialLinks?.facebook);
      setVal('cms_social_ig', cmsData.general.socialLinks?.instagram);
      setVal('cms_social_li', cmsData.general.socialLinks?.linkedin);
      setVal('cms_social_amz', cmsData.general.socialLinks?.amazon);
    }

    // Policies
    if (cmsData.policies) {
      setVal('cms_policy_warranty', cmsData.policies.warrantyText);
      setVal('cms_policy_privacy', cmsData.policies.privacyText);
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // Subtab switching
  const cmsTabs = document.querySelectorAll('.cms-tab-btn');
  const cmsForms = document.querySelectorAll('.cms-page-form');

  cmsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const page = tab.getAttribute('data-cmspage');
      switchCMSTab(page);
    });
  });

  function switchCMSTab(page) {
    cmsTabs.forEach((t) => {
      if (t.getAttribute('data-cmspage') === page) t.classList.add('active');
      else t.classList.remove('active');
    });

    cmsForms.forEach((f) => {
      if (f.id === `cmsForm_${page}`) f.style.display = 'block';
      else f.style.display = 'none';
    });
  }

  window.saveCurrentCMS = async function (page) {
    try {
      if (page === 'home') {
        cmsData.home = cmsData.home || {};
        cmsData.home.hero = {
          title: getVal('cms_home_hero_title'),
          subtitle: getVal('cms_home_hero_subtitle'),
          badge: getVal('cms_home_hero_badge'),
          bannerImage: getVal('cms_home_hero_image'),
          ctaText: getVal('cms_home_hero_ctaText'),
          ctaLink: getVal('cms_home_hero_ctaLink')
        };
        cmsData.home.uniqueStory = {
          title: getVal('cms_home_story_title'),
          desc: getVal('cms_home_story_desc'),
          image: getVal('cms_home_story_image')
        };
      } else if (page === 'about') {
        cmsData.about = cmsData.about || {};
        cmsData.about.hero = {
          title: getVal('cms_about_hero_title'),
          subtitle: getVal('cms_about_hero_subtitle'),
          bannerImage: getVal('cms_about_hero_image')
        };
        cmsData.about.overview = { desc: getVal('cms_about_overview_desc') };
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
      } else if (page === 'manufacturing') {
        cmsData.manufacturing = cmsData.manufacturing || {};
        cmsData.manufacturing.hero = {
          title: getVal('cms_mfg_hero_title'),
          subtitle: getVal('cms_mfg_hero_subtitle'),
          bannerImage: getVal('cms_mfg_hero_image')
        };
      } else if (page === 'distributor') {
        cmsData.distributor = cmsData.distributor || {};
        cmsData.distributor.hero = {
          title: getVal('cms_dist_hero_title'),
          subtitle: getVal('cms_dist_hero_subtitle'),
          bannerImage: getVal('cms_dist_hero_image')
        };
      } else if (page === 'contact') {
        cmsData.general = cmsData.general || {};
        cmsData.general.contactEmail = getVal('cms_contact_email');
        cmsData.general.contactPhone = getVal('cms_contact_phone');
        cmsData.general.tollFree = getVal('cms_contact_tollfree');
        cmsData.general.whatsapp = getVal('cms_contact_whatsapp');
        cmsData.general.headOffice = getVal('cms_contact_address');
        cmsData.general.socialLinks = {
          facebook: getVal('cms_social_fb'),
          instagram: getVal('cms_social_ig'),
          linkedin: getVal('cms_social_li'),
          amazon: getVal('cms_social_amz')
        };
      } else if (page === 'policies') {
        cmsData.policies = cmsData.policies || {};
        cmsData.policies.warrantyText = getVal('cms_policy_warranty');
        cmsData.policies.privacyText = getVal('cms_policy_privacy');
      }

      // Save to server
      const res = await apiFetch(`/api/cms/${encodeURIComponent(page)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmsData[page] || cmsData.general)
      });
      showToast(res.message || 'Page content updated successfully!');
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
    }
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

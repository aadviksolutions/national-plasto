/**
 * National Plasto — Product Catalogue page (products.html)
 * Renders window.NP_CATALOGUE (generated from the 2026 photoshoot) grouped
 * by category, with brand tabs, category chips, search, interactive 360° Studio Showcase,
 * and a rich 360° 3D Quick-View rotation modal.
 */
(function () {
  var DATA = window.NP_CATALOGUE || [];

  var BRANDS = ['National', 'Next', 'Sapphire', 'Captain'];
  var CATEGORY_ORDER = [
    'Arm Chairs', 'Premium Arm Chairs', 'Armless Chairs', 'Premium Armless Chairs',
    'Metallic Chairs', 'Steel Moulded Chairs', 'Baby Chairs', 'Stools', 'Tables',
    'Dining Sets', 'Trolleys & Racks', 'Wardrobes'
  ];
  // Legacy ?category= / ?cat= links used across the site
  var CATEGORY_GROUPS = {
    chairs: ['Arm Chairs', 'Premium Arm Chairs', 'Armless Chairs', 'Premium Armless Chairs', 'Metallic Chairs', 'Steel Moulded Chairs'],
    monoblock: ['Arm Chairs', 'Armless Chairs'],
    cushioned: ['Premium Arm Chairs', 'Premium Armless Chairs', 'Dining Sets'],
    tables: ['Tables', 'Dining Sets'],
    stools: ['Stools'],
    'baby-kids': ['Baby Chairs'],
    storage: ['Wardrobes', 'Trolleys & Racks'],
    utility: ['Trolleys & Racks'],
    industrial: ['Trolleys & Racks']
  };

  var state = { brand: 'all', cats: [], query: '' };

  // 180 products identified with multi-angle rotational studio photography sequences
  var MULTI_ANGLE_MAP = {};
  [2, 9, 12, 13, 15, 17, 18, 19, 24, 27, 28, 31, 34, 37, 39, 40, 41, 43, 44, 46, 47, 49, 54, 55, 56, 59, 68, 69, 70, 75, 76, 77, 78, 79, 80, 82, 88, 90, 92, 93, 94, 95, 96, 101, 105, 106, 107, 108, 109, 111, 112, 116, 117, 119, 120, 124, 125, 127, 130, 133, 135, 137, 139, 141, 144, 145, 146, 147, 149, 150, 151, 153, 155, 156, 160, 161, 164, 165, 166, 168, 171, 173, 175, 177, 180, 183, 188, 189, 190, 191, 192, 193, 194, 195, 197, 200, 201, 203, 204, 205, 206, 209, 210, 212, 213, 214, 215, 217, 218, 219, 222, 226, 229, 230, 233, 234, 237, 241, 242, 243, 244, 245, 262, 264, 266, 268, 269, 271, 273, 275, 277, 278, 279, 281, 283, 284, 285, 287, 290, 291, 293, 296, 298, 308, 309, 310, 313, 315, 316, 317, 318, 320, 321, 322, 323, 325, 326, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 343, 346, 348, 349, 354, 356, 357, 358, 359, 360, 361].forEach(function (idx) {
    MULTI_ANGLE_MAP[idx] = true;
  });

  function isMultiAngleProduct(idx) {
    return false;
  }

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function catSlug(c) { return c.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-'); }

  function matches(p, ignoreCats) {
    if (state.brand !== 'all' && p.b !== state.brand) return false;
    if (!ignoreCats && state.cats.length && state.cats.indexOf(p.c) === -1) return false;
    if (state.query) {
      var hay = (p.n + ' ' + p.b + ' ' + p.c + ' ' + (p.sku || '')).toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  function option(attr, value, label, count, on) {
    return '<button type="button" class="np-f-opt' + (on ? ' on' : '') + '" ' + attr + '="' + esc(value) + '">' +
      '<span class="np-f-tick" aria-hidden="true"></span>' + esc(label) +
      (count != null ? '<em>' + count + '</em>' : '') + '</button>';
  }

  function renderBrandTabs() {
    var counts = { all: DATA.length };
    DATA.forEach(function (p) { counts[p.b] = (counts[p.b] || 0) + 1; });
    var el = $('npBrandTabs');
    if (!el) return;
    el.innerHTML = ['all'].concat(BRANDS).map(function (b) {
      return option('data-brand', b, b === 'all' ? 'All brands' : b.toUpperCase(), counts[b] || 0, state.brand === b);
    }).join('');
  }

  function renderCategoryChips() {
    var counts = {};
    DATA.forEach(function (p) { if (matches(p, true)) counts[p.c] = (counts[p.c] || 0) + 1; });
    var total = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0);
    var html = option('data-cat', '', 'All collections', total, !state.cats.length);
    CATEGORY_ORDER.forEach(function (c) {
      if (!counts[c]) return;
      html += option('data-cat', c, c, counts[c], state.cats.length === 1 && state.cats[0] === c);
    });
    // grouped links from the menu (e.g. "Moulded Furniture") select several collections at once
    if (state.cats.length > 1) {
      html = option('data-cat', '', 'All collections', total, false) +
        CATEGORY_ORDER.filter(function (c) { return counts[c]; }).map(function (c) {
          return option('data-cat', c, c, counts[c], state.cats.indexOf(c) !== -1);
        }).join('');
    }
    var el = $('npCategoryChips');
    if (el) el.innerHTML = html;
  }

  function card(p, idx) {
    var img = p.img[0];
    var alt = p.img[1];
    var thumbs = p.img.length > 1 ? '<div class="np-card-thumbs">' + p.img.slice(0, 5).map(function (im, i) {
      return '<img src="' + im.f + '" alt="" loading="lazy" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>';
    }).join('') + '</div>' : '';
    var hintBadge = '';
    if (p.img && p.img.length > 1) {
      hintBadge = '<span class="np-card-360-hint" style="background:#F1F5F9;color:#64748B;" title="' + p.img.length + ' studio colorways"><i class="fas fa-palette"></i> ' + p.img.length + ' Colors</span>';
    }
    return '' +
      '<article class="np-card" data-idx="' + idx + '">' +
        '<div class="np-card-media" title="Click to view ' + esc(p.b + ' ' + p.n) + '">' +
          '<span class="np-card-brand np-badge-' + p.b.toLowerCase() + '">' + esc(p.b) + '</span>' +
          '<img class="np-card-img" src="' + img.f + '" alt="' + esc(p.b + ' ' + p.n) + '" loading="lazy" width="' + img.w + '" height="' + img.h + '">' +
          (alt ? '<img class="np-card-img np-card-img-alt" src="' + alt.f + '" alt="" loading="lazy" aria-hidden="true">' : '') +
        '</div>' +
        thumbs +
        '<div class="np-card-body">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">' +
            '<h3>' + esc(p.n) + '</h3>' +
            hintBadge +
          '</div>' +
          '<p>' + esc(p.c) + (p.sku ? ' &middot; ' + esc(p.sku) : '') + '</p>' +
          '<div class="np-card-actions">' +
            '<a class="np-btn-enquire" href="contact.html?product=' + encodeURIComponent(p.b + ' ' + p.n) + '#enquiry-section">Enquire</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderGrid() {
    var groups = {};
    var shown = 0;
    DATA.forEach(function (p, i) {
      if (!matches(p)) return;
      (groups[p.c] = groups[p.c] || []).push(i);
      shown++;
    });
    var html = '';
    CATEGORY_ORDER.forEach(function (c) {
      var list = groups[c];
      if (!list) return;
      html += '<section class="np-cat-section" id="cat-' + catSlug(c) + '">' +
        '<div class="np-cat-head"><h2>' + esc(c) + '</h2><span>' + list.length + ' model' + (list.length > 1 ? 's' : '') + '</span></div>' +
        '<div class="np-grid">' + list.map(function (i) { return card(DATA[i], i); }).join('') + '</div>' +
        '</section>';
    });
    if (!shown) {
      html = '<div class="np-empty"><h3>No products match your search.</h3>' +
        '<button type="button" class="np-chip active" id="npResetAll">Show all products</button></div>';
    }
    var catEl = $('npCatalogue');
    if (catEl) catEl.innerHTML = html;
    var bits = [];
    if (state.cats.length === 1) bits.push(esc(state.cats[0]));
    else if (state.cats.length > 1) bits.push(state.cats.length + ' collections');
    if (state.brand !== 'all') bits.push(esc(state.brand.toUpperCase()));
    if (state.query) bits.push('&ldquo;' + esc(state.query) + '&rdquo;');
    var filtered = bits.length > 0;
    var resEl = $('npResultCount');
    if (resEl) {
      resEl.innerHTML = 'Showing <strong>' + shown + '</strong> product' + (shown === 1 ? '' : 's') +
        (filtered ? ' <span class="np-rc-tags">&middot; ' + bits.join(' &middot; ') + '</span>' +
          ' <button type="button" class="np-rc-clear" data-clear>Clear all</button>' : '');
    }
    var apply = $('npFilterApply');
    if (apply) apply.textContent = 'Show ' + shown + ' product' + (shown === 1 ? '' : 's');
  }

  function renderAll() {
    renderBrandTabs();
    renderCategoryChips();
    renderGrid();
  }

  /* ---------- Quick view modal with 360° Interactive Product Viewer ---------- */
  var modalProductIndex = -1;
  var modalProduct = null;
  var currentImageIndex = 0;
  var modalAngle = 0;
  var modalSpinRaf = null;
  var isModalDragging = false;
  var lastDragX = 0;
  var lastDragTime = 0;
  var dragVelocity = 0;
  var momentumRaf = null;
  var presetAnimRaf = null;
  var preloadedFrames = [];

  var modalViewMode = 'spin'; // 'video' | 'spin' | 'colors'

  function setModalAngle(deg, updateSlider) {
    modalAngle = ((deg % 360) + 360) % 360;

    var isMulti = isMultiAngleProduct(modalProductIndex);

    // 1. Frame synchronization for multi-angle sequences
    if (modalViewMode === 'video') {
      var videoEl = $('npModalVideo360');
      if (videoEl && videoEl.duration && !isModalDragging) {
        // Only seek if difference is noticeable to avoid choppy playback
        var targetTime = (modalAngle / 360) * videoEl.duration;
        if (Math.abs(videoEl.currentTime - targetTime) > 0.15) {
          videoEl.currentTime = targetTime;
        }
      }
    } else if (isMulti && modalProduct) {
      var activeFrames = (modalViewMode === 'spin' && modalProduct.frames360 && modalProduct.frames360.length) ? modalProduct.frames360 : modalProduct.img;
      if (activeFrames && activeFrames.length > 1) {
        var numFrames = activeFrames.length;
        var frameSpan = 360 / numFrames;
        var offsetAngle = (modalAngle + frameSpan / 2) % 360;
        var frameIdx = Math.floor(offsetAngle / frameSpan) % numFrames;

        if (frameIdx !== currentImageIndex) {
          showModalImage(frameIdx);
        }
      }
    }

    // 2. Turntable ring and contact shadow anchoring
    var ring = $('np360TurntableRing');
    if (ring) {
      ring.style.transform = 'rotateX(72deg)';
    }

    var shadow = $('np360ContactShadow');
    if (shadow) {
      shadow.style.transform = 'rotateX(72deg) translateY(2px)';
    }

    var imgEl = $('npModalImg');
    if (imgEl) {
      imgEl.style.filter = 'drop-shadow(0 14px 18px rgba(15, 23, 42, 0.16))';
    }

    // 3. Update UI Slider & Step Indicator
    var slider = $('np360Slider');
    if (slider && updateSlider !== false) {
      slider.value = Math.round(modalAngle);
    }
    var stepEl = $('np360Step');
    if (stepEl) {
      if (modalViewMode === 'video') {
        stepEl.textContent = Math.round(modalAngle) + '° (Video)';
      } else if (isMulti && modalProduct) {
        var framesList = (modalViewMode === 'spin' && modalProduct.frames360) ? modalProduct.frames360 : modalProduct.img;
        stepEl.textContent = Math.round(modalAngle) + '° (' + (currentImageIndex + 1) + '/' + (framesList ? framesList.length : 1) + ')';
      } else {
        stepEl.textContent = '0° (1/1)';
      }
    }

    // 4. Update active preset button
    var presets = $('np360Presets');
    if (presets) {
      var rounded = (Math.round(modalAngle / 90) * 90) % 360;
      Array.prototype.forEach.call(presets.querySelectorAll('.np-360-preset-btn'), function (btn) {
        var bDeg = +btn.getAttribute('data-deg');
        btn.classList.toggle('active', Math.abs(bDeg - rounded) < 25);
      });
    }
  }

  function animateToAngle(targetDeg) {
    stopAutoSpin();
    if (momentumRaf) cancelAnimationFrame(momentumRaf);
    if (presetAnimRaf) cancelAnimationFrame(presetAnimRaf);

    var startAngle = modalAngle;
    var target = ((targetDeg % 360) + 360) % 360;
    var diff = target - startAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (modalViewMode === 'video') {
      var videoEl = $('npModalVideo360');
      if (videoEl && videoEl.duration) {
        videoEl.currentTime = (target / 360) * videoEl.duration;
      }
      setModalAngle(target);
      return;
    }

    var startTime = performance.now();
    var duration = 380;

    function step(now) {
      var elapsed = now - startTime;
      var progress = Math.min(1, elapsed / duration);
      var ease = 1 - Math.pow(1 - progress, 3);
      setModalAngle(startAngle + diff * ease);
      if (progress < 1) {
        presetAnimRaf = requestAnimationFrame(step);
      } else {
        presetAnimRaf = null;
      }
    }
    presetAnimRaf = requestAnimationFrame(step);
  }

  function stopAutoSpin() {
    if (modalSpinRaf) {
      cancelAnimationFrame(modalSpinRaf);
      modalSpinRaf = null;
    }
    if (momentumRaf) {
      cancelAnimationFrame(momentumRaf);
      momentumRaf = null;
    }
    if (presetAnimRaf) {
      cancelAnimationFrame(presetAnimRaf);
      presetAnimRaf = null;
    }
    var spinBtn = $('np360AutoSpinBtn');
    if (spinBtn) {
      spinBtn.classList.remove('spinning');
      spinBtn.innerHTML = '<i class="fas fa-play"></i> <span>' + (modalViewMode === 'video' ? 'Play Video' : 'Auto-Spin') + '</span>';
    }
  }

  function toggleAutoSpin() {
    if (modalViewMode === 'video') {
      var videoEl = $('npModalVideo360');
      var spinBtn = $('np360AutoSpinBtn');
      if (videoEl) {
        if (videoEl.paused) {
          videoEl.play().catch(function () {});
          if (spinBtn) {
            spinBtn.classList.add('spinning');
            spinBtn.innerHTML = '<i class="fas fa-pause"></i> <span>Pause Video</span>';
          }
        } else {
          videoEl.pause();
          if (spinBtn) {
            spinBtn.classList.remove('spinning');
            spinBtn.innerHTML = '<i class="fas fa-play"></i> <span>Play Video</span>';
          }
        }
      }
      return;
    }

    if (!isMultiAngleProduct(modalProductIndex)) return;
    var activeList = (modalProduct && modalProduct.frames360) ? modalProduct.frames360 : (modalProduct ? modalProduct.img : null);
    if (!activeList || activeList.length <= 1) return;

    if (modalSpinRaf) {
      stopAutoSpin();
    } else {
      if (momentumRaf) cancelAnimationFrame(momentumRaf);
      if (presetAnimRaf) cancelAnimationFrame(presetAnimRaf);

      var spinBtn = $('np360AutoSpinBtn');
      if (spinBtn) {
        spinBtn.classList.add('spinning');
        spinBtn.innerHTML = '<i class="fas fa-pause"></i> <span>Pause</span>';
      }
      function loop() {
        setModalAngle(modalAngle + 1.2);
        modalSpinRaf = requestAnimationFrame(loop);
      }
      modalSpinRaf = requestAnimationFrame(loop);
    }
  }

  function showModalImage(i) {
    if (!modalProduct) return;
    var activeList = (modalViewMode === 'spin' && modalProduct.frames360 && modalProduct.frames360.length) ? modalProduct.frames360 : modalProduct.img;
    if (!activeList || !activeList.length) return;
    var count = activeList.length;
    currentImageIndex = ((i % count) + count) % count;
    var im = activeList[currentImageIndex];
    var el = $('npModalImg');
    if (el) {
      if (el.getAttribute('src') !== im.f) {
        el.src = im.f;
      }
      el.alt = modalProduct.b + ' ' + modalProduct.n + (im.v ? ' - ' + im.v : '');
    }
    var thumbs = $('npModalThumbs');
    if (thumbs) {
      Array.prototype.forEach.call(thumbs.children, function (b, j) {
        b.classList.toggle('on', j === currentImageIndex);
      });
    }
  }

  function renderThumbsForMode(mode) {
    var thumbs = $('npModalThumbs');
    if (!thumbs || !modalProduct) return;

    if (mode === 'colors' || (!modalProduct.frames360 && !modalProduct.video360)) {
      thumbs.innerHTML = (modalProduct.img || []).map(function (im, i) {
        return '<button type="button" data-i="' + i + '"' + (i === currentImageIndex ? ' class="on"' : '') + ' title="' + (im.v || ('Color ' + (i + 1))) + '"><img src="' + im.f + '" alt=""></button>';
      }).join('');
    } else if (mode === 'spin' && modalProduct.frames360) {
      thumbs.innerHTML = modalProduct.frames360.map(function (im, i) {
        return '<button type="button" data-i="' + i + '"' + (i === currentImageIndex ? ' class="on"' : '') + ' title="Angle ' + (im.deg != null ? im.deg + '°' : (i + 1)) + '"><img src="' + im.f + '" alt=""></button>';
      }).join('');
    } else if (mode === 'video') {
      // Key video angle checkpoints
      var checkpoints = [0, 4, 8, 12];
      var frames = modalProduct.frames360 || modalProduct.img || [];
      thumbs.innerHTML = checkpoints.filter(function (idx) { return idx < frames.length; }).map(function (idx) {
        var im = frames[idx];
        var deg = (idx / frames.length) * 360;
        return '<button type="button" data-deg="' + Math.round(deg) + '" title="Seek to ' + Math.round(deg) + '°"><img src="' + im.f + '" alt=""><span style="font-size:10px;font-weight:700;display:block;margin-top:2px;">' + Math.round(deg) + '&deg;</span></button>';
      }).join('');
    }
  }

  function switchModalView(mode) {
    if (!modalProduct) return;
    modalViewMode = 'colors';
    var videoEl = $('npModalVideo360');
    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = 'none';
    }
    var imgEl = $('npModalImg');
    if (imgEl) imgEl.style.display = 'block';
    stopAutoSpin();
    renderThumbsForMode('colors');
    showModalImage(0);
  }
  window.switchModalView = switchModalView;

  function openModal(idx) {
    var p = DATA[idx];
    if (!p) return;

    modalProductIndex = idx;
    modalProduct = p;
    currentImageIndex = 0;
    modalAngle = 0;

    stopAutoSpin();
    if (momentumRaf) { cancelAnimationFrame(momentumRaf); momentumRaf = null; }
    if (presetAnimRaf) { cancelAnimationFrame(presetAnimRaf); presetAnimRaf = null; }

    // Meta details
    var brandEl = $('npModalBrand');
    if (brandEl) {
      brandEl.textContent = p.b;
      brandEl.className = 'np-card-brand np-badge-' + p.b.toLowerCase();
    }
    var titleEl = $('npModalTitle');
    if (titleEl) titleEl.textContent = p.n;
    var metaEl = $('npModalMeta');
    if (metaEl) metaEl.textContent = p.c + (p.sku ? ' · ' + p.sku : '');

    var viewsEl = $('npModalViews');
    if (viewsEl) {
      if (p.img && p.img.length > 1) {
        viewsEl.textContent = p.img.length + ' studio colorways available';
      } else {
        viewsEl.textContent = 'High-resolution studio photograph';
      }
    }

    var enqEl = $('npModalEnquire');
    if (enqEl) {
      enqEl.href = 'contact.html?product=' + encodeURIComponent(p.b + ' ' + p.n) + '#enquiry-section';
    }

    // Hide any 360 elements
    var tabs = $('npModalViewTabs');
    if (tabs) tabs.style.display = 'none';
    var notice = $('npSingleNotice');
    if (notice) notice.style.display = 'none';
    var controls = $('np360Controls');
    if (controls) controls.style.display = 'none';
    var badge = $('np360Badge');
    if (badge) badge.style.display = 'none';
    var overlay = $('np360Overlay');
    if (overlay) overlay.style.display = 'none';
    var loader = $('np360Loader');
    if (loader) loader.style.display = 'none';
    var videoEl = $('npModalVideo360');
    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = 'none';
    }

    // Show initial image
    var imgEl = $('npModalImg');
    if (imgEl && p.img && p.img.length) {
      imgEl.style.display = 'block';
      imgEl.src = p.img[0].f;
      imgEl.alt = p.b + ' ' + p.n;
    }

    // Render thumbnails
    var thumbs = $('npModalThumbs');
    if (thumbs) {
      if (p.img && p.img.length > 1) {
        thumbs.style.display = 'flex';
        thumbs.innerHTML = p.img.map(function (im, i) {
          return '<button type="button" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + ' title="' + (im.v || ('Color ' + (i + 1))) + '"><img src="' + im.f + '" alt=""></button>';
        }).join('');
      } else {
        thumbs.style.display = 'none';
        thumbs.innerHTML = '';
      }
    }

    var modal = $('npModal');
    if (modal) {
      modal.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    stopAutoSpin();
    if (momentumRaf) { cancelAnimationFrame(momentumRaf); momentumRaf = null; }
    if (presetAnimRaf) { cancelAnimationFrame(presetAnimRaf); presetAnimRaf = null; }
    var videoEl = $('npModalVideo360');
    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = 'none';
    }
    var modal = $('npModal');
    if (modal) modal.classList.remove('open');
    document.documentElement.style.overflow = '';
  }

  function navigateProduct(direction) {
    if (modalProductIndex < 0) return;
    var visibleIndices = [];
    DATA.forEach(function (p, i) {
      if (matches(p)) visibleIndices.push(i);
    });
    if (!visibleIndices.length) {
      visibleIndices = DATA.map(function (_, i) { return i; });
    }
    var currentPos = visibleIndices.indexOf(modalProductIndex);
    if (currentPos === -1) currentPos = 0;
    var nextPos = (currentPos + direction + visibleIndices.length) % visibleIndices.length;
    openModal(visibleIndices[nextPos]);
  }

  /* Drag & Swipe physics for desktop, mobile and tablet */
  function getDragSensitivity() {
    var stage = $('npModalImgContainer');
    var w = stage ? stage.clientWidth : 380;
    return 360 / Math.max(240, w);
  }

  function onDragStart(clientX) {
    if (!isMultiAngleProduct(modalProductIndex)) return;
    if (!modalProduct || !modalProduct.img || modalProduct.img.length <= 1) return;
    isModalDragging = true;
    lastDragX = clientX;
    lastDragTime = performance.now();
    dragVelocity = 0;
    stopAutoSpin();
    var stage = $('npModalImgContainer');
    if (stage) stage.classList.add('is-dragging');
  }

  function onDragMove(clientX) {
    if (!isModalDragging) return;
    var now = performance.now();
    var dt = Math.max(1, now - lastDragTime);
    var deltaX = clientX - lastDragX;

    var sensitivity = getDragSensitivity();
    var angleDelta = deltaX * sensitivity;
    setModalAngle(modalAngle + angleDelta);

    var instantVel = (angleDelta / dt) * 16.6;
    dragVelocity = dragVelocity * 0.4 + instantVel * 0.6;

    lastDragX = clientX;
    lastDragTime = now;
  }

  function onDragEnd() {
    if (!isModalDragging) return;
    isModalDragging = false;
    var stage = $('npModalImgContainer');
    if (stage) stage.classList.remove('is-dragging');

    var idleTime = performance.now() - lastDragTime;
    if (idleTime > 60) {
      dragVelocity = 0;
    }

    if (Math.abs(dragVelocity) > 0.25) {
      var maxVel = 10;
      var vel = Math.max(-maxVel, Math.min(maxVel, dragVelocity));
      function momentumStep() {
        vel *= 0.92;
        if (Math.abs(vel) > 0.04 && !isModalDragging) {
          setModalAngle(modalAngle + vel);
          momentumRaf = requestAnimationFrame(momentumStep);
        } else {
          momentumRaf = null;
        }
      }
      momentumRaf = requestAnimationFrame(momentumStep);
    }
  }

  /* ---------- Events ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('npCatalogue')) return;

    var params = new URLSearchParams(window.location.search);
    var brand = (params.get('brand') || '').toLowerCase();
    BRANDS.forEach(function (b) { if (b.toLowerCase() === brand) state.brand = b; });
    var cat = (params.get('category') || params.get('cat') || '').toLowerCase();
    if (CATEGORY_GROUPS[cat]) state.cats = CATEGORY_GROUPS[cat].slice();
    else CATEGORY_ORDER.forEach(function (c) {
      if (c.toLowerCase() === cat || catSlug(c) === cat) state.cats = [c];
    });
    var q = params.get('search');
    if (q) { state.query = q.toLowerCase(); var sEl = $('npSearch'); if (sEl) sEl.value = q; }

    renderAll();

    if (params.get('brand') || cat || q) {
      var list = document.getElementById('all-products');
      if (list) setTimeout(function () { list.scrollIntoView(); }, 60);
    }

    var brandTabs = $('npBrandTabs');
    if (brandTabs) {
      brandTabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-brand]');
        if (!b) return;
        state.brand = b.getAttribute('data-brand');
        state.cats = state.cats.filter(function (c) {
          return DATA.some(function (p) { return p.c === c && (state.brand === 'all' || p.b === state.brand); });
        });
        renderAll();
      });
    }

    var catChips = $('npCategoryChips');
    if (catChips) {
      catChips.addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat]');
        if (!c) return;
        var v = c.getAttribute('data-cat');
        state.cats = v ? [v] : [];
        renderCategoryChips();
        renderGrid();
      });
    }

    var searchInput = $('npSearch');
    if (searchInput) {
      var t;
      searchInput.addEventListener('input', function () {
        var v = this.value.trim().toLowerCase();
        clearTimeout(t);
        t = setTimeout(function () { state.query = v; renderCategoryChips(); renderGrid(); }, 120);
      });
    }

    function clearAll() {
      state = { brand: 'all', cats: [], query: '' };
      var sEl = $('npSearch');
      if (sEl) sEl.value = '';
      renderAll();
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) clearAll();
    });

    // Mobile drawer filter
    function setFilterOpen(open) {
      document.documentElement.classList.toggle('np-filter-open', open);
    }
    var fOpen = $('npFilterOpen');
    if (fOpen) fOpen.addEventListener('click', function () { setFilterOpen(true); });
    var fClose = $('npFilterClose');
    if (fClose) fClose.addEventListener('click', function () { setFilterOpen(false); });
    var fBackdrop = $('npFilterBackdrop');
    if (fBackdrop) fBackdrop.addEventListener('click', function () { setFilterOpen(false); });
    var fApply = $('npFilterApply');
    if (fApply) fApply.addEventListener('click', function () {
      setFilterOpen(false);
      var list = document.getElementById('all-products');
      if (list) list.scrollIntoView();
    });

    // Catalogue grid interaction (Thumbnails & 360 View buttons)
    $('npCatalogue').addEventListener('click', function (e) {
      if (e.target.id === 'npResetAll') {
        clearAll();
        return;
      }
      var thumb = e.target.closest('.np-card-thumbs img');
      if (thumb) {
        var cardEl = thumb.closest('.np-card');
        var p = DATA[+cardEl.getAttribute('data-idx')];
        var main = cardEl.querySelector('.np-card-img');
        if (main && p && p.img[+thumb.getAttribute('data-i')]) {
          main.src = p.img[+thumb.getAttribute('data-i')].f;
        }
        cardEl.classList.add('np-card-picked');
        Array.prototype.forEach.call(thumb.parentNode.children, function (x) { x.classList.toggle('on', x === thumb); });
        return;
      }
      var view = e.target.closest('.np-btn-view, .np-card-media, .np-card-img, .np-card-body h3');
      if (view) {
        var cardEl = view.closest('.np-card');
        if (cardEl) openModal(+cardEl.getAttribute('data-idx'));
      }
    });

    // View mode switcher tabs
    var viewTabs = $('npModalViewTabs');
    if (viewTabs) {
      viewTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.np-view-tab-btn');
        if (btn) {
          var mode = btn.getAttribute('data-mode');
          if (mode) switchModalView(mode);
        }
      });
    }

    // Modal 360 Video element listeners
    var videoEl = $('npModalVideo360');
    if (videoEl) {
      videoEl.addEventListener('timeupdate', function () {
        if (modalViewMode === 'video' && videoEl.duration && !isModalDragging) {
          var prog = (videoEl.currentTime / videoEl.duration) * 360;
          modalAngle = prog;
          var slider = $('np360Slider');
          if (slider) slider.value = Math.round(prog);
          var stepEl = $('np360Step');
          if (stepEl) stepEl.textContent = Math.round(prog) + '° (Video)';
          var presets = $('np360Presets');
          if (presets) {
            var rounded = (Math.round(prog / 90) * 90) % 360;
            Array.prototype.forEach.call(presets.querySelectorAll('.np-360-preset-btn'), function (btn) {
              btn.classList.toggle('active', Math.abs(+btn.getAttribute('data-deg') - rounded) < 25);
            });
          }
        }
      });

      videoEl.addEventListener('click', function () {
        toggleAutoSpin();
      });
    }

    // Modal thumbnail clicks
    var thumbsEl = $('npModalThumbs');
    if (thumbsEl) {
      thumbsEl.addEventListener('click', function (e) {
        var degBtn = e.target.closest('[data-deg]');
        if (degBtn) {
          var targetDeg = +degBtn.getAttribute('data-deg');
          if (modalViewMode === 'video') {
            var vEl = $('npModalVideo360');
            if (vEl && vEl.duration) {
              vEl.currentTime = (targetDeg / 360) * vEl.duration;
            }
          }
          setModalAngle(targetDeg);
          return;
        }

        var b = e.target.closest('[data-i]');
        if (b && modalProduct) {
          stopAutoSpin();
          var idx = +b.getAttribute('data-i');
          if (modalViewMode === 'spin' && modalProduct.frames360) {
            var num = modalProduct.frames360.length;
            var targetAngle = (idx / num) * 360;
            setModalAngle(targetAngle);
          } else {
            showModalImage(idx);
          }
        }
      });
    }

    // Modal 360 controls
    var prevBtn = $('np360PrevBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        stopAutoSpin();
        var targetAngle = modalAngle - 45;
        if (modalViewMode === 'video') {
          var vEl = $('npModalVideo360');
          if (vEl && vEl.duration) {
            vEl.currentTime = (((targetAngle % 360) + 360) % 360 / 360) * vEl.duration;
          }
        }
        setModalAngle(targetAngle);
      });
    }

    var nextBtn = $('np360NextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stopAutoSpin();
        var targetAngle = modalAngle + 45;
        if (modalViewMode === 'video') {
          var vEl = $('npModalVideo360');
          if (vEl && vEl.duration) {
            vEl.currentTime = (((targetAngle % 360) + 360) % 360 / 360) * vEl.duration;
          }
        }
        setModalAngle(targetAngle);
      });
    }

    var autoSpinBtn = $('np360AutoSpinBtn');
    if (autoSpinBtn) {
      autoSpinBtn.addEventListener('click', function () {
        toggleAutoSpin();
      });
    }

    var slider = $('np360Slider');
    if (slider) {
      slider.addEventListener('input', function () {
        stopAutoSpin();
        var val = +this.value;
        if (modalViewMode === 'video') {
          var vEl = $('npModalVideo360');
          if (vEl && vEl.duration) {
            vEl.currentTime = (val / 360) * vEl.duration;
          }
        }
        setModalAngle(val, false);
      });
    }

    var presets = $('np360Presets');
    if (presets) {
      presets.addEventListener('click', function (e) {
        var btn = e.target.closest('.np-360-preset-btn');
        if (btn) {
          animateToAngle(+btn.getAttribute('data-deg'));
        }
      });
    }

    // Product navigation inside modal
    var prevProdBtn = $('npModalPrevProduct');
    if (prevProdBtn) {
      prevProdBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        navigateProduct(-1);
      });
    }
    var nextProdBtn = $('npModalNextProduct');
    if (nextProdBtn) {
      nextProdBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        navigateProduct(1);
      });
    }

    // Modal 360 drag & touch listeners
    var imgStage = $('npModalImgContainer');
    if (imgStage) {
      imgStage.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        onDragStart(e.clientX);
      });

      imgStage.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          onDragStart(e.touches[0].clientX);
        }
      }, { passive: true });

      imgStage.addEventListener('touchmove', function (e) {
        if (!isModalDragging) return;
        if (e.touches.length === 1) {
          if (e.cancelable) e.preventDefault();
          onDragMove(e.touches[0].clientX);
        }
      }, { passive: false });
    }

    window.addEventListener('mousemove', function (e) {
      if (isModalDragging) {
        onDragMove(e.clientX);
      }
    });

    window.addEventListener('mouseup', function () {
      if (isModalDragging) {
        onDragEnd();
      }
    });

    window.addEventListener('touchend', function () {
      if (isModalDragging) {
        onDragEnd();
      }
    });

    window.addEventListener('touchcancel', function () {
      if (isModalDragging) {
        onDragEnd();
      }
    });

    // Close modal handlers
    var modalEl = $('npModal');
    if (modalEl) {
      modalEl.addEventListener('click', function (e) {
        if (e.target === this || e.target.closest('.np-modal-x')) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      var modal = $('npModal');
      if (!modal || !modal.classList.contains('open')) {
        if (e.key === 'Escape') setFilterOpen(false);
        return;
      }

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        if (e.altKey || e.shiftKey) {
          navigateProduct(-1);
        } else if (isMultiAngleProduct(modalProductIndex) && modalProduct && modalProduct.img && modalProduct.img.length > 1) {
          stopAutoSpin();
          setModalAngle(modalAngle - 45);
        }
      } else if (e.key === 'ArrowRight') {
        if (e.altKey || e.shiftKey) {
          navigateProduct(1);
        } else if (isMultiAngleProduct(modalProductIndex) && modalProduct && modalProduct.img && modalProduct.img.length > 1) {
          stopAutoSpin();
          setModalAngle(modalAngle + 45);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        if (isMultiAngleProduct(modalProductIndex) && modalProduct && modalProduct.img && modalProduct.img.length > 1) {
          e.preventDefault();
          toggleAutoSpin();
        }
      }
    });
  });
})();


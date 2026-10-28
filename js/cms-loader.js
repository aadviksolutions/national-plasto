/**
 * National Plasto - Complete CMS Content Loader & Dynamic Hydration Engine
 * Connects all public pages to customized content & images managed via the Admin Panel CMS.
 */
(function () {
  'use strict';

  var DB_NAME = 'np_cms_db';
  var DB_VERSION = 1;
  var STORE_NAME = 'cms_store';

  function getIdbData(key) {
    if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
    return new Promise(function (resolve) {
      try {
        var req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = function (e) {
          var db = e.target.result;
          try {
            var tx = db.transaction(STORE_NAME, 'readonly');
            var store = tx.objectStore(STORE_NAME);
            var getReq = store.get(key);
            getReq.onsuccess = function () { resolve(getReq.result || null); };
            getReq.onerror = function () { resolve(null); };
          } catch (_) { resolve(null); }
        };
        req.onerror = function () { resolve(null); };
      } catch (_) { resolve(null); }
    });
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  function fetchCMSData() {
    return getIdbData('np_custom_cms').then(function (idbCMS) {
      var customCMS = (idbCMS && typeof idbCMS === 'object' && Object.keys(idbCMS).length > 0) ? idbCMS : null;
      if (!customCMS) {
        try {
          var local = localStorage.getItem('np_custom_cms');
          if (local) {
            var parsed = JSON.parse(local);
            if (parsed && typeof parsed === 'object') customCMS = parsed;
          }
        } catch (_) {}
      }

      // Fetch base content to merge custom overrides on top
      return fetch('/api/cms?t=' + Date.now())
        .then(function (res) {
          var ct = res.headers.get('content-type') || '';
          if (!res.ok || !ct.includes('application/json')) throw new Error('API not available');
          return res.json();
        })
        .then(function (res) {
          var base = res.data || res;
          return customCMS ? deepMerge(base, customCMS) : base;
        })
        .catch(function () {
          return fetch('data/cms-content.json?t=' + Date.now())
            .then(function (res) { return res.json(); })
            .then(function (base) {
              return customCMS ? deepMerge(base, customCMS) : base;
            })
            .catch(function (err) {
              console.warn('[CMS Loader] Base JSON fetch failed, using customCMS directly:', err);
              return customCMS;
            });
        });
    });
  }

  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : undefined;
    }, obj);
  }

  /**
   * Safe image setter: updates src and synchronizes data-lazy-src & data-src
   * so supreme_app.min.js lazy-loader never overwrites new CMS images on scroll/load.
   */
  function setSafeImage(img, url) {
    if (!img || !url) return;
    img.src = url;
    try {
      img.setAttribute('data-lazy-src', url);
      img.setAttribute('data-src', url);
      if (window.jQuery) {
        window.jQuery(img).attr('data-lazy-src', url).attr('src', url);
      }
    } catch (_) {}
  }

  function applyCMS(data) {
    if (!data) return;

    // 1. Explicit data-cms attribute hydration
    var explicitEls = document.querySelectorAll('[data-cms]');
    explicitEls.forEach(function (el) {
      var keyPath = el.getAttribute('data-cms');
      var val = getNested(data, keyPath);
      if (val !== undefined && val !== null) {
        if (el.tagName === 'IMG') {
          setSafeImage(el, val);
        } else if (el.tagName === 'A' && el.getAttribute('data-cms-attr') === 'href') {
          el.href = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // 2. Global Footers & Headers (Email, Phone, Address, Socials)
    hydrateGlobalElements(data);

    // 3. Page-Specific Section Hydrations
    var path = window.location.pathname.toLowerCase();
    var isHome = path.endsWith('index.html') || path.endsWith('/') || document.body.id === 'index_page';
    var isAbout = path.includes('about') || document.body.id === 'about_us_overview';
    var isProducts = path.includes('products');
    var isMfg = path.includes('manufacturing');
    var isDist = path.includes('distributor');
    var isContact = path.includes('contact');
    var isPolicies = path.includes('policies');

    if (isHome && data.home) hydrateHome(data.home);
    if (isAbout && data.about) hydrateAbout(data.about);
    if (isProducts && data.products) hydrateProducts(data.products);
    if (isMfg && data.manufacturing) hydrateManufacturing(data.manufacturing);
    if (isDist && data.distributor) hydrateDistributor(data.distributor);
    if (isContact && (data.contact || data.general)) hydrateContact(data.contact, data.general);
    if (isPolicies && data.policies) hydratePolicies(data.policies);
  }

  // --- Global Elements Hydration ---
  function hydrateGlobalElements(data) {
    var gen = data.general;
    if (!gen) return;

    function phoneHref(value) {
      return 'tel:' + String(value).replace(/\s+/g, '');
    }

    function whatsappNumber(value) {
      return String(value).replace(/[^0-9]/g, '');
    }

    // Contact Email
    if (gen.contactEmail) {
      document.querySelectorAll('a[href^="mailto:"]:not(.contact-email-secondary)').forEach(function (a) {
        a.href = 'mailto:' + gen.contactEmail;
        if (a.textContent.includes('@')) a.textContent = gen.contactEmail;
      });
    }

    // Phone
    if (gen.contactPhone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.href = phoneHref(gen.contactPhone);
        if (/\+?\d{5,}/.test(a.textContent)) a.textContent = gen.contactPhone;
      });
    }

    // WhatsApp links use their own admin-controlled helpline value.
    if (gen.whatsapp) {
      var waNumber = whatsappNumber(gen.whatsapp);
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
        var currentUrl = a.getAttribute('href') || '';
        var query = currentUrl.indexOf('?');
        var suffix = query === -1 ? '' : currentUrl.slice(query);
        a.href = 'https://wa.me/' + waNumber + suffix;
        if (/WhatsApp/i.test(a.textContent) && /\+?\d{5,}/.test(a.textContent)) {
          a.textContent = a.textContent.replace(/\+?\d[\d\s-]{4,}/, gen.whatsapp);
        }
      });
    }

    // Social Links
    if (gen.socialLinks) {
      var fb = document.querySelectorAll('a[href*="facebook.com"]');
      if (gen.socialLinks.facebook) fb.forEach(function (a) { a.href = gen.socialLinks.facebook; });

      var li = document.querySelectorAll('a[href*="linkedin.com"]');
      if (gen.socialLinks.linkedin) li.forEach(function (a) { a.href = gen.socialLinks.linkedin; });

      var ig = document.querySelectorAll('a[href*="instagram.com"]');
      if (gen.socialLinks.instagram) ig.forEach(function (a) { a.href = gen.socialLinks.instagram; });

      var amz = document.querySelectorAll('a[href*="amazon.in"]');
      if (gen.socialLinks.amazon) amz.forEach(function (a) { a.href = gen.socialLinks.amazon; });
    }
  }

  // --- A. Home Page Hydration ---
  function hydrateHome(home) {
    // 1. Hero
    if (home.hero) {
      var eyebrow = document.querySelector('.np-hero-content-fixed .np-hero-eyebrow');
      if (eyebrow && home.hero.eyebrow) eyebrow.textContent = home.hero.eyebrow;

      var rotator = document.getElementById('npHeroTitleRotator');
      if (rotator) {
        var t0 = rotator.querySelector('.np-rotating-title[data-index="0"]');
        var t1 = rotator.querySelector('.np-rotating-title[data-index="1"]');
        var t2 = rotator.querySelector('.np-rotating-title[data-index="2"]');
        if (t0 && home.hero.title1) t0.innerHTML = home.hero.title1.replace(/\\n/g, '<br>');
        if (t1 && home.hero.title2) t1.innerHTML = home.hero.title2.replace(/\\n/g, '<br>');
        if (t2 && home.hero.title3) t2.innerHTML = home.hero.title3.replace(/\\n/g, '<br>');
      }

      var cta = document.querySelector('.np-hero-content-fixed .np-hero-cta');
      if (cta) {
        if (home.hero.ctaText) cta.innerHTML = home.hero.ctaText + ' <span aria-hidden="true">&rarr;</span>';
        if (home.hero.ctaLink) cta.href = home.hero.ctaLink;
      }

      var heroVideo = document.querySelector('.np-hero-video');
      if (heroVideo) {
        if (home.hero.videoPoster) heroVideo.setAttribute('poster', home.hero.videoPoster);
        var src = heroVideo.querySelector('source');
        if (src && home.hero.videoUrl && src.src !== home.hero.videoUrl) {
          src.src = home.hero.videoUrl;
          heroVideo.load();
        }
      }
      var heroPosterImg = document.querySelector('.np-hero-poster-img');
      if (heroPosterImg && home.hero.videoPoster) setSafeImage(heroPosterImg, home.hero.videoPoster);
    }

    // 2. Virtues (6 items)
    if (home.virtues && home.virtues.length) {
      var virtueBoxes = document.querySelectorAll('.virtues_flex .item_box');
      virtueBoxes.forEach(function (box, idx) {
        if (home.virtues[idx]) {
          var h4 = box.querySelector('.subheading-text');
          var p = box.querySelector('.para-text');
          if (h4 && home.virtues[idx].title) h4.textContent = home.virtues[idx].title;
          if (p && home.virtues[idx].desc) p.textContent = home.virtues[idx].desc;
        }
      });
    }

    // 3. CMD Message
    if (home.cmdTestimonial) {
      var cmdQuote = document.querySelector('.np-cmd-quote span:last-child');
      if (cmdQuote && home.cmdTestimonial.quote) {
        cmdQuote.innerHTML = home.cmdTestimonial.quote + '<img class="quate_two" src="images/quate_two.jpg" alt="icon">';
      }
      var cmdName = document.querySelector('.testmonial_name h3');
      if (cmdName && home.cmdTestimonial.name) cmdName.textContent = home.cmdTestimonial.name;

      var cmdRole = document.querySelector('.testmonial_name p');
      if (cmdRole && home.cmdTestimonial.role) cmdRole.textContent = home.cmdTestimonial.role;

      var cmdImg = document.querySelector('.np-cmd-cutout');
      if (cmdImg && home.cmdTestimonial.photo) setSafeImage(cmdImg, home.cmdTestimonial.photo);

      var cmdBtn = document.querySelector('.np-cmd-btn');
      if (cmdBtn) {
        if (home.cmdTestimonial.btnText) cmdBtn.textContent = home.cmdTestimonial.btnText;
        if (home.cmdTestimonial.btnLink) cmdBtn.href = home.cmdTestimonial.btnLink;
      }
    }

    // 4. Metrics / Largest Plastic
    if (home.metricsSection) {
      var mHeading = document.querySelector('.largest_plastic_content h2');
      if (mHeading && home.metricsSection.heading) mHeading.innerHTML = '<span class="color_red_home">' + home.metricsSection.heading + '</span>';
      var mDesc = document.querySelector('.largest_plastic_content .para-text');
      if (mDesc && home.metricsSection.desc) mDesc.textContent = home.metricsSection.desc;
    }

    // 5. Plant Highlights Slider (With Slick Clone & Lazy-Load Synchronization)
    if (home.plantHighlights && home.plantHighlights.length) {
      home.plantHighlights.forEach(function (ph, idx) {
        if (!ph) return;

        // A. Target by explicit data attributes (matches BOTH original and Slick-cloned items)
        var explicitImgs = document.querySelectorAll('[data-cms-plant-img="' + idx + '"]');
        if (explicitImgs.length > 0) {
          explicitImgs.forEach(function (img) {
            if (ph.image) setSafeImage(img, ph.image);
            if (ph.title) img.alt = ph.title;
          });
        }

        var explicitBtns = document.querySelectorAll('[data-cms-plant-btn="' + idx + '"]');
        if (explicitBtns.length > 0) {
          explicitBtns.forEach(function (btn) {
            if (ph.title) btn.textContent = ph.title;
            if (ph.link) btn.href = ph.link;
          });
        }

        // B. Target real slides excluding slick clones to ensure non-cloned items are updated
        var realItems = document.querySelectorAll('.plant_slider .plant_item:not(.slick-cloned)');
        if (realItems[idx]) {
          var rImg = realItems[idx].querySelector('img');
          var rBtn = realItems[idx].querySelector('.plant_btn');
          if (rImg && ph.image) setSafeImage(rImg, ph.image);
          if (rBtn && ph.title) rBtn.textContent = ph.title;
          if (rBtn && ph.link) rBtn.href = ph.link;
        }

        // C. Target any slick cloned slides containing this index
        var clonedImgs = document.querySelectorAll('.plant_slider .slick-cloned [data-cms-plant-img="' + idx + '"]');
        clonedImgs.forEach(function (cImg) {
          if (ph.image) setSafeImage(cImg, ph.image);
        });
        var clonedBtns = document.querySelectorAll('.plant_slider .slick-cloned [data-cms-plant-btn="' + idx + '"]');
        clonedBtns.forEach(function (cBtn) {
          if (ph.title) cBtn.textContent = ph.title;
          if (ph.link) cBtn.href = ph.link;
        });
      });

      // D. Refresh Slick carousel positions if initialized
      if (window.jQuery && window.jQuery('#plant_slider').hasClass('slick-initialized')) {
        try {
          window.jQuery('#plant_slider').slick('setPosition');
        } catch (_) {}
      }
    }

    // 6. Our Brands
    if (home.brandsSection && home.brandsSection.brands) {
      var brandTitles = document.querySelectorAll('.our_business_title_slider .slider_title_item h4.subheading-text');
      var brandImgs = document.querySelectorAll('.our_business_img_slider .our_business_img_item img');
      home.brandsSection.brands.forEach(function (b, idx) {
        if (brandTitles[idx] && b.name) {
          brandTitles[idx].innerHTML = b.name + ' <img src="images/icons/arrow-right.svg" class="slider_arrow" alt="icon">';
        }
        if (brandImgs[idx] && b.image) {
          setSafeImage(brandImgs[idx], b.image);
        }
      });
    }

    // 7. Milestones (Dynamic Timeline with Editable Headings)
    if (home.milestones && Array.isArray(home.milestones)) {
      var msSlider = document.getElementById('milestones_slider');
      if (msSlider) {
        var msSlides = msSlider.querySelectorAll('.milestones_flex:not(.slick-cloned)');

        function formatMilestoneHeading(yearStr) {
          if (!yearStr) return '';
          if (yearStr.indexOf(':') !== -1) {
            var parts = yearStr.split(':');
            var yr = parts[0].trim();
            var title = parts.slice(1).join(':').trim();
            return '<span class="color_red_home fonthigh">' + yr + '</span><span class="color_red_home np-ms-title-inline">: ' + title + '</span>';
          }
          return '<span class="color_red_home fonthigh">' + yearStr + '</span>';
        }

        function createMilestoneSlideHtml(ms, idx) {
          var yearHtml = formatMilestoneHeading(ms.year || ('Milestone ' + (idx + 1)));
          var parts = (ms.date || '').split('·');
          var badgeHtml = '';
          if (parts.length >= 2) {
            badgeHtml = '<span class="np-ms-pin"><i class="fas fa-' + (idx === 0 ? 'landmark' : 'map-marker-alt') + '"></i> ' + parts[0].trim() + '</span> &bull; <strong>' + parts.slice(1).join('·').trim() + '</strong>';
          } else {
            badgeHtml = '<strong>' + (ms.date || '') + '</strong>';
          }
          var imgUrl = ms.image || 'images/brand/company-photo.jpg';
          var descText = ms.desc || '';
          return '<div class="milestones_flex">' +
            '<div class="dassed_border"></div>' +
            '<div class="milestones_img">' +
              '<img src="' + imgUrl + '" loading="lazy" class="img-responsive np-ms-img-vibrant" alt="' + (ms.year || '') + '" decoding="async">' +
            '</div>' +
            '<div class="milestones_content">' +
              '<h2 class="heading-text">' + yearHtml + '</h2>' +
              '<p class="np-ms-badge">' + badgeHtml + '</p>' +
              '<p class="para-text color_para">' + descText + '</p>' +
            '</div>' +
          '</div>';
        }

        home.milestones.forEach(function (ms, idx) {
          if (msSlides[idx]) {
            var img = msSlides[idx].querySelector('.milestones_img img');
            if (img && ms.image) setSafeImage(img, ms.image);
            var desc = msSlides[idx].querySelector('.milestones_content .para-text');
            if (desc && ms.desc) desc.textContent = ms.desc;
            var heading = msSlides[idx].querySelector('.milestones_content h2');
            if (heading && ms.year) {
              heading.innerHTML = formatMilestoneHeading(ms.year);
            }
            var badge = msSlides[idx].querySelector('.milestones_content .np-ms-badge');
            if (badge && ms.date) {
              var parts = ms.date.split('·');
              if (parts.length >= 2) {
                badge.innerHTML = '<span class="np-ms-pin"><i class="fas fa-' + (idx === 0 ? 'landmark' : 'map-marker-alt') + '"></i> ' + parts[0].trim() + '</span> &bull; <strong>' + parts.slice(1).join('·').trim() + '</strong>';
              } else {
                badge.innerHTML = '<strong>' + ms.date + '</strong>';
              }
            }
          } else {
            // New slide added via CMS!
            var slideHtml = createMilestoneSlideHtml(ms, idx);
            if (window.jQuery && window.jQuery(msSlider).hasClass('slick-initialized')) {
              window.jQuery(msSlider).slick('slickAdd', slideHtml);
            } else {
              msSlider.insertAdjacentHTML('beforeend', slideHtml);
            }
          }
        });

        // If slides were removed in CMS:
        if (msSlides.length > home.milestones.length) {
          for (var r = msSlides.length - 1; r >= home.milestones.length; r--) {
            if (window.jQuery && window.jQuery(msSlider).hasClass('slick-initialized')) {
              window.jQuery(msSlider).slick('slickRemove', r);
            } else if (msSlides[r]) {
              msSlides[r].remove();
            }
          }
        }
      }
    }

    // 8. Sustainability
    if (home.sustainability) {
      var sustTitle = document.querySelector('.np-sust-top h2');
      if (sustTitle && home.sustainability.title) sustTitle.innerHTML = '<span class="color_red_home">' + home.sustainability.title.substring(0, 7) + '</span>' + home.sustainability.title.substring(7);

      var sustP = document.querySelectorAll('.np-sust-text p');
      if (sustP[0] && home.sustainability.p1) sustP[0].textContent = home.sustainability.p1;
      if (sustP[1] && home.sustainability.p2) sustP[1].textContent = home.sustainability.p2;

      var sustBtn = document.querySelector('.np-sust-btn');
      if (sustBtn) {
        if (home.sustainability.btnText) sustBtn.textContent = home.sustainability.btnText;
        if (home.sustainability.btnLink) sustBtn.href = home.sustainability.btnLink;
      }
    }

    // 9. Touching Lives
    if (home.touchingLives) {
      var touchHeading = document.querySelector('.touching_content h2');
      if (touchHeading && home.touchingLives.title) touchHeading.innerHTML = home.touchingLives.title.replace(/\\n/g, '<br>');

      var touchDesc = document.querySelector('.touching_content .para-text');
      if (touchDesc && home.touchingLives.desc) touchDesc.textContent = home.touchingLives.desc;

      var touchImg = document.querySelector('.touching_img img');
      if (touchImg && home.touchingLives.image) setSafeImage(touchImg, home.touchingLives.image);

      var touchBtn = document.querySelector('.touching_content .btn_project_default');
      if (touchBtn) {
        if (home.touchingLives.btnText) touchBtn.textContent = home.touchingLives.btnText;
        if (home.touchingLives.btnLink) touchBtn.href = home.touchingLives.btnLink;
      }
    }

    // 10. Innovative Products
    if (home.innovativeProducts) {
      var innoHeading = document.querySelector('.innovative_content_desc h2');
      if (innoHeading && home.innovativeProducts.title) innoHeading.innerHTML = '<span class="color_red_home">' + home.innovativeProducts.title + '</span>';

      var innoDesc = document.querySelector('.innovative_content_desc .para-text');
      if (innoDesc && home.innovativeProducts.desc) innoDesc.innerHTML = home.innovativeProducts.desc;

      var innoImg = document.querySelector('.innovative_img');
      if (innoImg && home.innovativeProducts.image) setSafeImage(innoImg, home.innovativeProducts.image);

      var innoBtn = document.querySelector('.innovative_content_desc .btn_project_default');
      if (innoBtn) {
        if (home.innovativeProducts.btnText) innoBtn.textContent = home.innovativeProducts.btnText;
        if (home.innovativeProducts.btnLink) innoBtn.href = home.innovativeProducts.btnLink;
      }
    }
  }

  // --- B. About Us Hydration ---
  function hydrateAbout(about) {
    // 1. Hero
    if (about.hero && about.hero.bannerImage) {
      var bannerDiv = document.querySelector('.banner-slider-img1');
      if (bannerDiv) bannerDiv.style.backgroundImage = 'url("' + about.hero.bannerImage + '")';
      var mobImg = document.querySelector('.mob-banner-img');
      if (mobImg) setSafeImage(mobImg, about.hero.bannerImage);
    }

    // 2. Overview / Heritage
    if (about.overview) {
      var titleH2 = document.querySelector('.foundation_title h2');
      if (titleH2 && about.overview.title) titleH2.innerHTML = '<span class="color_red_home">' + about.overview.title + '</span>';

      var titleH3 = document.querySelector('.foundation_title h3');
      if (titleH3 && about.overview.leadText) titleH3.textContent = about.overview.leadText;

      var descP = document.querySelector('.foundation_title .para_new_font');
      if (descP && about.overview.desc) descP.textContent = about.overview.desc;
    }

    // 3. Vision & Mission
    if (about.missionVision) {
      var vmContents = document.querySelectorAll('.vision_mission_content');
      if (vmContents[0] && about.missionVision.vision) {
        var pVis = vmContents[0].querySelector('.para_new_font');
        if (pVis) pVis.textContent = about.missionVision.vision;
      }
      if (vmContents[1] && about.missionVision.mission) {
        var pMis = vmContents[1].querySelector('.para_new_font');
        if (pMis) pMis.textContent = about.missionVision.mission;
      }
    }

    // 4. Pillars of Growth
    if (about.pillars && about.pillars.length) {
      var layers = document.querySelectorAll('.care_for_main .care_for_flex');
      about.pillars.forEach(function (pil, idx) {
        if (layers[idx]) {
          var h3 = layers[idx].querySelector('.subheading-text');
          var p = layers[idx].querySelector('.para_new_font');
          var img = layers[idx].querySelector('.care_for_img img');
          if (h3 && pil.title) h3.textContent = pil.title;
          if (p && pil.desc) p.textContent = pil.desc;
          if (img && pil.image) setSafeImage(img, pil.image);
        }
      });
    }

    // 5. Our Management Intro
    if (about.managementIntro) {
      var mgmtHeading = document.querySelector('#leadership .supreme_board_heading');
      if (mgmtHeading && about.managementIntro.title) {
        var rawTitle = about.managementIntro.title.trim();
        var parts = rawTitle.split(/\s+/);
        if (parts.length > 1) {
          mgmtHeading.innerHTML = '<span class="supreme_heading_red">' + parts[0] + '</span> ' + parts.slice(1).join(' ');
        } else {
          mgmtHeading.textContent = rawTitle;
        }
      }
      var introDiv = document.querySelector('.supreme_lead_intro');
      if (introDiv) {
        var pList = introDiv.querySelectorAll('p');
        if (pList[0] && about.managementIntro.p1) pList[0].textContent = about.managementIntro.p1;
        if (pList[1] && about.managementIntro.p2) pList[1].textContent = about.managementIntro.p2;
        if (pList[2] && about.managementIntro.p3) pList[2].textContent = about.managementIntro.p3;
      }
    }

    // 6. Board of Directors (Card & Modal Hydration)
    if (about.leadership && about.leadership.length) {
      var cards = document.querySelectorAll('.supreme_director_card');
      about.leadership.forEach(function (leader, idx) {
        if (cards[idx]) {
          var nameEl = cards[idx].querySelector('.supreme_director_name');
          var roleEl = cards[idx].querySelector('.supreme_director_role');
          var photoEl = cards[idx].querySelector('.supreme_director_photo img');
          if (nameEl && leader.name) nameEl.textContent = leader.name;
          if (roleEl && leader.role) roleEl.innerHTML = leader.role;
          if (photoEl && leader.photo) setSafeImage(photoEl, leader.photo);
        }
      });

      // Synchronize the profile modal data if defined
      var profileData = window.execProfilesData || window.supremeModalData;
      if (profileData) {
        var keys = ['ratan', 'rajkumar', 'sukhram', 'bhavesh', 'devesh'];
        about.leadership.forEach(function (leader, idx) {
          var k = keys[idx];
          if (k && profileData[k]) {
            if (leader.name) profileData[k].name = leader.name;
            if (leader.role) profileData[k].role = leader.role;
            if (leader.photo) profileData[k].photo = leader.photo;
            if (leader.bio) profileData[k].bio = leader.bio;
            if (leader.quote) profileData[k].quote = leader.quote;
          }
        });
      }
    }
  }

  // --- C. Products Page Hydration ---
  function hydrateProducts(prod) {
    if (prod.hero && prod.hero.bannerImage) {
      var bannerDiv = document.querySelector('.banner-slider-img1');
      if (bannerDiv) bannerDiv.style.backgroundImage = 'url("' + prod.hero.bannerImage + '")';
    }

    if (prod.shopByBrandHeader) {
      var sb = document.querySelector('.np-brand-header h2');
      if (sb && prod.shopByBrandHeader.title) sb.textContent = prod.shopByBrandHeader.title;
    }

    if (prod.exploreCollectionsHeader) {
      var ec = document.querySelector('.np-coll-header h2');
      if (ec && prod.exploreCollectionsHeader.title) ec.textContent = prod.exploreCollectionsHeader.title;
    }

    // 12 collections cards
    if (prod.collections && prod.collections.length) {
      var collCards = document.querySelectorAll('.collection-card, .np-collection-item');
      prod.collections.forEach(function (c, idx) {
        if (collCards[idx]) {
          var titleEl = collCards[idx].querySelector('.collection-title, h4');
          var countEl = collCards[idx].querySelector('.collection-count, span');
          var imgEl = collCards[idx].querySelector('img');
          if (titleEl && c.name) titleEl.textContent = c.name;
          if (countEl && c.count) countEl.textContent = c.count;
          if (imgEl && c.image) setSafeImage(imgEl, c.image);
        }
      });
    }
  }

  // --- D. Manufacturing Hydration ---
  function hydrateManufacturing(mfg) {
    if (mfg.hero && mfg.hero.bannerImage) {
      var bannerDiv = document.querySelector('.banner-slider-img1');
      if (bannerDiv) bannerDiv.style.backgroundImage = 'url("' + mfg.hero.bannerImage + '")';
    }

    if (mfg.plants && mfg.plants.length) {
      var plantCards = document.querySelectorAll('.np-hub-item, .np-cap-card');
      mfg.plants.forEach(function (p, idx) {
        if (plantCards[idx]) {
          var titleEl = plantCards[idx].querySelector('h3, .np-hub-title');
          var locEl = plantCards[idx].querySelector('.np-hub-loc');
          var imgEl = plantCards[idx].querySelector('img');
          if (titleEl && p.name) titleEl.textContent = p.name;
          if (locEl && p.location) locEl.textContent = p.location;
          if (imgEl && p.image) setSafeImage(imgEl, p.image);
        }
      });
    }
  }

  // --- E. Dealer Desk Hydration ---
  function hydrateDistributor(dist) {
    if (dist.hero && dist.hero.bannerImage) {
      var bannerDiv = document.querySelector('.banner-slider-img1');
      if (bannerDiv) bannerDiv.style.backgroundImage = 'url("' + dist.hero.bannerImage + '")';
    }
    if (dist.whyPartner && dist.whyPartner.title) {
      var perksTitle = document.querySelector('.perks-heading, .why-partner-heading');
      if (perksTitle) perksTitle.textContent = dist.whyPartner.title;
    }
  }

  // --- F. Contact Hydration ---
  function hydrateContact(contact, general) {
    var email = (general && general.contactEmail) || (contact && contact.supportChannels && contact.supportChannels.general);
    var phone = (general && general.contactPhone) || (contact && contact.corporateOffice && contact.corporateOffice.phone);
    var address = (contact && contact.corporateOffice && contact.corporateOffice.address) || (general && general.headOffice);

    if (email) {
      document.querySelectorAll('.contact-email-val').forEach(function (el) { el.textContent = email; });
    }
    if (phone) {
      document.querySelectorAll('.contact-phone-val').forEach(function (el) { el.textContent = phone; });
    }
    if (address) {
      document.querySelectorAll('.contact-address-val').forEach(function (el) { el.textContent = address; });
    }

    // Dynamic Support Channels & Helplines Hydration
    if (contact && Array.isArray(contact.channels) && contact.channels.length > 0) {
      // 1. Hydrate Corporate & Registered Office Box on contact.html
      var contactCardBox = document.querySelector('.contact_card_box');
      if (contactCardBox) {
        var cardChannels = contact.channels.filter(function (ch) {
          return !ch.placement || ch.placement === 'contact_card' || ch.placement === 'both' || ch.placement === 'all';
        });

        if (cardChannels.length > 0) {
          var registeredAddr = (contact.corporateOffice && contact.corporateOffice.address) || address || '135G, Shyama Prasad Mukherjee Road, Sterling Apartment, First Floor, Next to Mahindra Showroom, Kolkata 700026';
          var mapLink = (contact.corporateOffice && contact.corporateOffice.mapUrl) || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(registeredAddr);

          var boxHtml = '<h3><i class="fas fa-building" style="color:var(--brand-primary);font-size:20px;"></i> Corporate &amp; Registered Office</h3>' +
            '<div class="contact_item_row">' +
              '<div class="contact_item_icon"><i class="fas fa-map-marker-alt"></i></div>' +
              '<div class="contact_item_text">' +
                '<h5>Registered Address</h5>' +
                '<p><strong>NATIONAL PLASTO MOULDING</strong><br>' +
                '<a href="' + mapLink + '" target="_blank" rel="noopener">' + registeredAddr + '</a></p>' +
              '</div>' +
            '</div>';

          cardChannels.forEach(function (ch) {
            var iconClass = 'fas fa-phone-alt';
            var valHtml = '';
            var cleanVal = (ch.value || '').trim();

            if (ch.type === 'whatsapp') {
              iconClass = 'fab fa-whatsapp';
              var waNum = cleanVal.replace(/[^0-9]/g, '');
              valHtml = '<a href="tel:' + cleanVal + '">' + cleanVal + '</a> &bull; ' +
                '<a href="https://wa.me/' + waNum + '?text=Hello%20National%20Plasto%2C%20I%20would%20like%20to%20know%20more%20about%20your%20products." target="_blank" rel="noopener" style="color:#22C55E;font-weight:600;"><i class="fab fa-whatsapp"></i> WhatsApp Chat</a>';
            } else if (ch.type === 'email') {
              iconClass = 'fas fa-envelope';
              valHtml = '<a class="contact-email-link" href="mailto:' + cleanVal + '">' + cleanVal + '</a>';
            } else {
              iconClass = 'fas fa-phone-alt';
              valHtml = '<a href="tel:' + cleanVal.split('/')[0].trim() + '">' + cleanVal + '</a>';
            }

            if (ch.note) {
              valHtml += ' <span style="display:block; font-size:12px; color:#64748B; margin-top:2px;">' + ch.note + '</span>';
            }

            boxHtml += '<div class="contact_item_row">' +
              '<div class="contact_item_icon"><i class="' + iconClass + '"></i></div>' +
              '<div class="contact_item_text">' +
                '<h5>' + (ch.label || 'Support Helpline') + '</h5>' +
                '<p>' + valHtml + '</p>' +
              '</div>' +
            '</div>';
          });

          contactCardBox.innerHTML = boxHtml;
        }
      }

      // 2. Hydrate Footer Contact Column across all pages
      var footerContactNav = document.querySelector('.np-sfooter-col[aria-label="Contact"] ul');
      if (footerContactNav) {
        var footerChannels = contact.channels.filter(function (ch) {
          return ch.placement === 'footer' || ch.placement === 'both' || ch.placement === 'all';
        });

        if (footerChannels.length > 0) {
          var footerAddr = (contact.corporateOffice && contact.corporateOffice.address) || address || '135G, Shyama Prasad Mukherjee Road, Sterling Apartment, First Floor, Next to Mahindra Showroom, Kolkata 700026';
          var fHtml = '<li><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(footerAddr) + '" target="_blank" rel="noopener">' + footerAddr + '</a></li>';

          footerChannels.forEach(function (ch) {
            var val = (ch.value || '').trim();
            if (ch.type === 'email') {
              fHtml += '<li><a href="mailto:' + val + '">' + (ch.label ? ch.label + ': ' : '') + val + '</a></li>';
            } else if (ch.type === 'whatsapp') {
              var waNum = val.replace(/[^0-9]/g, '');
              fHtml += '<li><a href="https://wa.me/' + waNum + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp" style="color:#22C55E;"></i> ' + (ch.label ? ch.label + ': ' : '') + val + '</a></li>';
            } else {
              fHtml += '<li><a href="tel:' + val.split('/')[0].trim() + '">' + (ch.label ? ch.label + ': ' : '') + val + '</a></li>';
            }
          });

          fHtml += '<li><a href="policies.html#privacy">Privacy Policy</a></li>' +
                   '<li><a href="policies.html#terms">Terms &amp; Conditions</a></li>';
          footerContactNav.innerHTML = fHtml;
        }
      }
    }

    // Dynamic Factory Units, Regional Depots & Offices Hydration
    if (contact && Array.isArray(contact.factories) && contact.factories.length > 0) {
      // 1. Interactive Map Tabs on contact.html (#map .np-findus-tabs)
      var tabsContainer = document.querySelector('.np-findus-tabs');
      var mapFrame = document.getElementById('np_findus_frame');
      var mapAddr = document.getElementById('np_findus_addr');
      var mapDir = document.getElementById('np_findus_dir');

      if (tabsContainer) {
        var corpAddress = (contact.corporateOffice && contact.corporateOffice.address) || address || '135G, Shyama Prasad Mukherjee Road, Sterling Apartment, First Floor, Next to Mahindra Showroom, Kolkata 700026';
        var corpQ = encodeURIComponent(corpAddress);

        var mapItems = contact.factories.filter(function (f) {
          return !f.placement || f.placement === 'factory' || f.placement === 'map' || f.placement === 'both' || f.placement === 'office';
        });

        var html = '<button type="button" class="np-findus-tab is-active" data-q="' + corpQ + '" data-addr="NATIONAL PLASTO MOULDING &bull; ' + corpAddress.replace(/"/g, '&quot;') + '" role="tab" aria-selected="true"><strong>Corporate Office</strong><span>Kolkata</span></button>';

        mapItems.forEach(function (item) {
          var itemAddr = item.address || '';
          var itemQ = encodeURIComponent(itemAddr);
          var fullAddr = item.name + ' &bull; ' + itemAddr;
          var sub = item.subtitle || (item.name.indexOf('(') !== -1 ? item.name.substring(item.name.indexOf('(') + 1).replace(')', '') : '');
          html += '<button type="button" class="np-findus-tab" data-q="' + itemQ + '" data-addr="' + fullAddr.replace(/"/g, '&quot;') + '" role="tab" aria-selected="false"><strong>' + item.name + '</strong>' + (sub ? '<span>' + sub + '</span>' : '') + '</button>';
        });

        tabsContainer.innerHTML = html;

        // Update intro text if present
        var findusHead = document.querySelector('.np-findus-head p');
        if (findusHead) {
          findusHead.textContent = 'Visit our corporate office in Kolkata or any of our ' + (mapItems.length) + ' manufacturing plants and regional facilities.';
        }
      }

      // 2. Regional Manufacturing & Trade Depots grid on contact.html (.regional_hubs_section .hubs_grid)
      var hubsGrid = document.querySelector('.regional_hubs_section .hubs_grid');
      if (hubsGrid) {
        var depotItems = contact.factories.filter(function (f) {
          return f.placement === 'depot' || f.placement === 'both' || f.placement === 'office';
        });

        if (depotItems.length > 0) {
          var cardsHtml = '';
          depotItems.forEach(function (item, idx) {
            var role = item.subtitle || (item.placement === 'office' ? 'Corporate Liaison' : ('Regional Plant & Hub ' + (idx + 1)));
            var contactInfo = item.phone || item.email || (general && general.contactPhone) || '+91 98300 12345';
            cardsHtml += '<div class="hub_card toTop" data-scroll style="opacity:1;">' +
              '<span class="hub_role">' + role + '</span>' +
              '<h4>' + item.name + '</h4>' +
              '<p>' + (item.address || '') + '</p>' +
              '<div class="hub_contact">' + contactInfo + '</div>' +
            '</div>';
          });
          hubsGrid.innerHTML = cardsHtml;
        }
      }
    }
  }

  // --- G. Policies Hydration ---
  function hydratePolicies(policies) {
    if (policies.qualityWarranty && policies.qualityWarranty.text) {
      var wEl = document.getElementById('warranty-text') || document.querySelector('.policy-warranty-content');
      if (wEl) wEl.textContent = policies.qualityWarranty.text;
    }
    if (policies.privacy && policies.privacy.text) {
      var pEl = document.getElementById('privacy-text') || document.querySelector('.policy-privacy-content');
      if (pEl) pEl.textContent = policies.privacy.text;
    }
  }

  function initLoader() {
    fetchCMSData().then(applyCMS);
  }

  // 1. Run as early as possible on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
  } else {
    initLoader();
  }

  // 2. Re-run on window.load (ensures Slick clones and lazy loader attributes stay synchronized)
  window.addEventListener('load', function () {
    setTimeout(initLoader, 80);
  });

  // 3. Listen for cross-tab storage updates
  window.addEventListener('storage', function (e) {
    if (e.key === 'np_custom_cms' || e.key === 'np_custom_cms_timestamp') {
      initLoader();
    }
  });

  // 4. Listen for BroadcastChannel updates
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      var bc = new BroadcastChannel('np_cms_channel');
      bc.onmessage = function (ev) {
        if (ev.data && ev.data.type === 'cms_updated') {
          initLoader();
        }
      };
    } catch (_) {}
  }
})();

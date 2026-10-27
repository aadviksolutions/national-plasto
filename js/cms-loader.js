/**
 * National Plasto - Complete CMS Content Loader & Dynamic Hydration Engine
 * Connects all public pages to customized content & images managed via the Admin Panel CMS.
 */
(function () {
  'use strict';

  function fetchCMSData() {
    try {
      var localCMS = localStorage.getItem('np_custom_cms');
      if (localCMS) {
        var parsed = JSON.parse(localCMS);
        if (parsed && typeof parsed === 'object') {
          return Promise.resolve(parsed);
        }
      }
    } catch (e) {}

    return fetch('/api/cms?t=' + Date.now())
      .then(function (res) {
        var ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json')) throw new Error('API not available');
        return res.json();
      })
      .then(function (res) {
        return res.data || res;
      })
      .catch(function () {
        return fetch('data/cms-content.json?t=' + Date.now())
          .then(function (res) { return res.json(); })
          .catch(function (err) {
            console.warn('[CMS Loader] Fallback JSON error:', err);
            return null;
          });
      });
  }

  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : undefined;
    }, obj);
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
          el.src = val;
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
      if (cmdImg && home.cmdTestimonial.photo) cmdImg.src = home.cmdTestimonial.photo;

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

    // 5. Plant Highlights Slider
    if (home.plantHighlights && home.plantHighlights.length) {
      var plantItems = document.querySelectorAll('.plant_slider .plant_item');
      plantItems.forEach(function (item, idx) {
        if (home.plantHighlights[idx]) {
          var img = item.querySelector('img');
          var btn = item.querySelector('.plant_btn');
          if (img && home.plantHighlights[idx].image) img.src = home.plantHighlights[idx].image;
          if (btn && home.plantHighlights[idx].title) btn.textContent = home.plantHighlights[idx].title;
          if (btn && home.plantHighlights[idx].link) btn.href = home.plantHighlights[idx].link;
        }
      });
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
          brandImgs[idx].src = b.image;
        }
      });
    }

    // 7. Milestones
    if (home.milestones && home.milestones.length) {
      var msBoxes = document.querySelectorAll('.milestones_slider .milestones_flex');
      msBoxes.forEach(function (box, idx) {
        if (home.milestones[idx]) {
          var dateEl = box.querySelector('.np-ms-date');
          var descEl = box.querySelector('.milestones_content .para-text');
          var imgEl = box.querySelector('.milestones_img img');
          if (dateEl && home.milestones[idx].date) dateEl.textContent = home.milestones[idx].date;
          if (descEl && home.milestones[idx].desc) descEl.textContent = home.milestones[idx].desc;
          if (imgEl && home.milestones[idx].image) imgEl.src = home.milestones[idx].image;
        }
      });
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
      if (touchImg && home.touchingLives.image) touchImg.src = home.touchingLives.image;

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
      if (innoImg && home.innovativeProducts.image) innoImg.src = home.innovativeProducts.image;

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
      if (mobImg) mobImg.src = about.hero.bannerImage;
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
          if (img && pil.image) img.src = pil.image;
        }
      });
    }

    // 5. Board of Directors (Card & Modal Hydration)
    if (about.leadership && about.leadership.length) {
      var cards = document.querySelectorAll('.supreme_director_card');
      about.leadership.forEach(function (leader, idx) {
        if (cards[idx]) {
          var nameEl = cards[idx].querySelector('.supreme_director_name');
          var roleEl = cards[idx].querySelector('.supreme_director_role');
          var photoEl = cards[idx].querySelector('.supreme_director_photo img');
          if (nameEl && leader.name) nameEl.textContent = leader.name;
          if (roleEl && leader.role) roleEl.innerHTML = leader.role;
          if (photoEl && leader.photo) photoEl.src = leader.photo;
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
          if (imgEl && c.image) imgEl.src = c.image;
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
          if (imgEl && p.image) imgEl.src = p.image;
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

  // Execute on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      fetchCMSData().then(applyCMS);
    });
  } else {
    fetchCMSData().then(applyCMS);
  }
})();

const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(__dirname, '..', 'js', 'admin.js');
let js = fs.readFileSync(adminJsPath, 'utf8');

// Replace populateCMSForms and saveCurrentCMS functions
const newCMSFunctions = `
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
          link: 'products.html?cat=' + name.toLowerCase().replace(/\\s+/g, '-')
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
`;

// Locate populateCMSForms in admin.js
const startIdx = js.indexOf('function populateCMSForms() {');
const endIdx = js.indexOf('// ================= 6. MEDIA LIBRARY =================');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find anchor in admin.js: startIdx=' + startIdx + ', endIdx=' + endIdx);
  process.exit(1);
}

const updatedJs = js.substring(0, startIdx) + newCMSFunctions.trim() + '\n\n  ' + js.substring(endIdx);
fs.writeFileSync(adminJsPath, updatedJs, 'utf8');
console.log('Successfully updated js/admin.js with all section handlers!');

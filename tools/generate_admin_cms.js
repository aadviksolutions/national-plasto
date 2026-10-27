const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

// Build the complete panelCms HTML
const cmsPanelHtml = `
        <!-- ================= 3. PAGE CONTENT CMS PANEL (ALL PAGES & ALL SECTIONS) ================= -->
        <section id="panelCms" class="view-panel">
          <div class="cms-tabs" id="cmsTabs">
            <button class="cms-tab-btn active" data-cmspage="home"><i class="fas fa-home"></i> Home Page</button>
            <button class="cms-tab-btn" data-cmspage="about"><i class="fas fa-info-circle"></i> About Us</button>
            <button class="cms-tab-btn" data-cmspage="products"><i class="fas fa-couch"></i> Products Page</button>
            <button class="cms-tab-btn" data-cmspage="manufacturing"><i class="fas fa-industry"></i> Manufacturing</button>
            <button class="cms-tab-btn" data-cmspage="distributor"><i class="fas fa-handshake"></i> Dealer Desk</button>
            <button class="cms-tab-btn" data-cmspage="contact"><i class="fas fa-envelope"></i> Contact Us</button>
            <button class="cms-tab-btn" data-cmspage="policies"><i class="fas fa-shield-alt"></i> Policies</button>
          </div>

          <!-- ================= 1. HOME PAGE FULL SECTIONS ================= -->
          <div id="cmsForm_home" class="cms-page-form" style="display:block;">
            
            <!-- Section 1: Hero Banner & Rotator -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-image"></i> Section 1: Hero Banner & Continuous Rotator</h3>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Hero Eyebrow / Badge</label>
                    <input type="text" id="cms_home_hero_eyebrow" class="form-control" placeholder="e.g. Since 1997">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Rotating Title 1</label>
                    <input type="text" id="cms_home_hero_title1" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Rotating Title 2</label>
                    <input type="text" id="cms_home_hero_title2" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Rotating Title 3</label>
                    <input type="text" id="cms_home_hero_title3" class="form-control">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Background Video URL</label>
                    <input type="text" id="cms_home_hero_video" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Video Poster Image URL</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" id="cms_home_hero_poster" class="form-control">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_hero_poster')"><i class="fas fa-image"></i></button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Desktop Fallback Banner Image</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" id="cms_home_hero_image" class="form-control">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_hero_image')"><i class="fas fa-image"></i></button>
                    </div>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">CTA Button Text</label>
                    <input type="text" id="cms_home_hero_ctaText" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">CTA Button Link</label>
                    <input type="text" id="cms_home_hero_ctaLink" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Virtues (6 Pillars) -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-shield-alt"></i> Section 2: National Plasto Virtues (6 Pillars)</h3>
              </div>
              <div class="card-body">
                <div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Virtue 1: Integrity</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_virtue_0_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_virtue_0_desc" class="form-control" rows="3"></textarea></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Virtue 2: Customer Centricity</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_virtue_1_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_virtue_1_desc" class="form-control" rows="3"></textarea></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Virtue 3: Delivering Excellence</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_virtue_2_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_virtue_2_desc" class="form-control" rows="3"></textarea></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Virtue 4: Innovation</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_virtue_3_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_virtue_3_desc" class="form-control" rows="3"></textarea></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Virtue 5: People First</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_virtue_4_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_virtue_4_desc" class="form-control" rows="3"></textarea></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Virtue 6: Empowerment</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_virtue_5_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_virtue_5_desc" class="form-control" rows="3"></textarea></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: CMD / Chairman's Message -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-quote-left"></i> Section 3: Chairman & Managing Director Message</h3>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group" style="flex: 2;">
                    <label class="form-label">CMD Message Quote</label>
                    <textarea id="cms_home_cmd_quote" class="form-control" rows="4"></textarea>
                  </div>
                  <div class="form-group" style="flex: 1;">
                    <label class="form-label">CMD Leader Name</label>
                    <input type="text" id="cms_home_cmd_name" class="form-control">
                    <label class="form-label" style="margin-top:10px;">Role Designation</label>
                    <input type="text" id="cms_home_cmd_role" class="form-control">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">CMD Photo Cutout</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" id="cms_home_cmd_photo" class="form-control">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_cmd_photo')"><i class="fas fa-image"></i></button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Text</label>
                    <input type="text" id="cms_home_cmd_btnText" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Link</label>
                    <input type="text" id="cms_home_cmd_btnLink" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 4: Largest Plastic & Metrics -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-chart-bar"></i> Section 4: Key Metrics & Industrial Scale (8 Badges)</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Section Heading</label>
                  <input type="text" id="cms_home_metrics_heading" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Section Description</label>
                  <textarea id="cms_home_metrics_desc" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-row" style="grid-template-columns: repeat(4, 1fr);">
                  <div class="cms-item-box"><div class="cms-item-box-title">Pedigree</div><input type="text" id="cms_home_stat_0" class="form-control" placeholder="29+ Years"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">States</div><input type="text" id="cms_home_stat_1" class="form-control" placeholder="15+ States"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Plants</div><input type="text" id="cms_home_stat_2" class="form-control" placeholder="4 Plants"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Brands</div><input type="text" id="cms_home_stat_3" class="form-control" placeholder="4 Brands"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">SKUs</div><input type="text" id="cms_home_stat_4" class="form-control" placeholder="1,200+ Products"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Dealers</div><input type="text" id="cms_home_stat_5" class="form-control" placeholder="500+ Dealers"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Workforce</div><input type="text" id="cms_home_stat_6" class="form-control" placeholder="1,000+ Workforce"></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Certifications</div><input type="text" id="cms_home_stat_7" class="form-control" placeholder="ISO · CE · BIFMA"></div>
                </div>
              </div>
            </div>

            <!-- Section 5: Plant Highlights Slider -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-industry"></i> Section 5: Plant Highlights Slider Cards</h3>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Highlight 1</div>
                    <div class="form-group"><label class="form-label">Button Title</label><input type="text" id="cms_home_highlight_0_title" class="form-control"></div>
                    <div class="form-group">
                      <label class="form-label">Image URL</label>
                      <div style="display:flex; gap:6px;">
                        <input type="text" id="cms_home_highlight_0_image" class="form-control">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_highlight_0_image')"><i class="fas fa-image"></i></button>
                      </div>
                    </div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Highlight 2</div>
                    <div class="form-group"><label class="form-label">Button Title</label><input type="text" id="cms_home_highlight_1_title" class="form-control"></div>
                    <div class="form-group">
                      <label class="form-label">Image URL</label>
                      <div style="display:flex; gap:6px;">
                        <input type="text" id="cms_home_highlight_1_image" class="form-control">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_highlight_1_image')"><i class="fas fa-image"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 6: Our Brands (4 Divisions) -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-th-large"></i> Section 6: Our Brands (NEXT, NATIONAL, CAPTAIN, SAPPHIRE)</h3>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <!-- NEXT -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Brand 1: NEXT (Premium)</div>
                    <div class="form-group"><label class="form-label">Tagline</label><input type="text" id="cms_home_brand_0_tagline" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_brand_0_desc" class="form-control" rows="2"></textarea></div>
                    <div class="form-group">
                      <label class="form-label">Brand Image</label>
                      <div style="display:flex; gap:6px;">
                        <input type="text" id="cms_home_brand_0_image" class="form-control">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_brand_0_image')"><i class="fas fa-image"></i></button>
                      </div>
                    </div>
                  </div>
                  <!-- NATIONAL -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Brand 2: NATIONAL</div>
                    <div class="form-group"><label class="form-label">Tagline</label><input type="text" id="cms_home_brand_1_tagline" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_brand_1_desc" class="form-control" rows="2"></textarea></div>
                    <div class="form-group">
                      <label class="form-label">Brand Image</label>
                      <div style="display:flex; gap:6px;">
                        <input type="text" id="cms_home_brand_1_image" class="form-control">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_brand_1_image')"><i class="fas fa-image"></i></button>
                      </div>
                    </div>
                  </div>
                  <!-- CAPTAIN -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Brand 3: CAPTAIN</div>
                    <div class="form-group"><label class="form-label">Tagline</label><input type="text" id="cms_home_brand_2_tagline" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_brand_2_desc" class="form-control" rows="2"></textarea></div>
                    <div class="form-group">
                      <label class="form-label">Brand Image</label>
                      <div style="display:flex; gap:6px;">
                        <input type="text" id="cms_home_brand_2_image" class="form-control">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_brand_2_image')"><i class="fas fa-image"></i></button>
                      </div>
                    </div>
                  </div>
                  <!-- SAPPHIRE -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Brand 4: SAPPHIRE</div>
                    <div class="form-group"><label class="form-label">Tagline</label><input type="text" id="cms_home_brand_3_tagline" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_brand_3_desc" class="form-control" rows="2"></textarea></div>
                    <div class="form-group">
                      <label class="form-label">Brand Image</label>
                      <div style="display:flex; gap:6px;">
                        <input type="text" id="cms_home_brand_3_image" class="form-control">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_brand_3_image')"><i class="fas fa-image"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 7: Milestones Timeline (5 Eras) -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-history"></i> Section 7: Milestones Timeline (1981, 1997, 2007, 2010, 2026)</h3>
              </div>
              <div class="card-body">
                <div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">1981: Foundational Roots</div>
                    <div class="form-group"><label class="form-label">Subtitle</label><input type="text" id="cms_home_ms_0_date" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_ms_0_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_home_ms_0_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">1997: Inception & Incorporation</div>
                    <div class="form-group"><label class="form-label">Subtitle</label><input type="text" id="cms_home_ms_1_date" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_ms_1_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_home_ms_1_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">2007: Guwahati Plant</div>
                    <div class="form-group"><label class="form-label">Subtitle</label><input type="text" id="cms_home_ms_2_date" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_ms_2_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_home_ms_2_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">2010: Roorkee & Hajipur Expansion</div>
                    <div class="form-group"><label class="form-label">Subtitle</label><input type="text" id="cms_home_ms_3_date" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_ms_3_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_home_ms_3_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">2026: Modern Pan-India Complex</div>
                    <div class="form-group"><label class="form-label">Subtitle</label><input type="text" id="cms_home_ms_4_date" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_home_ms_4_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_home_ms_4_img" class="form-control"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 8: Sustainability & Circular Plastic Furniture -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-leaf"></i> Section 8: Sustainability & Green Manufacturing</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Section Title</label>
                  <input type="text" id="cms_home_sust_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Paragraph 1 (Reprocessed Plastic Furniture Narrative)</label>
                  <textarea id="cms_home_sust_p1" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Paragraph 2 (ISO 14001 & ISO 50001 Environmental Audit)</label>
                  <textarea id="cms_home_sust_p2" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Button Text</label>
                    <input type="text" id="cms_home_sust_btnText" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Link</label>
                    <input type="text" id="cms_home_sust_btnLink" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 9: Touching Lives / Every Community -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-heart"></i> Section 9: Furniture for Every Community</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Heading</label>
                  <input type="text" id="cms_home_touch_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea id="cms_home_touch_desc" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Community Section Image</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" id="cms_home_touch_image" class="form-control">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_touch_image')"><i class="fas fa-image"></i></button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Text</label>
                    <input type="text" id="cms_home_touch_btnText" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Link</label>
                    <input type="text" id="cms_home_touch_btnLink" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 10: Innovative Products / Creating Impact -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-lightbulb"></i> Section 10: Innovating Products, Creating Impact</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Heading</label>
                  <input type="text" id="cms_home_inno_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea id="cms_home_inno_desc" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Showcase Banner Image</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" id="cms_home_inno_image" class="form-control">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_home_inno_image')"><i class="fas fa-image"></i></button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Text</label>
                    <input type="text" id="cms_home_inno_btnText" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Link</label>
                    <input type="text" id="cms_home_inno_btnLink" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 11: Commercial Video Reels (4 Items) -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-video"></i> Section 11: Commercial Video Reels</h3>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Reel 1: NEXT</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_reel_0_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Poster Image</label><input type="text" id="cms_home_reel_0_poster" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Video URL</label><input type="text" id="cms_home_reel_0_video" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Reel 2: NATIONAL</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_reel_1_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Poster Image</label><input type="text" id="cms_home_reel_1_poster" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Video URL</label><input type="text" id="cms_home_reel_1_video" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Reel 3: CAPTAIN</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_reel_2_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Poster Image</label><input type="text" id="cms_home_reel_2_poster" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Video URL</label><input type="text" id="cms_home_reel_2_video" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Reel 4: SAPPHIRE</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_home_reel_3_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Poster Image</label><input type="text" id="cms_home_reel_3_poster" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Video URL</label><input type="text" id="cms_home_reel_3_video" class="form-control"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 12: Pan-India Network Map & Statistics -->
            <div class="cms-section-card">
              <div class="card-header">
                <h3><i class="fas fa-network-wired"></i> Section 12: Pan-India Network & Metric Badges</h3>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Network Section Title</label>
                    <input type="text" id="cms_home_network_title" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Network Section Subtitle</label>
                    <input type="text" id="cms_home_network_subtitle" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Plants Stat</label>
                    <input type="text" id="cms_home_network_plants" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Daily Capacity Stat</label>
                    <input type="text" id="cms_home_network_capacity" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Authorized Dealers Stat</label>
                    <input type="text" id="cms_home_network_dealers" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">States Covered</label>
                    <input type="text" id="cms_home_network_states" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>Home Page: Review edits and press Save to update live site.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('home')"><i class="fas fa-save"></i> Save All Home Sections</button>
            </div>
          </div>

          <!-- ================= 2. ABOUT US FULL SECTIONS ================= -->
          <div id="cmsForm_about" class="cms-page-form" style="display:none;">
            <!-- Hero Banner -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-image"></i> Section 1: Hero Banner</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Hero Title</label>
                  <input type="text" id="cms_about_hero_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Hero Subtitle</label>
                  <textarea id="cms_about_hero_subtitle" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Banner Image URL</label>
                  <div style="display:flex; gap:8px;">
                    <input type="text" id="cms_about_hero_image" class="form-control">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_about_hero_image')"><i class="fas fa-images"></i> Pick</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Heritage & Narrative -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-landmark"></i> Section 2: Heritage & Corporate Overview</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Section Title</label>
                  <input type="text" id="cms_about_overview_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Lead Subtitle Text</label>
                  <input type="text" id="cms_about_overview_lead" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Detailed Narrative</label>
                  <textarea id="cms_about_overview_desc" class="form-control" rows="5"></textarea>
                </div>
              </div>
            </div>

            <!-- Mission & Vision -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-compass"></i> Section 3: Mission & Vision</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Vision Statement</label>
                  <textarea id="cms_about_vision" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Mission Statement</label>
                  <textarea id="cms_about_mission" class="form-control" rows="2"></textarea>
                </div>
              </div>
            </div>

            <!-- Key Statistics -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-chart-line"></i> Section 4: What makes us National Plasto? (4 Stats)</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Stat 1</label>
                    <input type="text" id="cms_about_stat_0_label" class="form-control" style="margin-bottom:6px;">
                    <input type="text" id="cms_about_stat_0_value" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stat 2</label>
                    <input type="text" id="cms_about_stat_1_label" class="form-control" style="margin-bottom:6px;">
                    <input type="text" id="cms_about_stat_1_value" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stat 3</label>
                    <input type="text" id="cms_about_stat_2_label" class="form-control" style="margin-bottom:6px;">
                    <input type="text" id="cms_about_stat_2_value" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stat 4</label>
                    <input type="text" id="cms_about_stat_3_label" class="form-control" style="margin-bottom:6px;">
                    <input type="text" id="cms_about_stat_3_value" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 Pillars of Manufacturing Excellence -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-cogs"></i> Section 5: Manufacturing Excellence (4 Operational Layers)</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Layer 01: Precision in Every Product</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_about_pillar_0_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_about_pillar_0_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_about_pillar_0_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Layer 02: Built for Efficiency</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_about_pillar_1_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_about_pillar_1_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_about_pillar_1_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Layer 03: Quality You Can Trust</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_about_pillar_2_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_about_pillar_2_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_about_pillar_2_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Layer 04: Efficiency in Every Process</div>
                    <div class="form-group"><label class="form-label">Title</label><input type="text" id="cms_about_pillar_3_title" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="cms_about_pillar_3_desc" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="text" id="cms_about_pillar_3_img" class="form-control"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Executive Leadership (5 Board Members) -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-users"></i> Section 6: Board of Directors (All 5 Executive Directors)</h3></div>
              <div class="card-body">
                <div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                  <!-- 1. CMD -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">1. Chairman & Managing Director</div>
                    <div class="form-group"><label class="form-label">Name</label><input type="text" id="cms_about_lead_0_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Role</label><input type="text" id="cms_about_lead_0_role" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_about_lead_0_photo" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Bio Narrative</label><textarea id="cms_about_lead_0_bio" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Personal Quote</label><input type="text" id="cms_about_lead_0_quote" class="form-control"></div>
                  </div>
                  <!-- 2. Finance -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">2. Director – Finance</div>
                    <div class="form-group"><label class="form-label">Name</label><input type="text" id="cms_about_lead_1_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Role</label><input type="text" id="cms_about_lead_1_role" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_about_lead_1_photo" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Bio Narrative</label><textarea id="cms_about_lead_1_bio" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Personal Quote</label><input type="text" id="cms_about_lead_1_quote" class="form-control"></div>
                  </div>
                  <!-- 3. Production Memoriam -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">3. Director – Production (In Memoriam)</div>
                    <div class="form-group"><label class="form-label">Name</label><input type="text" id="cms_about_lead_2_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Role</label><input type="text" id="cms_about_lead_2_role" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_about_lead_2_photo" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Bio Narrative</label><textarea id="cms_about_lead_2_bio" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Personal Quote</label><input type="text" id="cms_about_lead_2_quote" class="form-control"></div>
                  </div>
                  <!-- 4. Executive Director 1 -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">4. Executive Director (Operations)</div>
                    <div class="form-group"><label class="form-label">Name</label><input type="text" id="cms_about_lead_3_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Role</label><input type="text" id="cms_about_lead_3_role" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_about_lead_3_photo" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Bio Narrative</label><textarea id="cms_about_lead_3_bio" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Personal Quote</label><input type="text" id="cms_about_lead_3_quote" class="form-control"></div>
                  </div>
                  <!-- 5. Executive Director 2 -->
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">5. Executive Director (Marketing & Sales)</div>
                    <div class="form-group"><label class="form-label">Name</label><input type="text" id="cms_about_lead_4_name" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Role</label><input type="text" id="cms_about_lead_4_role" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_about_lead_4_photo" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Bio Narrative</label><textarea id="cms_about_lead_4_bio" class="form-control" rows="3"></textarea></div>
                    <div class="form-group"><label class="form-label">Personal Quote</label><input type="text" id="cms_about_lead_4_quote" class="form-control"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>About Us: Press Save to apply changes across About page.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('about')"><i class="fas fa-save"></i> Save All About Sections</button>
            </div>
          </div>

          <!-- ================= 3. PRODUCTS PAGE FULL SECTIONS ================= -->
          <div id="cmsForm_products" class="cms-page-form" style="display:none;">
            <!-- Hero Banner -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-image"></i> Section 1: Hero Banner</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Hero Title</label>
                  <input type="text" id="cms_products_hero_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Hero Subtitle</label>
                  <textarea id="cms_products_hero_subtitle" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Banner Image</label>
                  <div style="display:flex; gap:8px;">
                    <input type="text" id="cms_products_hero_image" class="form-control">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_products_hero_image')"><i class="fas fa-image"></i> Pick</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Headings -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-heading"></i> Section 2: Storefront Headings</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Shop By Brand Title</label>
                    <input type="text" id="cms_products_brand_title" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Shop By Brand Description</label>
                    <input type="text" id="cms_products_brand_desc" class="form-control">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Explore Collections Title</label>
                    <input type="text" id="cms_products_collection_title" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Explore Collections Description</label>
                    <input type="text" id="cms_products_collection_desc" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- 12 Collection Cards -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-th"></i> Section 3: 12 Category Collection Cards</h3></div>
              <div class="card-body">
                <div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
                  <div class="cms-item-box" id="coll_box_0"><div class="cms-item-box-title">1. Arm Chairs</div><input type="text" id="cms_coll_0_count" class="form-control" placeholder="135 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_0_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_1"><div class="cms-item-box-title">2. Premium Arm Chairs</div><input type="text" id="cms_coll_1_count" class="form-control" placeholder="2 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_1_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_2"><div class="cms-item-box-title">3. Armless Chairs</div><input type="text" id="cms_coll_2_count" class="form-control" placeholder="52 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_2_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_3"><div class="cms-item-box-title">4. Premium Armless</div><input type="text" id="cms_coll_3_count" class="form-control" placeholder="4 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_3_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_4"><div class="cms-item-box-title">5. Metallic Chairs</div><input type="text" id="cms_coll_4_count" class="form-control" placeholder="11 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_4_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_5"><div class="cms-item-box-title">6. Steel Moulded</div><input type="text" id="cms_coll_5_count" class="form-control" placeholder="3 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_5_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_6"><div class="cms-item-box-title">7. Baby Chairs</div><input type="text" id="cms_coll_6_count" class="form-control" placeholder="14 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_6_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_7"><div class="cms-item-box-title">8. Stools</div><input type="text" id="cms_coll_7_count" class="form-control" placeholder="39 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_7_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_8"><div class="cms-item-box-title">9. Tables</div><input type="text" id="cms_coll_8_count" class="form-control" placeholder="51 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_8_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_9"><div class="cms-item-box-title">10. Dining Sets</div><input type="text" id="cms_coll_9_count" class="form-control" placeholder="45 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_9_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_10"><div class="cms-item-box-title">11. Trolleys & Racks</div><input type="text" id="cms_coll_10_count" class="form-control" placeholder="4 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_10_img" class="form-control" placeholder="Image URL"></div>
                  <div class="cms-item-box" id="coll_box_11"><div class="cms-item-box-title">12. Wardrobes</div><input type="text" id="cms_coll_11_count" class="form-control" placeholder="2 Products" style="margin-bottom:6px;"><input type="text" id="cms_coll_11_img" class="form-control" placeholder="Image URL"></div>
                </div>
              </div>
            </div>

            <!-- Brochure Download Modal Settings -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-file-pdf"></i> Section 4: Catalogue PDF Download Settings</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Brochure Title</label>
                    <input type="text" id="cms_products_brochure_title" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Brochure PDF Path / URL</label>
                    <input type="text" id="cms_products_brochure_url" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Download Button Text</label>
                    <input type="text" id="cms_products_brochure_btn" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>Products Page: Press Save to update storefront catalogue settings.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('products')"><i class="fas fa-save"></i> Save All Products Sections</button>
            </div>
          </div>

          <!-- ================= 4. MANUFACTURING FULL SECTIONS ================= -->
          <div id="cmsForm_manufacturing" class="cms-page-form" style="display:none;">
            <!-- Hero Banner -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-image"></i> Section 1: Hero Banner</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Hero Title</label>
                  <input type="text" id="cms_mfg_hero_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Hero Subtitle</label>
                  <textarea id="cms_mfg_hero_subtitle" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Banner Image</label>
                  <div style="display:flex; gap:8px;">
                    <input type="text" id="cms_mfg_hero_image" class="form-control">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_mfg_hero_image')"><i class="fas fa-image"></i> Pick</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Plant Units (4 Plants) -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-industry"></i> Section 2: Four Manufacturing Hubs</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Hub 1: Howrah Plant (West Bengal)</div>
                    <div class="form-group"><label class="form-label">Location</label><input type="text" id="cms_mfg_plant_0_loc" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Daily Capacity</label><input type="text" id="cms_mfg_plant_0_cap" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Machines</label><input type="text" id="cms_mfg_plant_0_mach" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_mfg_plant_0_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Hub 2: Guwahati Plant (Assam)</div>
                    <div class="form-group"><label class="form-label">Location</label><input type="text" id="cms_mfg_plant_1_loc" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Daily Capacity</label><input type="text" id="cms_mfg_plant_1_cap" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Machines</label><input type="text" id="cms_mfg_plant_1_mach" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_mfg_plant_1_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Hub 3: Roorkee Plant (Uttarakhand)</div>
                    <div class="form-group"><label class="form-label">Location</label><input type="text" id="cms_mfg_plant_2_loc" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Daily Capacity</label><input type="text" id="cms_mfg_plant_2_cap" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Machines</label><input type="text" id="cms_mfg_plant_2_mach" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_mfg_plant_2_img" class="form-control"></div>
                  </div>
                  <div class="cms-item-box">
                    <div class="cms-item-box-title">Hub 4: Hajipur Plant (Bihar)</div>
                    <div class="form-group"><label class="form-label">Location</label><input type="text" id="cms_mfg_plant_3_loc" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Daily Capacity</label><input type="text" id="cms_mfg_plant_3_cap" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Machines</label><input type="text" id="cms_mfg_plant_3_mach" class="form-control"></div>
                    <div class="form-group"><label class="form-label">Photo URL</label><input type="text" id="cms_mfg_plant_3_img" class="form-control"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quality Assurance & Testing Laboratory -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-vial"></i> Section 3: Quality Assurance & Testing Laboratory</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">QA Section Title</label>
                  <input type="text" id="cms_mfg_qa_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">QA Description</label>
                  <textarea id="cms_mfg_qa_desc" class="form-control" rows="3"></textarea>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>Manufacturing: Press Save to update manufacturing specs.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('manufacturing')"><i class="fas fa-save"></i> Save All Manufacturing Sections</button>
            </div>
          </div>

          <!-- ================= 5. DEALER DESK FULL SECTIONS ================= -->
          <div id="cmsForm_distributor" class="cms-page-form" style="display:none;">
            <!-- Hero Banner -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-image"></i> Section 1: Hero Banner</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Hero Title</label>
                  <input type="text" id="cms_dist_hero_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Hero Subtitle</label>
                  <textarea id="cms_dist_hero_subtitle" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Banner Image</label>
                  <div style="display:flex; gap:8px;">
                    <input type="text" id="cms_dist_hero_image" class="form-control">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_dist_hero_image')"><i class="fas fa-image"></i> Pick</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Partnership Perks & Support -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-hand-holding-usd"></i> Section 2: Dealer Perks & Hotline</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Perks Section Title</label>
                    <input type="text" id="cms_dist_perks_title" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Dealer Desk Direct Phone</label>
                    <input type="text" id="cms_dist_contact_phone" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Dealer Support Email</label>
                    <input type="email" id="cms_dist_contact_email" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Desk Working Hours</label>
                    <input type="text" id="cms_dist_contact_hours" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 Simple Steps to Dealership -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-step-forward"></i> Section 3: 4-Step Partnership Onboarding</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="cms-item-box"><div class="cms-item-box-title">Step 1: Apply Online</div><input type="text" id="cms_dist_step_0_title" class="form-control" style="margin-bottom:6px;"><textarea id="cms_dist_step_0_desc" class="form-control" rows="2"></textarea></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Step 2: Verification</div><input type="text" id="cms_dist_step_1_title" class="form-control" style="margin-bottom:6px;"><textarea id="cms_dist_step_1_desc" class="form-control" rows="2"></textarea></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Step 3: Agreement</div><input type="text" id="cms_dist_step_2_title" class="form-control" style="margin-bottom:6px;"><textarea id="cms_dist_step_2_desc" class="form-control" rows="2"></textarea></div>
                  <div class="cms-item-box"><div class="cms-item-box-title">Step 4: Dispatch</div><input type="text" id="cms_dist_step_3_title" class="form-control" style="margin-bottom:6px;"><textarea id="cms_dist_step_3_desc" class="form-control" rows="2"></textarea></div>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>Dealer Desk: Press Save to update dealership portal content.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('distributor')"><i class="fas fa-save"></i> Save All Dealer Desk Sections</button>
            </div>
          </div>

          <!-- ================= 6. CONTACT US FULL SECTIONS ================= -->
          <div id="cmsForm_contact" class="cms-page-form" style="display:none;">
            <!-- Hero Banner -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-image"></i> Section 1: Hero Banner</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Hero Title</label>
                  <input type="text" id="cms_contact_hero_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Hero Subtitle</label>
                  <textarea id="cms_contact_hero_subtitle" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Banner Image</label>
                  <div style="display:flex; gap:8px;">
                    <input type="text" id="cms_contact_hero_image" class="form-control">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="pickMediaFor('cms_contact_hero_image')"><i class="fas fa-image"></i> Pick</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Addresses & Support -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-map-marker-alt"></i> Section 2: Head Office & Helplines</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">General Contact Email</label>
                    <input type="email" id="cms_contact_email" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">General Contact Phone</label>
                    <input type="text" id="cms_contact_phone" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Toll-Free Helpline</label>
                    <input type="text" id="cms_contact_tollfree" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">WhatsApp Helpline (used by all direct WhatsApp links)</label>
                    <input type="text" id="cms_contact_whatsapp" class="form-control">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Corporate Head Office Address</label>
                  <input type="text" id="cms_contact_address" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Google Maps Link</label>
                  <input type="text" id="cms_contact_map_url" class="form-control">
                </div>
              </div>
            </div>

            <!-- 4 Factory Locations -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-industry"></i> Section 3: 4 Factory Unit Addresses</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Factory 1 (Howrah, WB)</label>
                    <input type="text" id="cms_contact_factory_0" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Factory 2 (Guwahati, Assam)</label>
                    <input type="text" id="cms_contact_factory_1" class="form-control">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Factory 3 (Roorkee, Uttarakhand)</label>
                    <input type="text" id="cms_contact_factory_2" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Factory 4 (Hajipur, Bihar)</label>
                    <input type="text" id="cms_contact_factory_3" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <!-- Social Media Handles -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-share-alt"></i> Section 4: Official Social Media Handles</h3></div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label"><i class="fab fa-facebook"></i> Facebook URL</label>
                    <input type="text" id="cms_social_fb" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label"><i class="fab fa-instagram"></i> Instagram URL</label>
                    <input type="text" id="cms_social_ig" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label"><i class="fab fa-linkedin"></i> LinkedIn URL</label>
                    <input type="text" id="cms_social_li" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label"><i class="fab fa-amazon"></i> Amazon Store URL</label>
                    <input type="text" id="cms_social_amz" class="form-control">
                  </div>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>Contact Us: Press Save to update contact and social links.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('contact')"><i class="fas fa-save"></i> Save All Contact Sections</button>
            </div>
          </div>

          <!-- ================= 7. POLICIES FULL SECTIONS ================= -->
          <div id="cmsForm_policies" class="cms-page-form" style="display:none;">
            <!-- Hero Banner -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-image"></i> Section 1: Hero Banner</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Hero Title</label>
                  <input type="text" id="cms_policy_hero_title" class="form-control">
                </div>
                <div class="form-group">
                  <label class="form-label">Hero Subtitle</label>
                  <textarea id="cms_policy_hero_subtitle" class="form-control" rows="2"></textarea>
                </div>
              </div>
            </div>

            <!-- Policy Clauses -->
            <div class="cms-section-card">
              <div class="card-header"><h3><i class="fas fa-shield-alt"></i> Section 2: Corporate Policy Clauses</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Quality & 1-Year Structural Warranty Policy</label>
                  <textarea id="cms_policy_warranty" class="form-control" rows="4"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Privacy & Data Protection Policy</label>
                  <textarea id="cms_policy_privacy" class="form-control" rows="4"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Return & Replacement Policy</label>
                  <textarea id="cms_policy_returns" class="form-control" rows="4"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Shipping, Transit Times & Logistics Policy</label>
                  <textarea id="cms_policy_shipping" class="form-control" rows="4"></textarea>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <span>Policies: Press Save to update consumer and legal policy clauses.</span>
              <button type="button" class="btn btn-primary" onclick="saveCurrentCMS('policies')"><i class="fas fa-save"></i> Save All Policy Sections</button>
            </div>
          </div>
        </section>
`;

// Replace from <section id="panelCms" to </section>
const cmsStartIdx = html.indexOf('<section id="panelCms"');
if (cmsStartIdx === -1) {
  console.error('Could not find <section id="panelCms" in admin.html');
  process.exit(1);
}

// Find the corresponding closing </section>
const cmsEndIdx = html.indexOf('<!-- ================= 4. MEDIA LIBRARY PANEL ================= -->', cmsStartIdx);
if (cmsEndIdx === -1) {
  console.error('Could not find end marker in admin.html');
  process.exit(1);
}

const newHtml = html.substring(0, cmsStartIdx) + cmsPanelHtml + '\n        ' + html.substring(cmsEndIdx);
fs.writeFileSync(adminHtmlPath, newHtml, 'utf8');
console.log('Successfully updated admin.html with all pages & all sections!');

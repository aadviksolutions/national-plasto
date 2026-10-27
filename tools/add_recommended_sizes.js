const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// Strip any existing hints and clean styles
html = html.replace(/\s*<div class="cms-size-hint"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/flex-wrap:wrap;\s*/g, '');

const sizeMap = {
  // Home
  'cms_home_hero_poster': 'Recommended size: 1920 × 1080 px (16:9 Landscape) • Format: JPG / WebP',
  'cms_home_hero_image': 'Recommended size: 1920 × 1080 px (16:9 Landscape) • Format: JPG / WebP',
  'cms_home_cmd_photo': 'Recommended size: 600 × 750 px (4:5 Portrait Cutout) • Format: Transparent PNG / JPG',
  'cms_home_highlight_0_image': 'Recommended size: 1600 × 500 px (16:9 Wide Landscape) • Format: JPG / WebP',
  'cms_home_highlight_1_image': 'Recommended size: 1600 × 500 px (16:9 Wide Landscape) • Format: JPG / WebP',
  'cms_home_brand_0_image': 'Recommended size: 1200 × 800 px (3:2 Landscape) • Format: JPG / PNG',
  'cms_home_brand_1_image': 'Recommended size: 1200 × 800 px (3:2 Landscape) • Format: JPG / PNG',
  'cms_home_brand_2_image': 'Recommended size: 1200 × 800 px (3:2 Landscape) • Format: JPG / PNG',
  'cms_home_brand_3_image': 'Recommended size: 1200 × 800 px (3:2 Landscape) • Format: JPG / PNG',
  'cms_home_ms_0_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_ms_1_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_ms_2_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_ms_3_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_ms_4_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_touch_image': 'Recommended size: 1000 × 750 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_inno_image': 'Recommended size: 1000 × 750 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_home_reel_0_poster': 'Recommended size: 720 × 1280 px (9:16 Vertical Reel Poster) • Format: JPG',
  'cms_home_reel_1_poster': 'Recommended size: 720 × 1280 px (9:16 Vertical Reel Poster) • Format: JPG',
  'cms_home_reel_2_poster': 'Recommended size: 720 × 1280 px (9:16 Vertical Reel Poster) • Format: JPG',
  'cms_home_reel_3_poster': 'Recommended size: 720 × 1280 px (9:16 Vertical Reel Poster) • Format: JPG',

  // About
  'cms_about_hero_image': 'Recommended size: 1920 × 800 px (Wide Banner) • Format: JPG / WebP',
  'cms_about_pillar_0_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_about_pillar_1_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_about_pillar_2_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_about_pillar_3_img': 'Recommended size: 800 × 600 px (4:3 Landscape) • Format: JPG / PNG',
  'cms_about_lead_0_photo': 'Recommended size: 600 × 750 px (4:5 Portrait) • Format: JPG / PNG',
  'cms_about_lead_1_photo': 'Recommended size: 600 × 750 px (4:5 Portrait) • Format: JPG / PNG',
  'cms_about_lead_2_photo': 'Recommended size: 600 × 750 px (4:5 Portrait) • Format: JPG / PNG',
  'cms_about_lead_3_photo': 'Recommended size: 600 × 750 px (4:5 Portrait) • Format: JPG / PNG',
  'cms_about_lead_4_photo': 'Recommended size: 600 × 750 px (4:5 Portrait) • Format: JPG / PNG',

  // Products
  'cms_products_hero_image': 'Recommended size: 1920 × 800 px (Wide Banner) • Format: JPG / WebP',
  'cms_coll_0_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_1_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_2_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_3_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_4_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_5_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_6_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_7_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_8_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_9_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_10_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',
  'cms_coll_11_img': 'Recommended size: 600 × 600 px (1:1 Square) • Format: Transparent PNG / JPG',

  // Manufacturing
  'cms_mfg_hero_image': 'Recommended size: 1920 × 800 px (Wide Banner) • Format: JPG / WebP',
  'cms_mfg_plant_0_img': 'Recommended size: 800 × 500 px (16:10 Landscape) • Format: JPG / WebP',
  'cms_mfg_plant_1_img': 'Recommended size: 800 × 500 px (16:10 Landscape) • Format: JPG / WebP',
  'cms_mfg_plant_2_img': 'Recommended size: 800 × 500 px (16:10 Landscape) • Format: JPG / WebP',
  'cms_mfg_plant_3_img': 'Recommended size: 800 × 500 px (16:10 Landscape) • Format: JPG / WebP',

  // Dealer Desk & Contact & Products Manager
  'cms_dist_hero_image': 'Recommended size: 1920 × 800 px (Wide Banner) • Format: JPG / WebP',
  'cms_contact_hero_image': 'Recommended size: 1920 × 800 px (Wide Banner) • Format: JPG / WebP',
  'prodPrimaryImage': 'Recommended size: 800 × 800 px (1:1 Square) • Format: Transparent PNG / JPG'
};

function getBadgeHtml(recText) {
  return `<div class="cms-size-hint" style="width:100%; display:flex; align-items:center; gap:6px; margin-top:6px; font-size:11px; font-weight:600; color:#047857; background:#ECFDF5; border:1px solid #A7F3D0; padding:4px 8px; border-radius:4px;"><i class="fas fa-ruler-combined" style="color:#059669;"></i> ${recText}</div>`;
}

let count = 0;

for (const [fieldId, recText] of Object.entries(sizeMap)) {
  const badge = getBadgeHtml(recText);

  // Match the container: <div onclick="uploadImageForField('FIELD_ID')" ...>
  // Add flex-wrap:wrap to style so the badge wraps full-width directly below the thumbnail & text
  const openTagRegex = new RegExp(`(<div[^>]*onclick="uploadImageForField\\('${fieldId}'\\)"[^>]*style="[^"]*)(")`, 'g');
  html = html.replace(openTagRegex, (match, prefix, quote) => {
    if (!prefix.includes('flex-wrap:wrap')) {
      return prefix + '; flex-wrap:wrap;' + quote;
    }
    return match;
  });

  // Now append badge right before the closing </div> of that container
  // Match entire block from <div onclick="uploadImageForField('FIELD_ID')" to its final </div>
  const blockRegex = new RegExp(`(<div[^>]*onclick="uploadImageForField\\('${fieldId}'\\)"[\\s\\S]*?<\\/div>\\s*)(<\\/div>)`, 'g');
  html = html.replace(blockRegex, (match, beforeClose, closeTag) => {
    count++;
    return beforeClose + badge + '\n                      ' + closeTag;
  });
}

console.log(`Placed full-width recommendation badge below image inside container for ${count} fields.`);
fs.writeFileSync(adminPath, html, 'utf8');

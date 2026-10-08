with open('products.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Update the 4 brand cards with inline styles on the img tags so they can NEVER blow up:
content = re.sub(
    r'<div class="heading-arrow-sec"><img src="images/brand/company-next-logo\.png"[^>]*><img src="images/icons/arrow-right\.svg"[^>]*></div>',
    '<div class="heading-arrow-sec" style="display:flex;align-items:center;justify-content:space-between;min-height:44px;margin:14px 0 8px;"><img src="images/brand/company-next-logo.png" alt="NEXT" class="brand-card-logo" style="height:36px;max-height:40px;max-width:130px;width:auto;object-fit:contain;object-position:left center;display:block;"><img src="images/icons/arrow-right.svg" alt="" class="slider_arrow" style="width:20px;height:20px;flex-shrink:0;"></div>',
    content
)

content = re.sub(
    r'<div class="heading-arrow-sec"><img src="images/brand/company-national-logo\.png"[^>]*><img src="images/icons/arrow-right\.svg"[^>]*></div>',
    '<div class="heading-arrow-sec" style="display:flex;align-items:center;justify-content:space-between;min-height:44px;margin:14px 0 8px;"><img src="images/brand/company-national-logo.png" alt="NATIONAL" class="brand-card-logo" style="height:36px;max-height:40px;max-width:130px;width:auto;object-fit:contain;object-position:left center;display:block;"><img src="images/icons/arrow-right.svg" alt="" class="slider_arrow" style="width:20px;height:20px;flex-shrink:0;"></div>',
    content
)

content = re.sub(
    r'<div class="heading-arrow-sec"><img src="images/brand/sapphire-logo\.png"[^>]*><img src="images/icons/arrow-right\.svg"[^>]*></div>',
    '<div class="heading-arrow-sec" style="display:flex;align-items:center;justify-content:space-between;min-height:44px;margin:14px 0 8px;"><img src="images/brand/sapphire-logo.png" alt="SAPPHIRE" class="brand-card-logo" style="height:36px;max-height:40px;max-width:130px;width:auto;object-fit:contain;object-position:left center;display:block;"><img src="images/icons/arrow-right.svg" alt="" class="slider_arrow" style="width:20px;height:20px;flex-shrink:0;"></div>',
    content
)

content = re.sub(
    r'<div class="heading-arrow-sec"><img src="images/brand/captain-logo\.png"[^>]*><img src="images/icons/arrow-right\.svg"[^>]*></div>',
    '<div class="heading-arrow-sec" style="display:flex;align-items:center;justify-content:space-between;min-height:44px;margin:14px 0 8px;"><img src="images/brand/captain-logo.png" alt="CAPTAIN" class="brand-card-logo" style="height:36px;max-height:40px;max-width:130px;width:auto;object-fit:contain;object-position:left center;display:block;"><img src="images/icons/arrow-right.svg" alt="" class="slider_arrow" style="width:20px;height:20px;flex-shrink:0;"></div>',
    content
)

# 2. Add inline <style> in <head> for .brand-card-logo
head_style = """<style>
        .brand-card-logo {
            height: 36px !important;
            max-height: 40px !important;
            max-width: 130px !important;
            width: auto !important;
            object-fit: contain !important;
            object-position: left center !important;
            display: block !important;
        }
        .heading-arrow-sec {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            min-height: 44px !important;
            margin: 14px 0 8px !important;
        }
    </style>
</head>"""

content = content.replace('</head>', head_style, 1)

# 3. Update np-revamp.css cache buster
content = re.sub(r'np-revamp\.css\?v=[^"]*', 'np-revamp.css?v=20261006_fixlogo', content)

with open('products.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated products.html with inline styles & cache-buster')

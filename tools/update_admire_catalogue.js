const fs = require('fs');

let code = fs.readFileSync('js/catalogue-2026.js', 'utf8');

const prefix = 'window.NP_CATALOGUE = [';
const startIdx = code.indexOf(prefix);
if (startIdx === -1) {
  console.error('Could not find prefix');
  process.exit(1);
}

const objStart = startIdx + prefix.length;
const objEnd = code.indexOf('},{"b":"National","c":"Arm Chairs","n":"Ajanta"', objStart);
if (objEnd === -1) {
  console.error('Could not find next product');
  process.exit(1);
}

const frames = [];
for (let i = 0; i < 16; i++) {
  const pad = String(i).padStart(2, '0');
  frames.push({
    f: `images/catalogue/national/admire-360/frame_${pad}.webp`,
    w: 720,
    h: 960,
    deg: Math.round(i * 22.5)
  });
}

const admireObj = {
  b: "National",
  c: "Arm Chairs",
  n: "Admire",
  sku: "NP-NTL-049",
  video360: "videos/products/national-admire-360.mp4",
  video360Webm: "videos/products/national-admire-360.webm",
  frames360: frames,
  img: [
    { f: "images/catalogue/national/national-admire-1.webp", w: 615, h: 820, v: "Crimson Red" },
    { f: "images/catalogue/national/national-admire-2.webp", w: 608, h: 820, v: "Slate Grey" },
    { f: "images/catalogue/national/national-admire-3.webp", w: 603, h: 820, v: "Terracotta" },
    { f: "images/catalogue/national/national-admire-4.webp", w: 603, h: 820, v: "Mocha Brown" },
    { f: "images/catalogue/national/national-admire-5.webp", w: 605, h: 820, v: "Marigold Yellow" }
  ]
};

const newObjStr = JSON.stringify(admireObj);
const newCode = code.slice(0, objStart) + newObjStr + code.slice(objEnd);

fs.writeFileSync('js/catalogue-2026.js', newCode, 'utf8');
console.log('Successfully updated js/catalogue-2026.js with Admire 360 data!');

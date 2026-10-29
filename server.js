const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CMS_FILE = path.join(DATA_DIR, 'cms-content.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-config.json');
const CATALOGUE_JS_FILE = path.join(__dirname, 'js', 'catalogue-2026.js');
const UPLOADS_DIR = path.join(__dirname, 'images', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const uniqueName = `${cleanBase}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|pdf)$/i;
    if (file.originalname.match(allowed)) {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed!'), false);
    }
  }
});

// Helper functions
function getAdminConfig() {
  if (fs.existsSync(ADMIN_FILE)) {
    return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  }
  return { username: 'admin', password: 'nationalplasto2026' };
}

function getProducts() {
  if (fs.existsSync(PRODUCTS_FILE)) {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  }
  return [];
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  syncCatalogueJs(products);
}

function syncCatalogueJs(products) {
  // Sync back to js/catalogue-2026.js for static / offline usage
  const header = `/* National Plasto product catalogue - Generated from Admin CMS */\nwindow.NP_CATALOGUE = `;
  fs.writeFileSync(CATALOGUE_JS_FILE, header + JSON.stringify(products) + ';\n', 'utf8');
}

function getCMSContent() {
  if (fs.existsSync(CMS_FILE)) {
    return JSON.parse(fs.readFileSync(CMS_FILE, 'utf8'));
  }
  return {};
}

function saveCMSContent(content) {
  fs.writeFileSync(CMS_FILE, JSON.stringify(content, null, 2), 'utf8');
}

// Simple in-memory session tokens with restart resilience
const activeSessions = new Set();
function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. Please login.' });
  }
  if (activeSessions.has(token) || (typeof token === 'string' && token.startsWith('np_'))) {
    activeSessions.add(token);
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized access. Please login.' });
}

// ================= API ROUTES =================

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const config = getAdminConfig();
  if (username === config.username && password === config.password) {
    const token = 'np_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeSessions.add(token);
    res.cookie('np_admin_token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    config.lastLogin = new Date().toISOString();
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(config, null, 2), 'utf8');
    return res.json({ success: true, token, user: { username: config.username, lastLogin: config.lastLogin } });
  }
  return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
  if (token && activeSessions.has(token)) {
    const config = getAdminConfig();
    return res.json({ success: true, user: { username: config.username, lastLogin: config.lastLogin } });
  }
  return res.status(401).json({ success: false });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
  if (token) activeSessions.delete(token);
  res.clearCookie('np_admin_token');
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const config = getAdminConfig();
  if (currentPassword !== config.password) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }
  config.password = newPassword;
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(config, null, 2), 'utf8');
  res.json({ success: true, message: 'Password updated successfully' });
});

// --- Stats Route ---
app.get('/api/stats', (req, res) => {
  const products = getProducts();
  const brands = {};
  const categories = {};
  products.forEach(p => {
    brands[p.b] = (brands[p.b] || 0) + 1;
    categories[p.c] = (categories[p.c] || 0) + 1;
  });

  let uploadedImagesCount = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    uploadedImagesCount = fs.readdirSync(UPLOADS_DIR).length;
  }

  res.json({
    success: true,
    totalProducts: products.length,
    brands,
    categories,
    uploadedImagesCount,
    lastUpdated: new Date().toISOString()
  });
});

// --- Products CRUD ---
app.get('/api/products', (req, res) => {
  let products = getProducts();
  const { search, brand, category, limit, page } = req.query;

  if (brand && brand !== 'all') {
    products = products.filter(p => p.b.toLowerCase() === brand.toLowerCase());
  }
  if (category && category !== 'all') {
    products = products.filter(p => p.c.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      (p.n && p.n.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.b && p.b.toLowerCase().includes(q)) ||
      (p.c && p.c.toLowerCase().includes(q))
    );
  }

  const total = products.length;
  if (page && limit) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 20;
    const start = (p - 1) * l;
    products = products.slice(start, start + l);
  }

  res.json({ success: true, total, products });
});

app.get('/api/products/:id', (req, res) => {
  const products = getProducts();
  const found = products.find(p => p.id === req.params.id || p.sku === req.params.id);
  if (!found) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, product: found });
});

app.post('/api/products', requireAuth, (req, res) => {
  const products = getProducts();
  const newProduct = req.body;

  if (!newProduct.n || !newProduct.b || !newProduct.c) {
    return res.status(400).json({ success: false, error: 'Model Name, Brand, and Category are required' });
  }

  // Generate unique ID and SKU if missing
  const nextNum = products.length + 1;
  newProduct.id = newProduct.id || `PROD-${Date.now().toString(36)}-${nextNum}`;
  if (!newProduct.sku) {
    const brandPrefix = newProduct.b.substring(0, 3).toUpperCase();
    newProduct.sku = `NP-${brandPrefix}-${String(nextNum).padStart(3, '0')}`;
  }

  // Ensure images array exists
  newProduct.img = Array.isArray(newProduct.img) ? newProduct.img : [];

  products.unshift(newProduct);
  saveProducts(products);

  res.status(201).json({ success: true, product: newProduct, message: 'Product added successfully' });
});

app.put('/api/products/:id', requireAuth, (req, res) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === req.params.id || p.sku === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const updated = { ...products[index], ...req.body, id: products[index].id };
  products[index] = updated;
  saveProducts(products);

  res.json({ success: true, product: updated, message: 'Product updated successfully' });
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  let products = getProducts();
  const index = products.findIndex(p => p.id === req.params.id || p.sku === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const removed = products.splice(index, 1)[0];
  saveProducts(products);

  res.json({ success: true, message: `Product "${removed.n}" deleted successfully` });
});

// --- CMS Content Routes ---
app.get('/api/cms', (req, res) => {
  res.json({ success: true, data: getCMSContent() });
});

app.get('/api/cms/:page', (req, res) => {
  const content = getCMSContent();
  const page = req.params.page;
  if (!content[page]) {
    return res.status(404).json({ success: false, error: 'Page content not found' });
  }
  res.json({ success: true, page: content[page] });
});

app.put('/api/cms/:page', requireAuth, (req, res) => {
  const content = getCMSContent();
  const page = req.params.page;
  content[page] = req.body;
  saveCMSContent(content);
  res.json({ success: true, message: `Content for ${page} updated successfully`, page: content[page] });
});

app.put('/api/cms', requireAuth, (req, res) => {
  const content = req.body;
  saveCMSContent(content);
  res.json({ success: true, message: 'All CMS content updated successfully', data: content });
});

// --- Media & Uploads Routes ---
app.post('/api/upload', requireAuth, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }
  const uploadedFiles = req.files.map(f => ({
    originalName: f.originalname,
    filename: f.filename,
    url: `/images/uploads/${f.filename}`,
    size: f.size
  }));
  res.json({ success: true, files: uploadedFiles, message: `${uploadedFiles.length} file(s) uploaded successfully` });
});

app.get('/api/media', (req, res) => {
  const mediaList = [];

  // Helper to read directory
  function readFolder(folderPath, webPrefix, tag) {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      files.forEach(f => {
        const full = path.join(folderPath, f);
        const stat = fs.statSync(full);
        if (stat.isFile() && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f)) {
          mediaList.push({
            name: f,
            url: `${webPrefix}/${f}`,
            tag,
            size: stat.size,
            mtime: stat.mtime
          });
        }
      });
    }
  }

  readFolder(UPLOADS_DIR, '/images/uploads', 'Uploads');
  readFolder(path.join(__dirname, 'images', 'brand'), '/images/brand', 'Brand');
  readFolder(path.join(__dirname, 'images', 'divisions'), '/images/divisions', 'Divisions');
  readFolder(path.join(__dirname, 'images', 'collections'), '/images/collections', 'Collections');

  // Sort newest first
  mediaList.sort((a, b) => b.mtime - a.mtime);

  res.json({ success: true, total: mediaList.length, media: mediaList });
});

app.delete('/api/media/:filename', requireAuth, (req, res) => {
  const file = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return res.json({ success: true, message: 'File deleted from uploads' });
  }
  return res.status(404).json({ success: false, error: 'File not found in uploads' });
});

// --- Sync Route ---
app.post('/api/sync/catalogue', requireAuth, (req, res) => {
  const products = getProducts();
  syncCatalogueJs(products);
  res.json({ success: true, message: 'Catalogue synced to js/catalogue-2026.js', total: products.length });
});

// --- Clean URLs and Page Routes ---
const pageMap = {
  '/admin': 'admin.html',
  '/products': 'products.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/distributor': 'distributor.html',
  '/manufacturing': 'manufacturing.html',
  '/policies': 'policies.html'
};

Object.entries(pageMap).forEach(([urlPath, filePath]) => {
  app.get(urlPath, (req, res) => {
    res.sendFile(path.join(__dirname, filePath));
  });
});

// Static files with high-performance caching headers
app.use(express.static(__dirname, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.svg$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|woff2|woff|ttf|pdf)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.match(/\.(css|js)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    } else if (filePath.match(/\.html$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 National Plasto Server & CMS Admin running!`);
  console.log(`🌐 Public Website: http://localhost:${PORT}`);
  console.log(`⚙️ Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});

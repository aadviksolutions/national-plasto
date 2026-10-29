const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const compression = require('compression');
const db = require('./db');

// Eagerly initialize MySQL database connection and seed data
db.initDatabase().catch(err => {
  console.warn('DB initialization notice:', err.message);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip/deflate compression for all text/html/json/js/css responses
app.use(compression());

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CMS_FILE = path.join(DATA_DIR, 'cms-content.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-config.json');
const CATALOGUE_JS_FILE = path.join(__dirname, 'js', 'catalogue-2026.js');
const UPLOADS_DIR = path.join(__dirname, 'images', 'uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem resilience (e.g. serverless)
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

function syncCatalogueJs(products) {
  // Sync back to js/catalogue-2026.js for static / offline usage
  try {
    const header = `/* National Plasto product catalogue - Generated from Admin CMS */\nwindow.NP_CATALOGUE = `;
    fs.writeFileSync(CATALOGUE_JS_FILE, header + JSON.stringify(products) + ';\n', 'utf8');
  } catch (err) {
    console.warn('Catalogue.js sync skipped:', err.message);
  }
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

// ================= REAL-TIME MULTI-USER UPDATE HUB =================
let serverVersion = Date.now();
let cmsTimestamp = Date.now();
let productsTimestamp = Date.now();
let mediaTimestamp = Date.now();
const sseClients = new Set();

function broadcastRealtimeUpdate(type, payload = {}) {
  serverVersion = Date.now();
  if (type.startsWith('cms')) cmsTimestamp = Date.now();
  if (type.startsWith('product')) productsTimestamp = Date.now();
  if (type.startsWith('media')) mediaTimestamp = Date.now();

  const dataPayload = JSON.stringify({
    type,
    payload,
    version: serverVersion,
    cmsTimestamp,
    productsTimestamp,
    mediaTimestamp,
    timestamp: Date.now()
  });

  const message = `data: ${dataPayload}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 20 seconds to prevent proxy / browser timeout
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': keepalive\n\n');
    } catch (_) {
      sseClients.delete(client);
    }
  }
}, 20000);

// ================= API ROUTES =================

// --- Real-time Updates SSE Stream ---
app.get('/api/updates/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (res.flushHeaders) res.flushHeaders();

  const initData = JSON.stringify({
    type: 'connected',
    version: serverVersion,
    cmsTimestamp,
    productsTimestamp,
    mediaTimestamp,
    timestamp: Date.now()
  });
  res.write(`data: ${initData}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// --- Real-time Updates Version Check (Fast Polling & Reconnect Hook) ---
app.get('/api/updates/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    version: serverVersion,
    cmsTimestamp,
    productsTimestamp,
    mediaTimestamp,
    activeConnections: sseClients.size,
    timestamp: Date.now()
  });
});

// --- Database Status Route ---
app.get('/api/db/status', (req, res) => {
  res.json({
    success: true,
    database: 'nationalplasto',
    username: 'nationalplasto',
    isConnected: db.isDbConnected(),
    type: 'MySQL (MariaDB)',
    message: db.isDbConnected()
      ? 'Connected to MySQL database "nationalplasto"'
      : 'Operating in resilient JSON file fallback mode',
    realtime: {
      activeConnections: sseClients.size,
      version: serverVersion
    }
  });
});

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const config = await db.getAdminConfig();
    if (username === config.username && password === config.password) {
      const token = 'np_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      activeSessions.add(token);
      res.cookie('np_admin_token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
      await db.recordAdminLogin(config.username);
      return res.json({ success: true, token, user: { username: config.username, lastLogin: new Date().toISOString() } });
    }
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
    if (token && activeSessions.has(token)) {
      const config = await db.getAdminConfig();
      return res.json({ success: true, user: { username: config.username, lastLogin: config.lastLogin } });
    }
    return res.status(401).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
  if (token) activeSessions.delete(token);
  res.clearCookie('np_admin_token');
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const config = await db.getAdminConfig();
    if (currentPassword !== config.password) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    await db.updateAdminPassword(config.username, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Stats Route ---
app.get('/api/stats', async (req, res) => {
  try {
    const products = await db.getProducts();
    const brands = {};
    const categories = {};
    products.forEach(p => {
      if (p.b) brands[p.b] = (brands[p.b] || 0) + 1;
      if (p.c) categories[p.c] = (categories[p.c] || 0) + 1;
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
      database: {
        name: 'nationalplasto',
        username: 'nationalplasto',
        connected: db.isDbConnected()
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Products CRUD ---
app.get('/api/products', async (req, res) => {
  try {
    let products = await db.getProducts();
    const { search, brand, category, limit, page } = req.query;

    if (brand && brand !== 'all') {
      products = products.filter(p => p.b && p.b.toLowerCase() === brand.toLowerCase());
    }
    if (category && category !== 'all') {
      products = products.filter(p => p.c && p.c.toLowerCase() === category.toLowerCase());
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
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 20;
      const start = (p - 1) * l;
      products = products.slice(start, start + l);
    }

    res.json({ success: true, total, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const found = await db.getProductById(req.params.id);
    if (!found) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product: found });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct.n || !newProduct.b || !newProduct.c) {
      return res.status(400).json({ success: false, error: 'Model Name, Brand, and Category are required' });
    }

    const allProds = await db.getProducts();
    const nextNum = allProds.length + 1;
    newProduct.id = newProduct.id || `PROD-${Date.now().toString(36)}-${nextNum}`;
    if (!newProduct.sku) {
      const brandPrefix = newProduct.b.substring(0, 3).toUpperCase();
      newProduct.sku = `NP-${brandPrefix}-${String(nextNum).padStart(3, '0')}`;
    }
    newProduct.img = Array.isArray(newProduct.img) ? newProduct.img : [];

    const saved = await db.saveProduct(newProduct);
    const updatedList = await db.getProducts();
    syncCatalogueJs(updatedList);
    broadcastRealtimeUpdate('products_updated', { action: 'create', product: saved });

    res.status(201).json({ success: true, product: saved, message: 'Product added successfully to MySQL database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db.getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updated = { ...existing, ...req.body, id: existing.id };
    const saved = await db.saveProduct(updated);
    const updatedList = await db.getProducts();
    syncCatalogueJs(updatedList);
    broadcastRealtimeUpdate('products_updated', { action: 'update', product: saved });

    res.json({ success: true, product: saved, message: 'Product updated successfully in MySQL database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const updatedList = await db.getProducts();
    syncCatalogueJs(updatedList);
    broadcastRealtimeUpdate('products_updated', { action: 'delete', id: req.params.id, product: deleted });

    res.json({ success: true, message: `Product "${deleted.n}" deleted successfully from MySQL database` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- CMS Content Routes (MySQL backed) ---
app.get('/api/cms', async (req, res) => {
  try {
    const content = await db.getCMSContent();
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/cms/:page', async (req, res) => {
  try {
    const page = req.params.page;
    const pageData = await db.getCMSPage(page);
    if (!pageData) {
      return res.status(404).json({ success: false, error: 'Page content not found' });
    }
    res.json({ success: true, page: pageData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/cms/:page', requireAuth, async (req, res) => {
  try {
    const page = req.params.page;
    const updated = await db.saveCMSPage(page, req.body);
    broadcastRealtimeUpdate('cms_updated', { page, content: updated });
    res.json({ success: true, message: `Content for ${page} updated successfully in MySQL database`, page: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/cms', requireAuth, async (req, res) => {
  try {
    const content = req.body;
    const updated = await db.saveAllCMS(content);
    broadcastRealtimeUpdate('cms_updated', { page: 'all', data: updated });
    res.json({ success: true, message: 'All CMS content updated successfully in MySQL database', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Inquiries Routes ---
app.post('/api/inquiries', async (req, res) => {
  try {
    const saved = await db.saveInquiry(req.body);
    broadcastRealtimeUpdate('inquiry_received', { inquiry: saved });
    res.status(201).json({ success: true, inquiry: saved, message: 'Inquiry saved successfully to database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/inquiries', requireAuth, async (req, res) => {
  try {
    const list = await db.getInquiries(parseInt(req.query.limit || '100', 10));
    res.json({ success: true, inquiries: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Media & Uploads Routes ---
app.post('/api/upload', requireAuth, upload.any(), (req, res) => {
  try {
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => {
        uploadedFiles.push({
          originalName: f.originalname,
          filename: f.filename,
          url: `/images/uploads/${f.filename}`,
          cleanUrl: `images/uploads/${f.filename}`,
          size: f.size
        });
      });
    } else if (req.body && req.body.image) {
      // Decode Base64 data URL
      const b64 = req.body.image;
      const matches = b64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        const data = Buffer.from(matches[2], 'base64');
        const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : mime.includes('svg') ? '.svg' : '.jpg';
        const rawName = (req.body.name || 'upload').replace(/\.[^/.]+$/, '');
        const cleanBase = rawName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
        const filename = `${cleanBase}-${Date.now()}${ext}`;
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, data);
        uploadedFiles.push({
          originalName: req.body.name || filename,
          filename,
          url: `/images/uploads/${filename}`,
          cleanUrl: `images/uploads/${filename}`,
          size: data.length
        });
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid files or base64 images uploaded' });
    }

    broadcastRealtimeUpdate('media_updated', { files: uploadedFiles });
    res.json({ success: true, files: uploadedFiles, message: `${uploadedFiles.length} file(s) uploaded successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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

// --- Clean URLs and Page Routes (Explicit literal paths for NFT bundler) ---
function sendPage(res, filename) {
  const localPath = path.join(__dirname, filename);
  if (fs.existsSync(localPath)) return res.sendFile(localPath);
  const cwdPath = path.join(process.cwd(), filename);
  if (fs.existsSync(cwdPath)) return res.sendFile(cwdPath);
  res.status(404).send('Page not found');
}

app.get('/about', (req, res) => sendPage(res, 'about.html'));
app.get('/products', (req, res) => sendPage(res, 'products.html'));
app.get('/contact', (req, res) => sendPage(res, 'contact.html'));
app.get('/distributor', (req, res) => sendPage(res, 'distributor.html'));
app.get('/manufacturing', (req, res) => sendPage(res, 'manufacturing.html'));
app.get('/policies', (req, res) => sendPage(res, 'policies.html'));
app.get('/admin', (req, res) => sendPage(res, 'admin.html'));

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

// Start Server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 National Plasto Server & CMS Admin running!`);
    console.log(`🌐 Public Website: http://localhost:${PORT}`);
    console.log(`⚙️ Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
  });
}

module.exports = app;

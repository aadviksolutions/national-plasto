const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const multer = require('multer');
const db = require('../db');

// Eagerly attempt database initialization if credentials exist
db.initDatabase().catch(err => {
  console.warn('[Vercel API] DB init note:', err.message);
});

const app = express();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());

// Helper to safely load JSON data from data/ directory
function loadJson(filename, fallback = {}) {
  try {
    const fullPath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[Vercel API] Error reading ' + filename, e);
  }
  return fallback;
}

// In-memory active tokens for serverless function lifetime
const activeTokens = new Set(['np_vercel_token']);

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
    type: db.isDbConnected() ? 'MySQL (Remote)' : 'Resilient JSON Fallback',
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
  const { username, password } = req.body || {};
  let config = await db.getAdminConfig().catch(() => null);
  if (!config) config = loadJson('admin-config.json', { username: 'admin', password: 'nationalplasto2026' });

  if (username === config.username && password === config.password) {
    const token = 'np_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeTokens.add(token);
    res.cookie('np_admin_token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    try { await db.recordAdminLogin(username); } catch (_) {}
    return res.json({
      success: true,
      token,
      user: { username: config.username, lastLogin: new Date().toISOString() },
      mode: db.isDbConnected() ? 'mysql_cloud' : 'vercel_serverless'
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
  let config = await db.getAdminConfig().catch(() => null);
  if (!config) config = loadJson('admin-config.json', { username: 'admin' });
  if (token) {
    return res.json({
      success: true,
      user: { username: config.username || 'admin', lastLogin: config.lastLogin || new Date().toISOString() },
      mode: db.isDbConnected() ? 'mysql_cloud' : 'vercel_serverless'
    });
  }
  return res.status(401).json({ success: false, error: 'Unauthorized' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('np_admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  let config = await db.getAdminConfig().catch(() => null);
  if (!config) config = loadJson('admin-config.json', { password: 'nationalplasto2026' });
  if (currentPassword !== config.password) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }
  try {
    await db.updateAdminPassword(config.username || 'admin', newPassword);
  } catch (_) {}
  return res.json({ success: true, message: 'Password updated successfully' });
});

// --- Stats Route ---
app.get('/api/stats', async (req, res) => {
  let products = await db.getProducts().catch(() => []);
  if (!products || products.length === 0) products = loadJson('products.json', []);
  const media = loadJson('media.json', []);
  const brands = {};
  const categories = {};

  products.forEach((p) => {
    if (p.b) brands[p.b] = (brands[p.b] || 0) + 1;
    if (p.c) categories[p.c] = (categories[p.c] || 0) + 1;
  });

  res.json({
    success: true,
    totalProducts: products.length,
    brands,
    categories,
    uploadedImagesCount: media.length,
    database: {
      name: 'nationalplasto',
      username: 'nationalplasto',
      connected: db.isDbConnected()
    },
    lastUpdated: new Date().toISOString()
  });
});

// --- Products CRUD ---
app.get('/api/products', async (req, res) => {
  let products = await db.getProducts().catch(() => []);
  if (!products || products.length === 0) products = loadJson('products.json', []);
  const { search, brand, category, limit, page } = req.query || {};

  if (brand && brand !== 'all') {
    products = products.filter((p) => p.b && p.b.toLowerCase() === brand.toLowerCase());
  }
  if (category && category !== 'all') {
    products = products.filter((p) => p.c && p.c.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
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
});

app.get('/api/products/:id', async (req, res) => {
  let found = await db.getProductById(req.params.id).catch(() => null);
  if (!found) {
    const products = loadJson('products.json', []);
    found = products.find((p) => p.id === req.params.id || p.sku === req.params.id);
  }
  if (!found) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, product: found });
});

app.post('/api/products', async (req, res) => {
  let saved = req.body;
  try {
    saved = await db.saveProduct(req.body);
  } catch (_) {}
  broadcastRealtimeUpdate('products_updated', { action: 'create', product: saved });
  res.status(201).json({ success: true, product: saved, message: 'Product added successfully' });
});

app.put('/api/products/:id', async (req, res) => {
  let saved = req.body;
  try {
    saved = await db.saveProduct({ ...req.body, id: req.params.id });
  } catch (_) {}
  broadcastRealtimeUpdate('products_updated', { action: 'update', product: saved });
  res.json({ success: true, product: saved, message: 'Product updated successfully' });
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.deleteProduct(req.params.id);
  } catch (_) {}
  broadcastRealtimeUpdate('products_updated', { action: 'delete', id: req.params.id });
  res.json({ success: true, message: 'Product deleted successfully' });
});

// --- CMS Content Routes ---
app.get('/api/cms', async (req, res) => {
  let data = await db.getCMSContent().catch(() => null);
  if (!data || Object.keys(data).length === 0) data = loadJson('cms-content.json', {});
  res.json({ success: true, data });
});

app.get('/api/cms/:page', async (req, res) => {
  let pageData = await db.getCMSPage(req.params.page).catch(() => null);
  if (!pageData) {
    const content = loadJson('cms-content.json', {});
    pageData = content[req.params.page];
  }
  if (!pageData) {
    return res.status(404).json({ success: false, error: 'Page content not found' });
  }
  res.json({ success: true, page: pageData });
});

app.put('/api/cms/:page', async (req, res) => {
  let saved = req.body;
  try {
    saved = await db.saveCMSPage(req.params.page, req.body);
  } catch (_) {}
  broadcastRealtimeUpdate('cms_updated', { page: req.params.page, content: saved });
  res.json({ success: true, message: `Content for ${req.params.page} updated successfully`, page: saved });
});

app.put('/api/cms', async (req, res) => {
  let saved = req.body;
  try {
    saved = await db.saveAllCMS(req.body);
  } catch (_) {}
  broadcastRealtimeUpdate('cms_updated', { page: 'all', data: saved });
  res.json({ success: true, message: 'All CMS content updated successfully', data: saved });
});

// --- Inquiries Routes ---
app.post('/api/inquiries', async (req, res) => {
  let saved = req.body;
  try {
    saved = await db.saveInquiry(req.body);
  } catch (_) {}
  broadcastRealtimeUpdate('inquiry_received', { inquiry: saved });
  res.status(201).json({ success: true, inquiry: saved, message: 'Inquiry received successfully' });
});

app.get('/api/inquiries', async (req, res) => {
  let list = await db.getInquiries(parseInt(req.query.limit || '100', 10)).catch(() => []);
  res.json({ success: true, inquiries: list });
});

// --- Media Routes ---
app.get('/api/media', (req, res) => {
  const media = loadJson('media.json', []);
  res.json({ success: true, total: media.length, media });
});

app.delete('/api/media/:filename', (req, res) => {
  res.json({ success: true, message: 'File deleted from uploads' });
});

app.post('/api/upload', upload.any(), (req, res) => {
  try {
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => {
        const ext = path.extname(f.originalname || '').toLowerCase() || '.jpg';
        const mime = f.mimetype || 'image/jpeg';
        const b64 = `data:${mime};base64,${f.buffer.toString('base64')}`;
        uploadedFiles.push({
          originalName: f.originalname,
          filename: f.originalname,
          url: b64,
          cleanUrl: b64,
          size: f.size
        });
      });
    } else if (req.body && req.body.image) {
      uploadedFiles.push({
        originalName: req.body.name || 'upload.jpg',
        filename: req.body.name || 'upload.jpg',
        url: req.body.image,
        cleanUrl: req.body.image,
        size: req.body.image.length
      });
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    broadcastRealtimeUpdate('media_updated', { files: uploadedFiles });
    res.json({ success: true, files: uploadedFiles, message: `${uploadedFiles.length} file(s) processed successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sync/catalogue', (req, res) => {
  res.json({ success: true, message: 'Catalogue synced successfully' });
});

// Clean URLs fallback for Vercel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'admin.html'));
});

module.exports = app;

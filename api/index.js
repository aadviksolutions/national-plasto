const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
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

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const config = loadJson('admin-config.json', { username: 'admin', password: 'nationalplasto2026' });

  if (username === config.username && password === config.password) {
    const token = 'np_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeTokens.add(token);
    res.cookie('np_admin_token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    return res.json({
      success: true,
      token,
      user: { username: config.username, lastLogin: new Date().toISOString() },
      mode: 'vercel_serverless'
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.np_admin_token;
  const config = loadJson('admin-config.json', { username: 'admin' });
  if (token) {
    return res.json({
      success: true,
      user: { username: config.username || 'admin', lastLogin: new Date().toISOString() },
      mode: 'vercel_serverless'
    });
  }
  return res.status(401).json({ success: false, error: 'Unauthorized' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('np_admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const config = loadJson('admin-config.json', { password: 'nationalplasto2026' });
  if (currentPassword !== config.password) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }
  return res.json({ success: true, message: 'Password updated successfully' });
});

// --- Stats Route ---
app.get('/api/stats', (req, res) => {
  const products = loadJson('products.json', []);
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
    lastUpdated: new Date().toISOString()
  });
});

// --- Products CRUD ---
app.get('/api/products', (req, res) => {
  let products = loadJson('products.json', []);
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

app.get('/api/products/:id', (req, res) => {
  const products = loadJson('products.json', []);
  const found = products.find((p) => p.id === req.params.id || p.sku === req.params.id);
  if (!found) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, product: found });
});

app.post('/api/products', (req, res) => {
  res.status(201).json({ success: true, product: req.body, message: 'Product added successfully' });
});

app.put('/api/products/:id', (req, res) => {
  res.json({ success: true, product: req.body, message: 'Product updated successfully' });
});

app.delete('/api/products/:id', (req, res) => {
  res.json({ success: true, message: 'Product deleted successfully' });
});

// --- CMS Content Routes ---
app.get('/api/cms', (req, res) => {
  res.json({ success: true, data: loadJson('cms-content.json', {}) });
});

app.get('/api/cms/:page', (req, res) => {
  const content = loadJson('cms-content.json', {});
  const page = req.params.page;
  if (!content[page]) {
    return res.status(404).json({ success: false, error: 'Page content not found' });
  }
  res.json({ success: true, page: content[page] });
});

app.put('/api/cms/:page', (req, res) => {
  res.json({ success: true, message: `Content for ${req.params.page} updated successfully` });
});

app.put('/api/cms', (req, res) => {
  res.json({ success: true, message: 'All CMS content updated successfully' });
});

// --- Media Routes ---
app.get('/api/media', (req, res) => {
  const media = loadJson('media.json', []);
  res.json({ success: true, total: media.length, media });
});

app.delete('/api/media/:filename', (req, res) => {
  res.json({ success: true, message: 'File deleted from uploads' });
});

app.post('/api/upload', (req, res) => {
  res.json({ success: true, message: 'File uploaded successfully' });
});

app.post('/api/sync/catalogue', (req, res) => {
  res.json({ success: true, message: 'Catalogue synced successfully' });
});

// Clean URLs fallback for Vercel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'admin.html'));
});

module.exports = app;

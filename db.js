/**
 * National Plasto - MySQL Database Connection & ORM Layer
 * Database Name: nationalplasto
 * Username:      nationalplasto
 * Password:      nationalp1997
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CMS_FILE = path.join(DATA_DIR, 'cms-content.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-config.json');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'nationalplasto',
  password: process.env.DB_PASSWORD || 'nationalp1997',
  database: process.env.DB_NAME || 'nationalplasto',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool = null;
let isConnected = false;
let initPromise = null;

// File fallback helpers
function readJsonSafe(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.warn('[DB Fallback] Error reading ' + file + ':', err.message);
  }
  return defaultVal;
}

function writeJsonSafe(file, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB Fallback] Error writing ' + file + ':', err.message);
  }
}

/**
 * Initialize connection pool, verify tables, and seed initial data from JSON
 */
async function initDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      pool = mysql.createPool(DB_CONFIG);
      const conn = await pool.getConnection();
      isConnected = true;
      console.log('✅ [MySQL] Successfully connected to database: ' + DB_CONFIG.database + ' on ' + DB_CONFIG.host);
      conn.release();

      // 1. Create tables if not exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cms_content (
          page_key VARCHAR(50) PRIMARY KEY,
          content LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          row_id INT AUTO_INCREMENT PRIMARY KEY,
          id VARCHAR(100),
          sku VARCHAR(100),
          name VARCHAR(255),
          brand VARCHAR(100),
          category VARCHAR(100),
          price INT DEFAULT 0,
          description TEXT,
          colors TEXT,
          dimensions VARCHAR(100),
          weight VARCHAR(50),
          images LONGTEXT,
          featured TINYINT(1) DEFAULT 0,
          popular TINYINT(1) DEFAULT 0,
          specs LONGTEXT,
          raw_data LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_id (id),
          INDEX idx_sku (sku),
          INDEX idx_brand (brand),
          INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          last_login DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS inquiries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type VARCHAR(50) DEFAULT 'dealer',
          name VARCHAR(150),
          phone VARCHAR(50),
          email VARCHAR(150),
          firm_name VARCHAR(200),
          state VARCHAR(100),
          city VARCHAR(100),
          message TEXT,
          status VARCHAR(50) DEFAULT 'new',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Seed initial data if tables are empty
      // Seed CMS
      const [cmsRows] = await pool.query('SELECT COUNT(*) as count FROM cms_content');
      if (cmsRows[0].count === 0) {
        const fileCMS = readJsonSafe(CMS_FILE, {});
        for (const [key, val] of Object.entries(fileCMS)) {
          await pool.query(
            'INSERT INTO cms_content (page_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)',
            [key, JSON.stringify(val)]
          );
        }
        console.log('🌱 [MySQL] Seeded cms_content table from data/cms-content.json');
      }

      // Seed Products
      const [prodRows] = await pool.query('SELECT COUNT(*) as count FROM products');
      if (prodRows[0].count === 0) {
        const fileProds = readJsonSafe(PRODUCTS_FILE, []);
        if (Array.isArray(fileProds) && fileProds.length > 0) {
          for (const p of fileProds) {
            await pool.query(
              `INSERT INTO products (id, sku, name, brand, category, price, description, colors, dimensions, weight, images, featured, popular, specs, raw_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE name=VALUES(name), brand=VALUES(brand), category=VALUES(category), price=VALUES(price), raw_data=VALUES(raw_data)`,
              [
                p.id || ('prod_' + Math.random().toString(36).substring(2)),
                p.sku || '',
                p.n || '',
                p.b || '',
                p.c || '',
                p.p || 0,
                p.d || '',
                JSON.stringify(p.clr || []),
                p.dim || '',
                p.wt || '',
                JSON.stringify(p.img || []),
                p.feat ? 1 : 0,
                p.pop ? 1 : 0,
                JSON.stringify(p.specs || {}),
                JSON.stringify(p)
              ]
            );
          }
          console.log(`🌱 [MySQL] Seeded products table with ${fileProds.length} products`);
        }
      }

      // Seed Admin User
      const [userRows] = await pool.query('SELECT COUNT(*) as count FROM admin_users');
      if (userRows[0].count === 0) {
        const fileAdmin = readJsonSafe(ADMIN_FILE, { username: 'admin', password: 'nationalplasto2026' });
        await pool.query(
          'INSERT INTO admin_users (username, password, last_login) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password=VALUES(password)',
          [fileAdmin.username || 'admin', fileAdmin.password || 'nationalplasto2026', fileAdmin.lastLogin ? new Date(fileAdmin.lastLogin) : null]
        );
        console.log('🌱 [MySQL] Seeded admin_users table with default admin');
      }

      return true;
    } catch (err) {
      console.warn('⚠️  [MySQL] Connection failed, activating JSON file fallback mode:', err.message);
      isConnected = false;
      return false;
    }
  })();

  return initPromise;
}

// ----------------- CMS Operations -----------------

async function getCMSContent() {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT page_key, content FROM cms_content');
      if (rows && rows.length > 0) {
        const cms = {};
        for (const row of rows) {
          try {
            cms[row.page_key] = JSON.parse(row.content);
          } catch (_) {
            cms[row.page_key] = row.content;
          }
        }
        return cms;
      }
    } catch (err) {
      console.warn('[MySQL] Error querying cms_content, using file fallback:', err.message);
    }
  }
  return readJsonSafe(CMS_FILE, {});
}

async function getCMSPage(page) {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT content FROM cms_content WHERE page_key = ?', [page]);
      if (rows && rows.length > 0) {
        return JSON.parse(rows[0].content);
      }
    } catch (err) {
      console.warn('[MySQL] Error querying page ' + page + ':', err.message);
    }
  }
  const all = readJsonSafe(CMS_FILE, {});
  return all[page] || null;
}

async function saveCMSPage(page, data) {
  await initDatabase();
  const jsonStr = JSON.stringify(data);

  if (isConnected && pool) {
    try {
      await pool.query(
        'INSERT INTO cms_content (page_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)',
        [page, jsonStr]
      );
      console.log(`💾 [MySQL] Saved CMS page "${page}" successfully`);
    } catch (err) {
      console.warn('[MySQL] Error saving page ' + page + ' to DB:', err.message);
    }
  }

  // Synchronize JSON file as resilient backup
  const all = readJsonSafe(CMS_FILE, {});
  all[page] = data;
  writeJsonSafe(CMS_FILE, all);
  return data;
}

async function saveAllCMS(allData) {
  await initDatabase();
  if (isConnected && pool) {
    try {
      for (const [key, val] of Object.entries(allData)) {
        await pool.query(
          'INSERT INTO cms_content (page_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)',
          [key, JSON.stringify(val)]
        );
      }
      console.log('💾 [MySQL] Saved all CMS sections successfully');
    } catch (err) {
      console.warn('[MySQL] Error bulk saving CMS to DB:', err.message);
    }
  }
  writeJsonSafe(CMS_FILE, allData);
  return allData;
}

// ----------------- Product Operations -----------------

function normalizeProductFromDb(row) {
  if (row.raw_data) {
    try {
      const parsed = JSON.parse(row.raw_data);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
  }
  return {
    id: row.id,
    sku: row.sku,
    n: row.name,
    b: row.brand,
    c: row.category,
    p: row.price,
    d: row.description,
    clr: row.colors ? JSON.parse(row.colors) : [],
    dim: row.dimensions,
    wt: row.weight,
    img: row.images ? JSON.parse(row.images) : [],
    feat: Boolean(row.featured),
    pop: Boolean(row.popular),
    specs: row.specs ? JSON.parse(row.specs) : {}
  };
}

async function getProducts() {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
      if (rows && rows.length > 0) {
        return rows.map(normalizeProductFromDb);
      }
    } catch (err) {
      console.warn('[MySQL] Error fetching products:', err.message);
    }
  }
  return readJsonSafe(PRODUCTS_FILE, []);
}

async function getProductById(id) {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ? OR sku = ?', [id, id]);
      if (rows && rows.length > 0) {
        return normalizeProductFromDb(rows[0]);
      }
    } catch (err) {
      console.warn('[MySQL] Error fetching product ' + id + ':', err.message);
    }
  }
  const products = readJsonSafe(PRODUCTS_FILE, []);
  return products.find(p => p.id === id || p.sku === id) || null;
}

async function saveProduct(product) {
  await initDatabase();
  const prodId = product.id || ('NP-' + Date.now().toString(36).toUpperCase());
  product.id = prodId;

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO products (id, sku, name, brand, category, price, description, colors, dimensions, weight, images, featured, popular, specs, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            sku=VALUES(sku), name=VALUES(name), brand=VALUES(brand), category=VALUES(category),
            price=VALUES(price), description=VALUES(description), colors=VALUES(colors),
            dimensions=VALUES(dimensions), weight=VALUES(weight), images=VALUES(images),
            featured=VALUES(featured), popular=VALUES(popular), specs=VALUES(specs), raw_data=VALUES(raw_data)`,
        [
          prodId,
          product.sku || '',
          product.n || '',
          product.b || '',
          product.c || '',
          product.p || 0,
          product.d || '',
          JSON.stringify(product.clr || []),
          product.dim || '',
          product.wt || '',
          JSON.stringify(product.img || []),
          product.feat ? 1 : 0,
          product.pop ? 1 : 0,
          JSON.stringify(product.specs || {}),
          JSON.stringify(product)
        ]
      );
      console.log(`💾 [MySQL] Saved product "${product.n}" (${prodId})`);
    } catch (err) {
      console.warn('[MySQL] Error saving product to DB:', err.message);
    }
  }

  // Sync to file
  const products = readJsonSafe(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === prodId || p.sku === product.sku);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.unshift(product);
  }
  writeJsonSafe(PRODUCTS_FILE, products);
  return product;
}

async function deleteProduct(id) {
  await initDatabase();
  let deleted = null;

  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ? OR sku = ?', [id, id]);
      if (rows && rows.length > 0) {
        deleted = normalizeProductFromDb(rows[0]);
        await pool.query('DELETE FROM products WHERE id = ? OR sku = ?', [id, id]);
        console.log(`🗑️ [MySQL] Deleted product ID ${id}`);
      }
    } catch (err) {
      console.warn('[MySQL] Error deleting product from DB:', err.message);
    }
  }

  // Sync to file
  let products = readJsonSafe(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === id || p.sku === id);
  if (idx !== -1) {
    if (!deleted) deleted = products[idx];
    products.splice(idx, 1);
    writeJsonSafe(PRODUCTS_FILE, products);
  }
  return deleted;
}

// ----------------- Admin Auth Operations -----------------

async function getAdminConfig() {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT username, password, last_login FROM admin_users LIMIT 1');
      if (rows && rows.length > 0) {
        return {
          username: rows[0].username,
          password: rows[0].password,
          lastLogin: rows[0].last_login ? new Date(rows[0].last_login).toISOString() : null
        };
      }
    } catch (err) {
      console.warn('[MySQL] Error reading admin config:', err.message);
    }
  }
  return readJsonSafe(ADMIN_FILE, { username: 'admin', password: 'nationalplasto2026' });
}

async function updateAdminPassword(username, newPassword) {
  await initDatabase();
  if (isConnected && pool) {
    try {
      await pool.query('UPDATE admin_users SET password = ? WHERE username = ?', [newPassword, username]);
      console.log(`🔐 [MySQL] Updated admin password for user "${username}"`);
    } catch (err) {
      console.warn('[MySQL] Error updating admin password:', err.message);
    }
  }

  const conf = readJsonSafe(ADMIN_FILE, { username: 'admin', password: 'nationalplasto2026' });
  conf.password = newPassword;
  writeJsonSafe(ADMIN_FILE, conf);
  return true;
}

async function recordAdminLogin(username) {
  await initDatabase();
  const now = new Date();
  if (isConnected && pool) {
    try {
      await pool.query('UPDATE admin_users SET last_login = ? WHERE username = ?', [now, username]);
    } catch (err) {
      console.warn('[MySQL] Error updating last login:', err.message);
    }
  }

  const conf = readJsonSafe(ADMIN_FILE, { username: 'admin', password: 'nationalplasto2026' });
  conf.lastLogin = now.toISOString();
  writeJsonSafe(ADMIN_FILE, conf);
}

// ----------------- Inquiry Operations -----------------

async function saveInquiry(inquiry) {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [result] = await pool.query(
        `INSERT INTO inquiries (type, name, phone, email, firm_name, state, city, message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inquiry.type || 'dealer',
          inquiry.name || '',
          inquiry.phone || '',
          inquiry.email || '',
          inquiry.firm_name || '',
          inquiry.state || '',
          inquiry.city || '',
          inquiry.message || ''
        ]
      );
      return { id: result.insertId, ...inquiry };
    } catch (err) {
      console.warn('[MySQL] Error saving inquiry to DB:', err.message);
    }
  }
  return inquiry;
}

async function getInquiries(limit = 100) {
  await initDatabase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY id DESC LIMIT ?', [limit]);
      return rows;
    } catch (err) {
      console.warn('[MySQL] Error fetching inquiries:', err.message);
    }
  }
  return [];
}

module.exports = {
  initDatabase,
  isDbConnected: () => isConnected,
  getCMSContent,
  getCMSPage,
  saveCMSPage,
  saveAllCMS,
  getProducts,
  getProductById,
  saveProduct,
  deleteProduct,
  getAdminConfig,
  updateAdminPassword,
  recordAdminLogin,
  saveInquiry,
  getInquiries,
  getPool: () => pool
};

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const TABLES = {
  categories: { nextId: 1, rows: [] },
  products: { nextId: 1, rows: [] },
  download_logs: { nextId: 1, rows: [] },
  operation_logs: { nextId: 1, rows: [] },
  config: { nextId: 1, rows: [] }
};

function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }); } catch(e) {} }
ensureDir(DATA_DIR);

let cache = {};

function loadTable(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    cache[name] = data;
  } catch(e) {
    cache[name] = JSON.parse(JSON.stringify(TABLES[name]));
    saveTable(name);
  }
  return cache[name];
}

function saveTable(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(cache[name], null, 2), 'utf8');
}

// Init all tables
Object.keys(TABLES).forEach(loadTable);

// Seed admin if not exists
const adminFile = path.join(DATA_DIR, 'admin.json');
let admin;
try {
  admin = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
} catch(e) {
  admin = {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    nickName: '超级管理员',
    createTime: new Date().toISOString()
  };
  fs.writeFileSync(adminFile, JSON.stringify(admin, null, 2), 'utf8');
}

function saveAdmin() {
  fs.writeFileSync(adminFile, JSON.stringify(admin, null, 2), 'utf8');
}

module.exports = {
  // Admin
  getAdmin: () => admin,
  updatePassword: (hash) => { admin.password = hash; saveAdmin(); },
  
  // Categories
  getCategories: (query = {}) => {
    const t = cache.categories;
    let list = t.rows.filter(r => !r.delFlag);
    if (query.name) list = list.filter(r => r.name.includes(query.name));
    if (query.sortBy) {
      list.sort((a, b) => a[query.sortBy] - b[query.sortBy]);
    }
    return list;
  },
  getCategoryById: (id) => {
    const t = cache.categories;
    return t.rows.find(r => r.id === id && !r.delFlag);
  },
  getCategoryByName: (name) => {
    const t = cache.categories;
    return t.rows.find(r => r.name === name && !r.delFlag);
  },
  createCategory: (data) => {
    const t = cache.categories;
    const item = {
      id: t.nextId++,
      name: data.name,
      sort: data.sort || 0,
      remark: data.remark || '',
      delFlag: false,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    t.rows.push(item);
    saveTable('categories');
    return item;
  },
  updateCategory: (id, data) => {
    const t = cache.categories;
    const idx = t.rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const item = t.rows[idx];
    if (data.name !== undefined) item.name = data.name;
    if (data.sort !== undefined) item.sort = data.sort;
    if (data.remark !== undefined) item.remark = data.remark;
    item.updateTime = new Date().toISOString();
    saveTable('categories');
    return item;
  },
  deleteCategory: (id) => {
    const t = cache.categories;
    const item = t.rows.find(r => r.id === id);
    if (!item) return false;
    item.delFlag = true;
    item.updateTime = new Date().toISOString();
    saveTable('categories');
    return true;
  },
  hasProductsInCategory: (catId) => {
    const t = cache.products;
    return t.rows.some(r => r.categoryId === catId && !r.delFlag);
  },
  
  // Products
  getProducts: (query = {}) => {
    const t = cache.products;
    let list = t.rows.filter(r => !r.delFlag);
    if (query.name) list = list.filter(r => r.productName.includes(query.name));
    if (query.categoryId) list = list.filter(r => r.categoryId === parseInt(query.categoryId));
    if (query.startTime) list = list.filter(r => new Date(r.updateTime) >= new Date(query.startTime));
    if (query.endTime) list = list.filter(r => new Date(r.updateTime) <= new Date(query.endTime));
    return list;
  },
  getProductById: (id) => {
    const t = cache.products;
    return t.rows.find(r => r.id === id && !r.delFlag);
  },
  getProductByName: (name) => {
    const t = cache.products;
    return t.rows.find(r => r.productName === name && !r.delFlag);
  },
  createProduct: (data) => {
    const t = cache.products;
    const item = {
      id: t.nextId++,
      productName: data.productName,
      categoryId: data.categoryId,
      logoPreviewUrl: data.logoPreviewUrl || '',
      zipFileUrl: data.zipFileUrl || '',
      zipFileName: data.zipFileName || '',
      descText: data.descText || '',
      sort: data.sort || 10,
      delFlag: false,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    t.rows.push(item);
    saveTable('products');
    return item;
  },
  updateProduct: (id, data) => {
    const t = cache.products;
    const idx = t.rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const item = t.rows[idx];
    if (data.productName !== undefined) item.productName = data.productName;
    if (data.categoryId !== undefined) item.categoryId = data.categoryId;
    if (data.logoPreviewUrl !== undefined) item.logoPreviewUrl = data.logoPreviewUrl;
    if (data.zipFileUrl !== undefined) item.zipFileUrl = data.zipFileUrl;
    if (data.zipFileName !== undefined) item.zipFileName = data.zipFileName;
    if (data.descText !== undefined) item.descText = data.descText;
    if (data.sort !== undefined) item.sort = data.sort;
    item.updateTime = new Date().toISOString();
    saveTable('products');
    return item;
  },
  deleteProduct: (id) => {
    const t = cache.products;
    const item = t.rows.find(r => r.id === id);
    if (!item) return false;
    item.delFlag = true;
    saveTable('products');
    return true;
  },
  
  // Download logs
  getDownloadLogs: (query = {}) => {
    const t = cache.download_logs;
    let list = [...t.rows];
    if (query.productName) list = list.filter(r => r.productName.includes(query.productName));
    if (query.ipAddr) list = list.filter(r => r.ipAddr.includes(query.ipAddr));
    if (query.startTime) list = list.filter(r => new Date(r.downloadTime) >= new Date(query.startTime));
    if (query.endTime) list = list.filter(r => new Date(r.downloadTime) <= new Date(query.endTime));
    return list.sort((a,b) => new Date(b.downloadTime) - new Date(a.downloadTime));
  },
  createDownloadLog: (data) => {
    const t = cache.download_logs;
    const item = {
      id: t.nextId++,
      productId: data.productId,
      productName: data.productName,
      fileName: data.fileName,
      ipAddr: data.ipAddr || '',
      browser: data.browser || '',
      downloadTime: new Date().toISOString()
    };
    t.rows.push(item);
    saveTable('download_logs');
    return item;
  },
  
  // Operation logs
  getOperationLogs: (query = {}) => {
    const t = cache.operation_logs;
    let list = [...t.rows];
    if (query.operationType) list = list.filter(r => r.operationType.includes(query.operationType));
    return list.sort((a,b) => new Date(b.operationTime) - new Date(a.operationTime));
  },
  createOperationLog: (data) => {
    const t = cache.operation_logs;
    const item = {
      id: t.nextId++,
      operationType: data.operationType,
      operationContent: data.operationContent,
      operatorIp: data.operatorIp || '',
      moduleType: data.moduleType || '',
      businessId: data.businessId || null,
      operationTime: new Date().toISOString()
    };
    t.rows.push(item);
    saveTable('operation_logs');
    return item;
  },
  
  // Config
  getConfig: (key) => {
    const t = cache.config;
    return t.rows.find(r => r.configKey === key && !r.delFlag);
  },
  getAllConfigs: () => {
    const t = cache.config;
    return t.rows.filter(r => !r.delFlag);
  },
  setConfig: (key, value, desc = '') => {
    const t = cache.config;
    let existing = t.rows.find(r => r.configKey === key);
    if (existing) {
      existing.configValue = value;
      existing.updateTime = new Date().toISOString();
    } else {
      const item = {
        id: t.nextId++,
        configKey: key,
        configValue: value,
        configDesc: desc,
        delFlag: false,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };
      t.rows.push(item);
    }
    saveTable('config');
  },
  
  // Seed default config
  initDefaults: () => {
    const defaults = {
      'upload.zip.maxSize': { value: '209715200', desc: '压缩包最大大小(200MB)' },
      'upload.image.maxSize': { value: '5242880', desc: '图片最大大小(5MB)' },
      'upload.allowed.extensions': { value: 'zip,png,jpg,jpeg,svg,ico', desc: '允许上传后缀' },
      'storage.type': { value: 'local', desc: '存储类型(local/oss/minio)' },
      'storage.local.path': { value: 'uploads', desc: '本地存储路径' },
      'page.title': { value: '用户体验处产品标识管理', desc: '前端页面标题' },
      'page.subtitle': { value: 'UX Department Product Identity Management', desc: '前端副标题' },
    };
    Object.entries(defaults).forEach(([key, cfg]) => {
      if (!module.exports.getConfig(key)) {
        module.exports.setConfig(key, cfg.value, cfg.desc);
      }
    });
  }
};

// Seed default categories if empty
const catTable = cache.categories;
if (catTable.rows.length === 0) {
  const names = ['云启千行', '云上协同', '格物致治', '灵犀有言', '数说心语', '智连一同', '天工开务'];
  names.forEach((name, i) => {
    module.exports.createCategory({ name, sort: i + 1, remark: '系统初始化' });
  });
}

// Seed default config
module.exports.initDefaults();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Multer setup with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = file.fieldname === 'logoImage' ? 'logos' : 'zips';
    const dir = path.join(UPLOAD_DIR, subdir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '_' + Math.random().toString(36).substr(2, 6) + ext;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'logoImage') {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.ico'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('图片仅支持 png/jpg/svg/ico 格式'));
  } else if (file.fieldname === 'zipFile') {
    if (!file.originalname.endsWith('.zip')) return cb(new Error('压缩包仅支持 zip 格式'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 210 * 1024 * 1024 } });

// List with pagination
router.get('/list', authMiddleware, (req, res) => {
  const { name, categoryId, startTime, endTime, page = 1, pageSize = 10 } = req.query;
  let list = db.getProducts({ name, categoryId, startTime, endTime });
  const total = list.length;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  list = list.slice(start, start + parseInt(pageSize));
  // Attach category name
  list = list.map(p => {
    const cat = db.getCategoryById(p.categoryId);
    return { ...p, categoryName: cat ? cat.name : '未分类' };
  });
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// Get detail
router.get('/:id', authMiddleware, (req, res) => {
  const item = db.getProductById(parseInt(req.params.id));
  if (!item) return res.json({ code: 500, msg: '产品不存在' });
  const cat = db.getCategoryById(item.categoryId);
  item.categoryName = cat ? cat.name : '未分类';
  res.json({ code: 200, data: item });
});

// Upload file
router.post('/upload', authMiddleware, upload.fields([
  { name: 'logoImage', maxCount: 1 },
  { name: 'zipFile', maxCount: 1 }
]), (req, res) => {
  const files = req.files || {};
  const result = {};
  if (files.logoImage) {
    const f = files.logoImage[0];
    result.logoUrl = `/uploads/logos/${f.filename}`;
    result.logoName = Buffer.from(f.originalname, 'latin1').toString('utf8');
  }
  if (files.zipFile) {
    const f = files.zipFile[0];
    result.zipUrl = `/uploads/zips/${f.filename}`;
    result.zipName = Buffer.from(f.originalname, 'latin1').toString('utf8');
  }
  res.json({ code: 200, msg: '上传成功', data: result });
});

// Create
router.post('/', authMiddleware, (req, res) => {
  const { productName, categoryId, logoPreviewUrl, zipFileUrl, zipFileName, descText, sort } = req.body;
  if (!productName) return res.json({ code: 500, msg: '产品名称不能为空' });
  if (!categoryId) return res.json({ code: 500, msg: '请选择所属分类' });
  if (!zipFileUrl) return res.json({ code: 500, msg: '请上传压缩包' });
  const dup = db.getProductByName(productName);
  if (dup) return res.json({ code: 500, msg: '产品名称已存在' });
  const item = db.createProduct({ productName, categoryId: parseInt(categoryId), logoPreviewUrl, zipFileUrl, zipFileName, descText, sort: parseInt(sort) || 10 });
  db.createOperationLog({ operationType: '新增产品', operationContent: `新增产品：${productName}`, operatorIp: req.ip, moduleType: 'product', businessId: item.id });
  res.json({ code: 200, msg: '新增成功', data: item });
});

// Update
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { productName, categoryId, logoPreviewUrl, zipFileUrl, zipFileName, descText, sort } = req.body;
  if (!productName) return res.json({ code: 500, msg: '产品名称不能为空' });
  const dup = db.getProductByName(productName);
  if (dup && dup.id !== id) return res.json({ code: 500, msg: '产品名称已存在' });
  const item = db.updateProduct(id, { productName, categoryId: parseInt(categoryId), logoPreviewUrl, zipFileUrl, zipFileName, descText, sort: parseInt(sort) || 10 });
  if (!item) return res.json({ code: 500, msg: '产品不存在' });
  db.createOperationLog({ operationType: '编辑产品', operationContent: `编辑产品：${productName}`, operatorIp: req.ip, moduleType: 'product', businessId: id });
  res.json({ code: 200, msg: '修改成功', data: item });
});

// Delete
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const item = db.getProductById(id);
  if (!item) return res.json({ code: 500, msg: '产品不存在' });
  db.deleteProduct(id);
  db.createOperationLog({ operationType: '删除产品', operationContent: `删除产品：${item.productName}`, operatorIp: req.ip, moduleType: 'product', businessId: id });
  res.json({ code: 200, msg: '删除成功' });
});

// Frontend: public product list (no auth)
router.get('/public/list', (req, res) => {
  const { categoryId } = req.query;
  let list = db.getProducts({ categoryId });
  list.sort((a, b) => a.sort - b.sort);
  list = list.map(p => {
    const cat = db.getCategoryById(p.categoryId);
    return {
      id: p.id, productName: p.productName, categoryName: cat ? cat.name : '未分类',
      logoPreviewUrl: p.logoPreviewUrl, descText: p.descText, sort: p.sort,
      updateTime: p.updateTime, zipFileUrl: p.zipFileUrl, zipFileName: p.zipFileName
    };
  });
  res.json({ code: 200, data: list });
});

// Frontend: download count + log
router.get('/public/download/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = db.getProductById(id);
  if (!product || !product.zipFileUrl) return res.json({ code: 500, msg: '文件不存在' });
  
  // Log download
  const ua = req.headers['user-agent'] || '';
  db.createDownloadLog({
    productId: id, productName: product.productName,
    fileName: product.zipFileName || 'package.zip',
    ipAddr: req.ip || req.connection.remoteAddress,
    browser: ua.substring(0, 200)
  });
  
  // Redirect to file
  const filePath = path.join(__dirname, '..', product.zipFileUrl);
  if (fs.existsSync(filePath)) {
    const dlFileName = product.zipFileName || 'package.zip';
    const encodedName = encodeURIComponent(dlFileName);
    res.set('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
    res.sendFile(filePath);
  } else {
    res.json({ code: 500, msg: '文件不存在或已被删除' });
  }
});

module.exports = router;

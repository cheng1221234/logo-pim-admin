const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List with pagination
router.get('/list', authMiddleware, (req, res) => {
  const { name, page = 1, pageSize = 10 } = req.query;
  let list = db.getCategories({ name });
  const total = list.length;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  list = list.slice(start, start + parseInt(pageSize));
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// All (for select dropdown)
router.get('/all', (req, res) => {
  const list = db.getCategories({ sortBy: 'sort' });
  res.json({ code: 200, data: list });
});

// Get detail
router.get('/:id', authMiddleware, (req, res) => {
  const item = db.getCategoryById(parseInt(req.params.id));
  if (!item) return res.json({ code: 500, msg: '分类不存在' });
  res.json({ code: 200, data: item });
});

// Create
router.post('/', authMiddleware, (req, res) => {
  const { name, sort, remark } = req.body;
  if (!name) return res.json({ code: 500, msg: '分类名称不能为空' });
  const existing = db.getCategoryByName(name);
  if (existing) return res.json({ code: 500, msg: '分类名称已存在' });
  const item = db.createCategory({ name, sort: parseInt(sort) || 0, remark });
  db.createOperationLog({ operationType: '新增分类', operationContent: `新增分类：${name}`, operatorIp: req.ip, moduleType: 'category', businessId: item.id });
  res.json({ code: 200, msg: '新增成功', data: item });
});

// Update
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, sort, remark } = req.body;
  if (!name) return res.json({ code: 500, msg: '分类名称不能为空' });
  const dup = db.getCategoryByName(name);
  if (dup && dup.id !== id) return res.json({ code: 500, msg: '分类名称已存在' });
  const item = db.updateCategory(id, { name, sort: parseInt(sort) || 0, remark });
  if (!item) return res.json({ code: 500, msg: '分类不存在' });
  db.createOperationLog({ operationType: '编辑分类', operationContent: `编辑分类：${name}`, operatorIp: req.ip, moduleType: 'category', businessId: id });
  res.json({ code: 200, msg: '修改成功', data: item });
});

// Delete
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  if (db.hasProductsInCategory(id)) {
    return res.json({ code: 500, msg: '当前分类存在关联产品，请先修改产品所属分类后再删除' });
  }
  db.deleteCategory(id);
  db.createOperationLog({ operationType: '删除分类', operationContent: `删除分类ID：${id}`, operatorIp: req.ip, moduleType: 'category', businessId: id });
  res.json({ code: 200, msg: '删除成功' });
});

module.exports = router;

const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/list', authMiddleware, (req, res) => {
  const list = db.getAllConfigs();
  res.json({ code: 200, data: { list, total: list.length, page: 1, pageSize: list.length } });
});

router.put('/:key', authMiddleware, (req, res) => {
  const { value } = req.body;
  db.setConfig(req.params.key, value);
  db.createOperationLog({ operationType: '修改配置', operationContent: `修改配置：${req.params.key}`, operatorIp: req.ip, moduleType: 'config' });
  res.json({ code: 200, msg: '保存成功' });
});

module.exports = router;

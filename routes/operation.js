const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/list', authMiddleware, (req, res) => {
  const { operationType, page = 1, pageSize = 10 } = req.query;
  let list = db.getOperationLogs({ operationType });
  const total = list.length;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  list = list.slice(start, start + parseInt(pageSize));
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

module.exports = router;

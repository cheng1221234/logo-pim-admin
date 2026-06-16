const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/list', authMiddleware, (req, res) => {
  const { productName, ipAddr, startTime, endTime, page = 1, pageSize = 10 } = req.query;
  let list = db.getDownloadLogs({ productName, ipAddr, startTime, endTime });
  const total = list.length;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  list = list.slice(start, start + parseInt(pageSize));
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// Export
router.get('/export', authMiddleware, (req, res) => {
  const list = db.getDownloadLogs({});
  const csv = ['下载时间,产品名称,压缩包文件名,访问IP,浏览器标识'];
  list.forEach(l => {
    csv.push(`"${l.downloadTime}","${l.productName}","${l.fileName}","${l.ipAddr}","${l.browser}"`);
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=download_logs.csv');
  res.send('\uFEFF' + csv.join('\n'));
});

module.exports = router;

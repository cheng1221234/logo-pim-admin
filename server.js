const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Ensure upload dirs
['uploads/logos', 'uploads/zips'].forEach(d => {
  fs.mkdirSync(path.join(__dirname, d), { recursive: true });
});

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for admin
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/css', express.static(path.join(__dirname, 'public/admin/css')));
app.use('/js', express.static(path.join(__dirname, 'public/admin/js')));

// Static files for portal (public frontend)
app.use('/portal/assets', express.static(path.join(__dirname, 'public/portal/assets')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/category', require('./routes/category'));
app.use('/api/product', require('./routes/product'));
app.use('/api/download', require('./routes/download'));
app.use('/api/operation', require('./routes/operation'));
app.use('/api/config', require('./routes/config'));

// Serve admin frontend at /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Serve portal (public frontend) at /portal
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/portal/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.message && (err.message.includes('仅支持') || err.message.includes('仅允许'))) {
    return res.status(400).json({ code: 500, msg: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 500, msg: '文件大小超出限制' });
  }
  res.status(500).json({ code: 500, msg: err.message || '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║  LOGOPIM 后台管理系统               ║`);
  console.log(`  ║  Server: http://localhost:${PORT}    ║`);
  console.log(`  ║  Admin:  http://localhost:${PORT}/    ║`);
  console.log(`  ║  Portal: http://localhost:${PORT}/portal ║`);
  console.log(`  ╚══════════════════════════════════════╝`);
  console.log(`\n  账号: admin  密码: admin123\n`);
});

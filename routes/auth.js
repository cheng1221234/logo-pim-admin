const express = require('express');
const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');
const db = require('../database');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

let captchaStore = {};

// Captcha
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.createMathExpr({
    mathMin: 1, mathMax: 9, mathOperator: '+',
    width: 120, height: 38,
    fontSize: 50,
    background: '#f0f0f5'
  });
  const uuid = Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  captchaStore[uuid] = { value: eval(captcha.text), time: Date.now() };
  // Clean old
  Object.keys(captchaStore).forEach(k => {
    if (Date.now() - captchaStore[k].time > 300000) delete captchaStore[k];
  });
  res.json({
    code: 200,
    data: { uuid, img: captcha.data }
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password, captchaUuid, captchaCode } = req.body;
  
  // Verify captcha
  const store = captchaStore[captchaUuid];
  if (!store) {
    return res.json({ code: 500, msg: '验证码已过期' });
  }
  if (parseInt(store.value) !== parseInt(captchaCode)) {
    delete captchaStore[captchaUuid];
    return res.json({ code: 500, msg: '验证码错误' });
  }
  delete captchaStore[captchaUuid];
  
  const admin = db.getAdmin();
  if (admin.username !== username) {
    return res.json({ code: 500, msg: '用户名或密码错误' });
  }
  if (!bcrypt.compareSync(password, admin.password)) {
    return res.json({ code: 500, msg: '用户名或密码错误' });
  }
  
  const token = generateToken(admin);
  res.json({
    code: 200,
    msg: '登录成功',
    data: {
      token,
      user: { id: admin.id, username: admin.username, nickName: admin.nickName }
    }
  });
});

// Get user info
router.get('/getInfo', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ code: 500, msg: '未登录' });
  try {
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = db.getAdmin();
    res.json({
      code: 200,
      data: {
        user: { id: admin.id, username: admin.username, nickName: admin.nickName },
        roles: ['admin'],
        permissions: ['*:*:*']
      }
    });
  } catch(e) {
    res.json({ code: 500, msg: '登录已过期' });
  }
});

// Get menu routes (simplified)
router.get('/getRouters', (req, res) => {
  res.json({
    code: 200,
    data: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        hidden: false,
        redirect: 'noRedirect',
        component: 'dashboard/index',
        meta: { title: '首页', icon: 'dashboard', noCache: true }
      },
      {
        name: 'Category',
        path: '/category',
        hidden: false,
        component: 'category/index',
        meta: { title: '产品分类管理', icon: 'tree' }
      },
      {
        name: 'Product',
        path: '/product',
        hidden: false,
        component: 'product/index',
        meta: { title: '产品LOGO素材管理', icon: 'picture' }
      },
      {
        name: 'DownloadLog',
        path: '/download-log',
        hidden: false,
        component: 'download-log/index',
        meta: { title: '下载日志', icon: 'log' }
      },
      {
        name: 'OperationLog',
        path: '/operation-log',
        hidden: false,
        component: 'operation-log/index',
        meta: { title: '操作日志', icon: 'documentation' }
      },
      {
        name: 'Config',
        path: '/config',
        hidden: false,
        component: 'config/index',
        meta: { title: '系统配置', icon: 'setting' }
      }
    ]
  });
});

// Change password
router.post('/updatePwd', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ code: 500, msg: '未登录' });
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = db.getAdmin();
    if (!bcrypt.compareSync(oldPassword, admin.password)) {
      return res.json({ code: 500, msg: '旧密码错误' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.updatePassword(hash);
    res.json({ code: 200, msg: '修改成功' });
  } catch(e) {
    res.json({ code: 500, msg: '操作失败' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ code: 200, msg: '退出成功' });
});

module.exports = router;

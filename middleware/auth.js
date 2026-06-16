const jwt = require('jsonwebtoken');
const JWT_SECRET = 'LOGO_PIM_ADMIN_2026_SECRET_KEY';

function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未登录或登录已过期' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch(e) {
    return res.status(401).json({ code: 401, msg: '登录已过期，请重新登录' });
  }
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };

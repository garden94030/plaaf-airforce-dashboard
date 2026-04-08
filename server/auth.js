// ==========================================
// JWT 認證中介層
// ==========================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'plaaf-dashboard-secret-2026';
const JWT_EXPIRES = '8h';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授權：缺少認證令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '未授權：令牌無效或已過期' });
  }
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };

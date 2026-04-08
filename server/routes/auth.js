// ==========================================
// 認證路由 — 登入 / 使用者資訊 + 登入紀錄
// ==========================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, prepareGet, prepareRun, saveDb } = require('../db');
const { generateToken, authMiddleware } = require('../auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '請輸入帳號和密碼' });
  }

  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    await getDb();
    const user = prepareGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      // 記錄失敗登入
      prepareRun('INSERT INTO login_logs (username, display_name, role, ip, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)',
        [username, '未知', '未知', ip, userAgent, 0]);
      saveDb();
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      // 記錄失敗登入
      prepareRun('INSERT INTO login_logs (username, display_name, role, ip, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)',
        [username, user.display_name, user.role, ip, userAgent, 0]);
      saveDb();
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // 記錄成功登入
    prepareRun('INSERT INTO login_logs (username, display_name, role, ip, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)',
      [user.username, user.display_name, user.role, ip, userAgent, 1]);
    saveDb();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

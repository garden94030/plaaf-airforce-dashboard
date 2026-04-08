// ==========================================
// 管理路由 — 登入紀錄 / 操作紀錄 / 使用者管理
// 僅管理員可存取
// ==========================================

const express = require('express');
const { getDb, prepareAll, prepareGet, prepareRun, saveDb } = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();

// 認證 + 管理員權限檢查
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '權限不足：僅管理員可存取' });
  }
  next();
});

// 確保 DB 就緒
router.use(async (req, res, next) => {
  try { await getDb(); next(); }
  catch (err) { res.status(500).json({ error: '資料庫錯誤' }); }
});

// GET /api/admin/login-logs — 登入紀錄
router.get('/login-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = prepareAll(
    'SELECT id, username, display_name, role, ip, user_agent, success, created_at FROM login_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  res.json(logs);
});

// GET /api/admin/operation-logs — 操作紀錄
router.get('/operation-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = prepareAll(
    'SELECT id, username, display_name, method, path, status_code, ip, created_at FROM operation_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  res.json(logs);
});

// GET /api/admin/users — 使用者列表
router.get('/users', (req, res) => {
  const users = prepareAll('SELECT id, username, display_name, role, created_at FROM users');
  res.json(users);
});

// GET /api/admin/stats — 系統統計
router.get('/stats', (req, res) => {
  const totalUsers = prepareGet('SELECT COUNT(*) as c FROM users');
  const totalLogins = prepareGet('SELECT COUNT(*) as c FROM login_logs WHERE success = 1');
  const failedLogins = prepareGet('SELECT COUNT(*) as c FROM login_logs WHERE success = 0');
  const totalOps = prepareGet('SELECT COUNT(*) as c FROM operation_logs');
  const todayLogins = prepareGet("SELECT COUNT(*) as c FROM login_logs WHERE success = 1 AND date(created_at) = date('now')");

  res.json({
    totalUsers: totalUsers ? totalUsers.c : 0,
    totalLogins: totalLogins ? totalLogins.c : 0,
    failedLogins: failedLogins ? failedLogins.c : 0,
    totalOperations: totalOps ? totalOps.c : 0,
    todayLogins: todayLogins ? todayLogins.c : 0,
  });
});

module.exports = router;

// ==========================================
// PLAAF Dashboard — Express 主程式
// ==========================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// 中介層
app.use(cors());
app.use(express.json());

// 靜態檔案 — 前端 HTML/CSS/JS/images
app.use(express.static(path.join(__dirname, '..')));

// API 路由
app.use('/api/auth', require('./routes/auth'));

// ===== 操作紀錄 Middleware =====
app.use('/api', async (req, res, next) => {
  // 讓 auth middleware 先處理，嘗試解析 user
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('./auth');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      
      // 紀錄操作 (不包含 /api/auth 路由，因為 auth 自己會紀錄)
      if (!req.path.startsWith('/auth')) {
        const { getDb, prepareRun, saveDb } = require('./db');
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        
        res.on('finish', async () => {
          try {
            await getDb();
            prepareRun(
              'INSERT INTO operation_logs (user_id, username, display_name, method, path, status_code, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [req.user.id, req.user.username, req.user.displayName, req.method, req.path, res.statusCode, ip]
            );
            saveDb();
          } catch(e) { console.error('Error logging operation:', e); }
        });
      }
    } catch(e) {} // 如果 token 無效，放行給後續路由處理 (會回傳 401)
  }
  next();
});

app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/data'));

// 啟動伺服器
async function start() {
  // 初始化資料庫
  await getDb();
  console.log('📦 Database initialized.');

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  PLAAF Dashboard Server                  ║
║  🚀 Running on http://localhost:${PORT}      ║
║  📊 API: http://localhost:${PORT}/api       ║
║  🔐 Login: http://localhost:${PORT}/login.html ║
╚══════════════════════════════════════════╝
    `);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

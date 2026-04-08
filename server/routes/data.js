// ==========================================
// 資料 API 路由 — 所有儀表板資料
// ==========================================

const express = require('express');
const { getDb, prepareAll, prepareGet } = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();

// 所有資料路由均受認證保護
router.use(authMiddleware);

// 確保 DB 就緒
router.use(async (req, res, next) => {
  try {
    await getDb();
    next();
  } catch (err) {
    res.status(500).json({ error: '資料庫初始化失敗' });
  }
});

// GET /api/fleet
router.get('/fleet', (req, res) => {
  const fleet = prepareAll('SELECT * FROM fleet');
  res.json(fleet);
});

// GET /api/readiness
router.get('/readiness', (req, res) => {
  res.json({ ready: 78, maintenance: 12, standby: 7, upgrade: 3 });
});

// GET /api/missions
router.get('/missions', (req, res) => {
  const missions = prepareAll('SELECT * FROM missions');
  const now = new Date();
  const h = now.getHours();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${mo}${d}`;

  const result = missions.map((m, i) => {
    let startH = m.start_hour;
    let endH = m.end_hour;
    let curH = h;
    let status;

    if (endH <= startH) {
      endH += 24;
      if (curH < startH) curH += 24;
    }
    if (curH >= startH && curH < endH) status = '進行中';
    else if (curH < startH) status = '待命';
    else status = '已完成';

    const startStr = String(m.start_hour).padStart(2, '0') + ':00';
    const endStr = String(m.end_hour === 24 ? 0 : m.end_hour).padStart(2, '0') + ':00';

    return {
      id: `M-${dateStr}-${String(i + 1).padStart(3, '0')}`,
      type: m.type,
      area: m.area,
      aircraft: m.aircraft,
      base: m.base,
      time: `${startStr}-${endStr}`,
      status,
    };
  });

  res.json(result);
});

// GET /api/personnel
router.get('/personnel', (req, res) => {
  const personnel = prepareAll('SELECT * FROM personnel');
  res.json(personnel);
});

// GET /api/theaters
router.get('/theaters', (req, res) => {
  res.json([
    { name: '東部戰區', bases: ['蕪湖基地', '長興基地', '衢州基地'], x: 78, y: 52 },
    { name: '南部戰區', bases: ['遂溪基地', '昆明基地', '南寧基地'], x: 62, y: 72 },
    { name: '西部戰區', bases: ['成都基地', '武功基地', '和田基地'], x: 30, y: 48 },
    { name: '北部戰區', bases: ['鞍山基地', '濟南基地', '大連基地'], x: 75, y: 28 },
    { name: '中部戰區', bases: ['武漢基地', '鄭州基地', '大同基地'], x: 65, y: 42 },
  ]);
});

// GET /api/airbases
router.get('/airbases', (req, res) => {
  const airbases = prepareAll('SELECT * FROM airbases');
  const result = airbases.map(ab => ({
    ...ab,
    aircraft: prepareAll('SELECT * FROM airbase_aircraft WHERE airbase_id = ?', [ab.id]),
  }));
  res.json(result);
});

// GET /api/equipment
router.get('/equipment', (req, res) => {
  const equipment = prepareAll('SELECT * FROM equipment');
  const result = equipment.map(eq => {
    const specsRows = prepareAll('SELECT spec_key, spec_value FROM equipment_specs WHERE equipment_id = ?', [eq.id]);
    const specs = {};
    specsRows.forEach(s => { specs[s.spec_key] = s.spec_value; });
    return { ...eq, specs };
  });
  res.json(result);
});

// GET /api/exercises
router.get('/exercises', (req, res) => {
  const exercises = prepareAll('SELECT * FROM exercises ORDER BY year ASC');
  res.json(exercises);
});

// GET /api/alerts
router.get('/alerts', (req, res) => {
  res.json([
    { level: 'info', text: '東部戰區 | 殲-16 編隊例行巡邏任務已起飛 — 航線正常' },
    { level: 'warning', text: '南部戰區 | 預警雷達偵測不明飛行物 — 方位 225° 距離 380km — 持續監控中' },
    { level: 'info', text: '北部戰區 | 空警-500 數據鏈建立完成 — 態勢共享正常' },
    { level: 'danger', text: '東部戰區 | 外軍偵察機接近防空識別區 — 殲-20 雙機緊急升空攔截' },
    { level: 'info', text: '中部戰區 | 運-20 運輸任務預定 1400 時起飛 — 航材裝載完畢' },
    { level: 'warning', text: '西部戰區 | 高原機場氣象條件變化 — 風速 28 節 陣風 42 節 — 密切關注' },
    { level: 'info', text: '全軍 | 今日「金頭盔」對抗賽第三輪 — 1500 時開始 紅方 vs 藍方' },
    { level: 'danger', text: '南部戰區 | 偵測電子干擾訊號 — 來源定位中 — 啟動反制措施' },
    { level: 'info', text: '東部戰區 | 殲-35A 編隊完成夜間著陸訓練 — 全員安全歸場' },
    { level: 'warning', text: '台海周邊 | 外軍艦艇活動增加 — 空中監視任務延長 2 小時' },
  ]);
});

// GET /api/events
router.get('/events', (req, res) => {
  res.json([
    { level: 'info', msg: '殲-16 編隊 4 機起飛 — 東部戰區巡邏航線 EP-07' },
    { level: 'info', msg: '空警-500 態勢連結建立 — 延遲 12ms 正常' },
    { level: 'warn', msg: '雷達偵測空中目標 — 方位 185° 距離 420km 高度 FL350' },
    { level: 'info', msg: '運-20 載具裝載完成 — 預計 1400 時起飛' },
    { level: 'alert', msg: '不明電磁訊號偵測 — 頻段 X-Band — 來源分析中' },
    { level: 'info', msg: '殲-20 雙機完成空中加油 — 續航延長 1.5 小時' },
    { level: 'info', msg: '地面防空陣地 SA-21 系統自檢通過 — 戰備就緒' },
    { level: 'warn', msg: '西部戰區高原機場風速超標 — 暫停起降作業' },
    { level: 'info', msg: '殲-10C 編隊完成空戰對抗訓練 — 紅方勝出' },
    { level: 'alert', msg: '擾中線活動偵測 — 殲-16 緊急轉向攔截航線' },
    { level: 'info', msg: '轟-6K 導彈掛載完成 — 進入待命狀態' },
    { level: 'info', msg: '衛星通訊鏈路切換完成 — Ka 頻段正常' },
    { level: 'warn', msg: '南海方向偵測外軍 P-8A 反潛機 — 持續跟蹤' },
    { level: 'info', msg: '殲-35A 首批飛行員資格認證完成 — 5 人合格' },
    { level: 'info', msg: '攻擊-11 無人機系統測試 — 自主編隊飛行正常' },
  ]);
});

module.exports = router;

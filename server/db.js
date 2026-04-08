// ==========================================
// PLAAF Dashboard — SQLite 資料庫初始化 + Seed
// 使用 sql.js（純 JavaScript SQLite）
// ==========================================

const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'plaaf.db');

let db = null;
let dbReady = null;

function getDb() {
  if (!dbReady) {
    dbReady = initDatabase();
  }
  return dbReady;
}

async function initDatabase() {
  const SQL = await initSqlJs();

  // 嘗試載入現有資料庫
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initTables();
  seedIfEmpty();
  saveDb();

  return db;
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// 便利方法：模仿 better-sqlite3 的 API
function prepareAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function prepareGet(sql, params = []) {
  const results = prepareAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function prepareRun(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0];
  return { lastInsertRowid: lastId ? lastId.values[0][0] : 0 };
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS fleet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      code TEXT NOT NULL,
      role TEXT NOT NULL,
      count INTEGER NOT NULL,
      ready INTEGER NOT NULL,
      color TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS airbases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      theater TEXT NOT NULL,
      province TEXT NOT NULL,
      lat REAL, lon REAL,
      x REAL, y REAL,
      runway TEXT,
      status TEXT DEFAULT 'operational',
      description TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS airbase_aircraft (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      airbase_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      code TEXT NOT NULL,
      count INTEGER NOT NULL,
      color TEXT NOT NULL,
      FOREIGN KEY (airbase_id) REFERENCES airbases(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nickname TEXT,
      type TEXT NOT NULL,
      image TEXT,
      description TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      spec_key TEXT NOT NULL,
      spec_value TEXT NOT NULL,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      scale TEXT,
      participants TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      count INTEGER NOT NULL,
      image TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      area TEXT NOT NULL,
      aircraft TEXT NOT NULL,
      base TEXT,
      start_hour INTEGER NOT NULL,
      end_hour INTEGER NOT NULL
    )
  `);
  // 登入紀錄
  db.run(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      display_name TEXT,
      role TEXT,
      ip TEXT,
      user_agent TEXT,
      success INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // 操作紀錄
  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      display_name TEXT,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function seedIfEmpty() {
  const result = db.exec("SELECT COUNT(*) as c FROM users");
  const userCount = result[0].values[0][0];
  if (userCount > 0) return;

  console.log('📦 Seeding database...');

  // ===== Users =====
  prepareRun('INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    ['admin', bcrypt.hashSync('admin123', 10), '系統管理員', 'admin']);
  prepareRun('INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    ['operator', bcrypt.hashSync('op2026', 10), '值班操作員', 'operator']);

  // ===== Fleet =====
  const fleetData = [
    ['殲-20', 'J-20', '第五代隱身戰鬥機', 250, 218, '#00ffc8'],
    ['殲-16', 'J-16', '多用途戰鬥機', 350, 310, '#00bfff'],
    ['殲-10C', 'J-10C', '輕型多用途戰鬥機', 480, 425, '#7b68ee'],
    ['殲-11B', 'J-11B', '重型制空戰鬥機', 260, 220, '#ff6b6b'],
    ['轟-6K/N', 'H-6K/N', '遠程戰略轟炸機', 180, 155, '#ffa500'],
    ['運-20', 'Y-20', '大型戰略運輸機', 85, 72, '#32cd32'],
    ['空警-500', 'KJ-500', '預警指揮機', 30, 26, '#ff69b4'],
    ['殲-35A', 'J-35A', '第五代中型隱身戰鬥機', 60, 55, '#e0e0e0'],
  ];
  fleetData.forEach(f => prepareRun('INSERT INTO fleet (type, code, role, count, ready, color) VALUES (?, ?, ?, ?, ?, ?)', f));

  // ===== Personnel =====
  [
    ['飛行員', 8500, 'images/pilots.png'],
    ['地勤人員', 45000, 'images/ground_crew.png'],
    ['指揮人員', 3200, 'images/commanders.png'],
    ['技術人員', 28000, 'images/technical.png'],
    ['後勤保障', 35000, 'images/logistics.png'],
  ].forEach(p => prepareRun('INSERT INTO personnel (role, count, image) VALUES (?, ?, ?)', p));

  // ===== Missions =====
  [
    ['戰備巡邏', '東部戰區', '殲-16 ×4', '長興基地', 6, 10],
    ['遠海訓練', '南部戰區', '轟-6K ×2, 殲-11B ×4', '遂溪陵水基地', 7, 14],
    ['對抗演練', '西部戰區', '殲-20 ×4, 殲-10C ×6', '成都鳳凰山基地', 9, 12],
    ['運輸勤務', '中部戰區', '運-20 ×2', '武漢基地', 8, 16],
    ['預警偵巡', '北部戰區', '空警-500 ×1, 殲-10C ×2', '齊齊哈爾基地', 10, 18],
    ['夜間訓練', '東部戰區', '殲-20 ×2, 殲-16 ×4', '蕪湖基地', 20, 24],
  ].forEach(m => prepareRun('INSERT INTO missions (type, area, aircraft, base, start_hour, end_hour) VALUES (?, ?, ?, ?, ?, ?)', m));

  // ===== Airbases =====
  const airbasesData = [
    { name: '蕪湖基地', theater: '東部戰區', province: '安徽', lat: 31.35, lon: 117.73, x: 79, y: 50, runway: '3,400m', description: '東部戰區空軍重點基地，部署殲-20隱身戰鬥機旅，擔負東海方向制空作戰任務。', aircraft: [{ type: '殲-20', code: 'J-20', count: 40, color: '#00ffc8' }, { type: '殲-16', code: 'J-16', count: 24, color: '#00bfff' }] },
    { name: '長興基地', theater: '東部戰區', province: '浙江', lat: 30.93, lon: 119.91, x: 82, y: 52, runway: '3,200m', description: '東海方向重要前置基地，殲-16多用途戰鬥機與殲-10C混合部署。', aircraft: [{ type: '殲-16', code: 'J-16', count: 32, color: '#00bfff' }, { type: '殲-10C', code: 'J-10C', count: 24, color: '#7b68ee' }] },
    { name: '衢州基地', theater: '東部戰區', province: '浙江', lat: 28.97, lon: 118.87, x: 80, y: 55, runway: '3,000m', description: '東南沿海防空要地，負責台海方向空防巡邏與攔截任務。', aircraft: [{ type: '殲-10C', code: 'J-10C', count: 36, color: '#7b68ee' }, { type: '殲-11B', code: 'J-11B', count: 24, color: '#ff6b6b' }] },
    { name: '濟南遙墻基地', theater: '東部戰區', province: '山東', lat: 36.86, lon: 117.22, x: 78, y: 38, runway: '3,600m', description: '遠程轟炸機主力基地之一，轟-6K/N擔負西太平洋方向戰略威懾。', aircraft: [{ type: '轟-6K/N', code: 'H-6K/N', count: 36, color: '#ffa500' }, { type: '殲-16', code: 'J-16', count: 24, color: '#00bfff' }] },
    { name: '遂溪基地', theater: '南部戰區', province: '廣東', lat: 21.36, lon: 110.35, x: 72, y: 72, runway: '3,500m', description: '南海方向核心基地，殲-20旅於此部署，擔負南海制空與巡邏任務。', aircraft: [{ type: '殲-20', code: 'J-20', count: 32, color: '#00ffc8' }, { type: '殲-11B', code: 'J-11B', count: 24, color: '#ff6b6b' }] },
    { name: '南寧基地', theater: '南部戰區', province: '廣西', lat: 22.61, lon: 108.17, x: 68, y: 70, runway: '3,200m', description: '南海西部防空重鎮，兼具預警指揮能力。', aircraft: [{ type: '殲-10C', code: 'J-10C', count: 36, color: '#7b68ee' }, { type: '空警-500', code: 'KJ-500', count: 4, color: '#ff69b4' }] },
    { name: '昆明基地', theater: '南部戰區', province: '雲南', lat: 24.99, lon: 102.74, x: 55, y: 65, runway: '3,400m', description: '西南方向前沿基地，兼顧高原作戰訓練與邊境防空。', aircraft: [{ type: '殲-16', code: 'J-16', count: 24, color: '#00bfff' }, { type: '殲-10C', code: 'J-10C', count: 24, color: '#7b68ee' }] },
    { name: '成都鳳凰山基地', theater: '西部戰區', province: '四川', lat: 30.58, lon: 103.95, x: 48, y: 52, runway: '3,800m', description: '西部戰區空軍司令部所在地，殲-20最大部署基地，高原作戰核心力量。', aircraft: [{ type: '殲-20', code: 'J-20', count: 48, color: '#00ffc8' }, { type: '殲-10C', code: 'J-10C', count: 36, color: '#7b68ee' }] },
    { name: '武功基地', theater: '西部戰區', province: '陝西', lat: 34.26, lon: 108.21, x: 55, y: 42, runway: '3,400m', description: '西部戰略轟炸機基地，轟-6K/N主力部署地，擔負西向戰略打擊任務。', aircraft: [{ type: '轟-6K/N', code: 'H-6K/N', count: 48, color: '#ffa500' }] },
    { name: '和田基地', theater: '西部戰區', province: '新疆', lat: 37.04, lon: 79.87, x: 22, y: 40, runway: '3,600m', description: '西部邊境高原基地，常年高強度訓練，擔負西部國土防空。', aircraft: [{ type: '殲-11B', code: 'J-11B', count: 36, color: '#ff6b6b' }, { type: '殲-10C', code: 'J-10C', count: 24, color: '#7b68ee' }] },
    { name: '烏魯木齊地窩堡基地', theater: '西部戰區', province: '新疆', lat: 43.91, lon: 87.47, x: 25, y: 28, runway: '3,600m', description: '西北戰略運輸與作戰基地，兼具空運投送與制空能力。', aircraft: [{ type: '殲-16', code: 'J-16', count: 24, color: '#00bfff' }, { type: '運-20', code: 'Y-20', count: 8, color: '#32cd32' }] },
    { name: '鞍山基地', theater: '北部戰區', province: '遼寧', lat: 41.10, lon: 122.85, x: 82, y: 28, runway: '3,400m', description: '北部戰區隱身戰鬥機核心基地，殲-20 與殲-35A 雙隱身機型聯合部署。', aircraft: [{ type: '殲-20', code: 'J-20', count: 40, color: '#00ffc8' }, { type: '殲-35A', code: 'J-35A', count: 24, color: '#e0e0e0' }] },
    { name: '大連基地', theater: '北部戰區', province: '遼寧', lat: 38.97, lon: 121.54, x: 82, y: 32, runway: '3,200m', description: '渤海灣防空重鎮，殲-16主力基地之一，兼具海上作戰能力。', aircraft: [{ type: '殲-16', code: 'J-16', count: 36, color: '#00bfff' }, { type: '殲-11B', code: 'J-11B', count: 24, color: '#ff6b6b' }] },
    { name: '齊齊哈爾基地', theater: '北部戰區', province: '黑龍江', lat: 47.24, lon: 123.92, x: 80, y: 18, runway: '3,200m', description: '北部縱深防禦基地，負責北方空域預警與巡邏。', aircraft: [{ type: '殲-11B', code: 'J-11B', count: 36, color: '#ff6b6b' }, { type: '空警-500', code: 'KJ-500', count: 4, color: '#ff69b4' }] },
    { name: '武漢基地', theater: '中部戰區', province: '湖北', lat: 30.78, lon: 114.21, x: 72, y: 52, runway: '3,600m', description: '戰略空運核心基地，運-20 主力部署地，擔負全軍空運投送任務。', aircraft: [{ type: '運-20', code: 'Y-20', count: 32, color: '#32cd32' }, { type: '空警-500', code: 'KJ-500', count: 8, color: '#ff69b4' }] },
    { name: '大同基地', theater: '中部戰區', province: '山西', lat: 40.06, lon: 113.29, x: 70, y: 32, runway: '3,200m', description: '華北縱深防空重鎮，常年承辦「金頭盔」空戰對抗競賽。', aircraft: [{ type: '殲-16', code: 'J-16', count: 36, color: '#00bfff' }, { type: '殲-10C', code: 'J-10C', count: 24, color: '#7b68ee' }] },
    { name: '鄭州基地', theater: '中部戰區', province: '河南', lat: 34.53, lon: 113.84, x: 72, y: 42, runway: '3,400m', description: '殲-35A 新型隱身戰鬥機換裝基地，中部戰區防空核心。', aircraft: [{ type: '殲-35A', code: 'J-35A', count: 36, color: '#e0e0e0' }, { type: '殲-10C', code: 'J-10C', count: 24, color: '#7b68ee' }] },
    { name: '信陽基地', theater: '中部戰區', province: '河南', lat: 32.13, lon: 114.07, x: 72, y: 48, runway: '3,000m', description: '無人攻擊機部署基地，攻擊-11 隱身無人機在此進行實戰訓練。', aircraft: [{ type: '運-20', code: 'Y-20', count: 16, color: '#32cd32' }, { type: '攻擊-11', code: 'GJ-11', count: 12, color: '#9b59b6' }] },
    { name: '遂溪陵水基地', theater: '南部戰區', province: '海南', lat: 18.51, lon: 110.03, x: 70, y: 78, runway: '3,400m', description: '中國最南端空軍基地，直面南海，擔負南海巡邏、偵察與遠程打擊任務。', aircraft: [{ type: '殲-11B', code: 'J-11B', count: 24, color: '#ff6b6b' }, { type: '空警-500', code: 'KJ-500', count: 6, color: '#ff69b4' }, { type: '轟-6K/N', code: 'H-6K/N', count: 12, color: '#ffa500' }] },
  ];

  airbasesData.forEach(ab => {
    const result = prepareRun('INSERT INTO airbases (name, theater, province, lat, lon, x, y, runway, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ab.name, ab.theater, ab.province, ab.lat, ab.lon, ab.x, ab.y, ab.runway, 'operational', ab.description]);
    const airbaseId = result.lastInsertRowid;
    ab.aircraft.forEach(a => {
      prepareRun('INSERT INTO airbase_aircraft (airbase_id, type, code, count, color) VALUES (?, ?, ?, ?, ?)',
        [airbaseId, a.type, a.code, a.count, a.color]);
    });
  });

  // ===== Equipment =====
  const equipData = [
    { name: '殲-20 (J-20)', nickname: '威龍', type: '第五代隱身戰鬥機', image: 'images/j20.png', description: '殲-20是中國自主研發的第五代隱身戰鬥機，具備超音速巡航、超視距攻擊、高機動性和隱身能力。2017年正式列裝部隊，是中國空軍制空作戰的核心裝備。', specs: { manufacturer: '成都飛機工業集團', firstFlight: '2011年1月11日', length: '20.4 m', wingspan: '13.5 m', maxSpeed: '2,100 km/h (Mach 2.0+)', range: '5,500 km', combatRadius: '2,000 km', ceiling: '20,000 m', weapons: 'PL-15/PL-10E 空對空飛彈、精確導引炸彈' } },
    { name: '殲-16 (J-16)', nickname: '', type: '多用途戰鬥機', image: 'images/j16.png', description: '殲-16是一款重型雙座多用途戰鬥機，具備強大的對空、對地、對海攻擊能力。配備先進的主動相控陣雷達和電子戰系統，是中國空軍攻防兼備的主力機型。', specs: { manufacturer: '瀋陽飛機工業集團', firstFlight: '2011年10月', length: '22.0 m', wingspan: '14.7 m', maxSpeed: '2,400 km/h (Mach 2.0+)', range: '3,900 km', combatRadius: '1,500 km', ceiling: '17,000 m', weapons: 'PL-15/PL-12/PL-10 空對空飛彈、反艦飛彈、精確導引炸彈' } },
    { name: '殲-10C (J-10C)', nickname: '猛龍', type: '輕型多用途戰鬥機', image: 'images/j10c.png', description: '殲-10C是殲-10系列的最新改型，配備國產渦扇-10B發動機和主動相控陣雷達，是中國空軍國土防空和近距作戰的中堅力量。', specs: { manufacturer: '成都飛機工業集團', firstFlight: '2013年12月', length: '16.9 m', wingspan: '9.75 m', maxSpeed: '2,200 km/h (Mach 1.8+)', range: '3,200 km', combatRadius: '1,200 km', ceiling: '18,000 m', weapons: 'PL-15/PL-10 空對空飛彈、雷射導引炸彈' } },
    { name: '轟-6K/N (H-6K/N)', nickname: '戰神', type: '遠程戰略轟炸機', image: 'images/h6k.png', description: '轟-6K/N是中國空軍遠程打擊的核心力量，可搭載巡航飛彈執行戰略威懾與遠海打擊任務。H-6N型增加了空中加油能力，並可掛載空射彈道飛彈。', specs: { manufacturer: '西安飛機工業集團', firstFlight: '2007年（H-6K）', length: '34.8 m', wingspan: '33.0 m', maxSpeed: '1,050 km/h', range: '8,000+ km', combatRadius: '3,500 km', ceiling: '12,000 m', weapons: '長劍-20巡航飛彈 ×6、鷹擊-12反艦飛彈' } },
    { name: '運-20 (Y-20)', nickname: '鯤鵬', type: '大型戰略運輸機', image: 'images/y20.png', description: '運-20是中國自主研發的大型戰略運輸機，大幅提升了空軍的戰略投送能力。可運載主戰坦克、裝甲車輛等重型裝備，也衍生出空中加油機等特種改型。', specs: { manufacturer: '西安飛機工業集團', firstFlight: '2013年1月26日', length: '47.0 m', wingspan: '45.0 m', maxSpeed: '830 km/h', range: '7,800 km', payload: '66,000 kg', ceiling: '13,000 m', weapons: '無（運輸機）' } },
    { name: '空警-500 (KJ-500)', nickname: '', type: '預警指揮機', image: 'images/kj500.png', description: '空警-500是中國空軍新一代預警指揮機，採用圓盤式三面陣雷達天線，具備360°無盲區探測能力，為作戰機群提供態勢感知和指揮控制。', specs: { manufacturer: '中國電子科技集團 / 陝西飛機工業', firstFlight: '2014年', length: '34.0 m', wingspan: '38.0 m', maxSpeed: '550 km/h', range: '5,700 km', endurance: '10+ 小時', ceiling: '10,000 m', radar: '三面固定式主動相控陣雷達' } },
    { name: '殲-35A (J-35A)', nickname: '鶻鷹', type: '第五代中型隱身戰鬥機', image: 'images/j35a.png', description: '殲-35A是中國第二款第五代隱身戰鬥機，2024年珠海航展首次公開亮相。作為中型戰鬥機，與殲-20形成高低搭配，進一步強化中國空軍的隱身作戰體系。', specs: { manufacturer: '瀋陽飛機工業集團', firstFlight: '2024年公開亮相', length: '17.3 m', wingspan: '11.5 m', maxSpeed: '2,200 km/h (Mach 1.8+)', range: '4,000 km', combatRadius: '1,350 km', ceiling: '18,000 m', weapons: 'PL-15/PL-10 空對空飛彈' } },
    { name: '攻擊-11 (GJ-11)', nickname: '利劍', type: '隱身無人攻擊機', image: 'images/gj11.png', description: '攻擊-11是中國自主研發的大型飛翼式隱身無人攻擊機，具備高度隱身性能。可與殲-20等有人戰鬥機協同作戰，執行偵察、打擊等高危險任務。', specs: { manufacturer: '洪都航空工業集團', firstFlight: '2019年（首次公開）', length: '~12 m', wingspan: '~14 m', maxSpeed: '亞音速', range: '~4,000 km', combatRadius: '~1,500 km', ceiling: '~15,000 m', weapons: '內置彈艙、精確導引彈藥' } },
    { name: '殲-11B (J-11B)', nickname: '', type: '重型制空戰鬥機', image: 'images/j11b.png', description: '殲-11B是基於蘇-27SK國產化改進的重型制空戰鬥機，配備國產渦扇-10A發動機和國產航電系統。雖為三代半機型但數量龐大，仍是中國空軍國土防空的重要力量。', specs: { manufacturer: '瀋陽飛機工業集團', firstFlight: '2003年', length: '21.9 m', wingspan: '14.7 m', maxSpeed: '2,500 km/h (Mach 2.35)', range: '3,530 km', combatRadius: '1,500 km', ceiling: '19,000 m', weapons: 'PL-12/PL-8B 空對空飛彈、航空炸彈' } },
  ];

  equipData.forEach(eq => {
    const result = prepareRun('INSERT INTO equipment (name, nickname, type, image, description) VALUES (?, ?, ?, ?, ?)',
      [eq.name, eq.nickname, eq.type, eq.image, eq.description]);
    const eqId = result.lastInsertRowid;
    Object.entries(eq.specs).forEach(([key, val]) => {
      prepareRun('INSERT INTO equipment_specs (equipment_id, spec_key, spec_value) VALUES (?, ?, ?)',
        [eqId, key, val]);
    });
  });

  // ===== Exercises =====
  [
    [2015, '「紅劍-2015」演習', '2015年5月-6月', '西北大漠', '空軍最大規模體系對抗演習，紅藍雙方多兵機種聯合對抗，檢驗新型作戰編組和戰法訓法。', '大型', '殲-11、殲-10、轟-6、空警-2000 等多型戰機'],
    [2016, '「紅劍-2016」體系對抗', '2016年5月-7月', '西北某訓練基地', '空軍年度最大規模對抗演習，首次實現全要素全過程體系對抗，提升空軍實戰化訓練水準。', '大型', '殲-20（首次參演）、殲-16、殲-10C、空警-500'],
    [2017, '遠海遠洋訓練常態化', '2017年全年', '西太平洋、南海', '空軍戰機多次飛越宮古海峽、巴士海峽，轟-6K編隊繞島巡航常態化實施，展示遠海作戰能力。', '中型', '轟-6K、蘇-30、殲-11、空警-500、運-8'],
    [2018, '「紅劍-2018」/ 繞島巡航', '2018年4月-11月', '西北訓練基地 / 台海周邊', '年度體系對抗演練升級，同年空軍多次組織繞島巡航，蘇-35首次參加繞島飛行。', '大型', '殲-20、殲-16、殲-10C、蘇-35、轟-6K'],
    [2019, '國慶70週年閱兵空中梯隊', '2019年10月1日', '北京天安門', '中華人民共和國成立70週年閱兵，空中梯隊展示殲-20五機編隊、運-20、空警-500等最新裝備。', '特大型', '殲-20 ×5、運-20、空警-500、轟-6N 等160+架'],
    [2020, '常態化戰巡台海', '2020年全年', '台灣海峽周邊', '解放軍空軍全年出動數百架次戰機進入台灣西南防空識別區，形成常態化戰巡態勢。', '大型', '殲-16、殲-10C、殲-11、轟-6、空警-500、運-8'],
    [2021, '台海大規模空中兵力展示', '2021年10月', '台灣海峽周邊', '10月1日至4日連續出動149架次軍機進入台灣防空識別區，創下單日最高紀錄56架次，包括殲-16、轟-6等。', '特大型', '殲-16 ×40+、轟-6 ×12、殲-11 ×24、空警-500 ×4'],
    [2022, '環台軍事演習', '2022年8月4日-10日', '台灣周邊六大區域', '針對時任美國眾議院議長佩洛西訪台，解放軍在台灣周邊劃定六大區域實施大規模聯合軍演，東風飛彈飛越台灣上空。', '特大型', '殲-20、殲-16、殲-10C、轟-6K、空警-500、無人機、東風飛彈'],
    [2023, '「聯合利劍」環台演習', '2023年4月8日-10日', '台灣周邊海空域', '針對台灣地區領導人過境美國，解放軍實施「聯合利劍」演習，模擬對台封鎖和聯合打擊。空軍出動殲-20隱身戰鬥機群。', '大型', '殲-20、殲-16、殲-10C、轟-6K、空警-500'],
    [2024, '「聯合利劍-2024A/B」演習', '2024年5月 / 10月', '台灣周邊海空域', '2024年實施兩波次「聯合利劍」演習。2024A（5月）針對台灣地區新領導人就職；2024B（10月）進一步強化聯合奪控能力。殲-35A首次在珠海航展公開亮相。', '特大型', '殲-20、殲-35A、殲-16、殲-10C、轟-6K/N、空警-500、攻擊-11'],
    [2025, '西太平洋遠海訓練 / 體系對抗演練', '2025年全年', '西太平洋 / 各戰區', '空軍加大遠海訓練頻次，多次穿越島鏈進入西太平洋。殲-20、殲-35A雙隱身機型聯合演練，運-20加油型持續形成戰鬥力。', '大型', '殲-20、殲-35A、殲-16、轟-6N、運-20、運油-20、空警-500'],
    [2026, '「金頭盔-2026」/ 春季戰備拉動', '2026年1月-3月（持續中）', '各戰區', '2026年度「金頭盔」空戰對抗競賽啟動，同步進行春季全軍戰備拉動。各戰區空軍實施高強度實戰化訓練，檢驗新年度作戰方案。', '大型', '殲-20、殲-35A、殲-16、殲-10C、空警-500、攻擊-11'],
  ].forEach(e => prepareRun('INSERT INTO exercises (year, name, date, location, description, scale, participants) VALUES (?, ?, ?, ?, ?, ?, ?)', e));

  console.log('✅ Database seeded successfully!');
}

module.exports = { getDb, prepareAll, prepareGet, prepareRun, saveDb };

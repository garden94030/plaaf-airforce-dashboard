// ==========================================
// PLAAF 儀表板 — GitHub Pages 靜態資料層
// ==========================================

const STATIC_DATA_FILES = {
  fleet: 'data/fleet.json',
  readiness: 'data/readiness.json',
  missions: 'data/missions.json',
  personnel: 'data/personnel.json',
  theaters: 'data/theaters.json',
  airbases: 'data/airbases.json',
  equipment: 'data/equipment.json',
  exercises: 'data/exercises.json',
  alerts: 'data/alerts.json',
  events: 'data/events.json',
  'admin/stats': 'data/admin-stats.json',
  'admin/login-logs?limit=50': 'data/admin-login-logs.json',
  'admin/operation-logs?limit=50': 'data/admin-operation-logs.json',
};

const STATIC_CACHE = new Map();

function getAuthHeaders() {
  const token = localStorage.getItem('plaaf_token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('plaaf_user') || 'null');
  } catch {
    return null;
  }
}

function ensureAuthenticated() {
  if (localStorage.getItem('plaaf_token')) {
    return true;
  }

  localStorage.removeItem('plaaf_user');
  window.location.href = 'login.html';
  return false;
}

async function fetchStaticJson(path) {
  if (STATIC_CACHE.has(path)) {
    return STATIC_CACHE.get(path);
  }

  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Static data load failed: ${path}`);
  }

  const data = await response.json();
  STATIC_CACHE.set(path, data);
  return data;
}

function normalizeEndpoint(endpoint) {
  return String(endpoint || '')
    .replace(/^\/+/, '')
    .replace(/^api\/?/, '');
}

function computeMissionStatus(timeRange) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startText, endText] = String(timeRange || '').split('-');
  const [startH, startM] = String(startText || '00:00').split(':').map(Number);
  const [endH, endM] = String(endText || '00:00').split(':').map(Number);

  let startMinutes = (startH || 0) * 60 + (startM || 0);
  let endMinutes = (endH || 0) * 60 + (endM || 0);
  let current = currentMinutes;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
    if (current < startMinutes) {
      current += 24 * 60;
    }
  }

  if (current >= startMinutes && current < endMinutes) {
    return '進行中';
  }
  if (current < startMinutes) {
    return '待命';
  }
  return '已完成';
}

function normalizeMissions(missions) {
  return (missions || []).map((mission) => ({
    ...mission,
    status: computeMissionStatus(mission.time),
  }));
}

async function apiFetch(endpoint) {
  if (!ensureAuthenticated()) {
    return null;
  }

  const normalized = normalizeEndpoint(endpoint);
  const currentUser = getCurrentUser();

  if (
    normalized.startsWith('admin/') &&
    (!currentUser || currentUser.role !== 'admin')
  ) {
    console.warn(`Admin endpoint denied in static mode: ${normalized}`);
    return null;
  }

  const mappedPath = STATIC_DATA_FILES[normalized];
  if (!mappedPath) {
    console.warn(`Unknown static endpoint: ${normalized}`);
    return null;
  }

  try {
    const data = await fetchStaticJson(mappedPath);
    if (normalized === 'missions') {
      return localizePayload(normalized, normalizeMissions(data));
    }
    return localizePayload(normalized, data);
  } catch (err) {
    console.error(`[Static API] ${normalized} failed:`, err);
    return null;
  }
}

let FLEET_DATA = [];
let READINESS_DATA = { ready: 78, maintenance: 12, standby: 7, upgrade: 3 };
let PERSONNEL_DATA = [];
let THEATER_BASES = [];
let AIRBASE_DATA = [];
let EQUIPMENT_DATA = [];
let EXERCISES_DATA = [];
let ALERTS_DATA = [];
let EVENTS_DATA = [];

let _missionData = [];
function getMissionData() {
  return _missionData;
}

async function loadAllData() {
  console.log('📡 Loading static data for GitHub Pages...');

  const [
    fleet,
    readiness,
    missions,
    personnel,
    theaters,
    airbases,
    equipment,
    exercises,
    alerts,
    events,
  ] = await Promise.all([
    apiFetch('/fleet'),
    apiFetch('/readiness'),
    apiFetch('/missions'),
    apiFetch('/personnel'),
    apiFetch('/theaters'),
    apiFetch('/airbases'),
    apiFetch('/equipment'),
    apiFetch('/exercises'),
    apiFetch('/alerts'),
    apiFetch('/events'),
  ]);

  if (fleet) FLEET_DATA = fleet;
  if (readiness) READINESS_DATA = readiness;
  if (missions) _missionData = missions;
  if (personnel) PERSONNEL_DATA = personnel;
  if (theaters) THEATER_BASES = theaters;
  if (airbases) AIRBASE_DATA = airbases;
  if (equipment) EQUIPMENT_DATA = equipment;
  if (exercises) EXERCISES_DATA = exercises;
  if (alerts) ALERTS_DATA = alerts;
  if (events) EVENTS_DATA = events;

  console.log('✅ Static demo data ready');
  return true;
}

async function refreshMissions() {
  const missions = await apiFetch('/missions');
  if (missions) {
    _missionData = missions;
  }
}

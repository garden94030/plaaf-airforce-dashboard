// ==========================================
// 中共空軍敵情儀錶板 - 主邏輯
// ==========================================

function initLanguageToggle() {
    const host = document.querySelector('.header-right');
    if (!host || document.getElementById('languageToggle')) return;

    const button = document.createElement('button');
    button.id = 'languageToggle';
    button.className = 'lang-toggle-btn';
    button.textContent = t('language_toggle');
    button.title = t('language_toggle_title');
    button.setAttribute('aria-label', t('language_toggle_title'));
    button.addEventListener('click', () => {
        setCurrentLanguage(isEnglishMode() ? 'zh' : 'en');
        window.location.reload();
    });

    host.prepend(button);
}

function applyStaticTranslations() {
    document.title = t('browser_title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta_description'));

    const headerTitle = document.querySelector('.header-title h1');
    if (headerTitle) headerTitle.textContent = t('dashboard_title');
    const subtitle = document.querySelector('.header-title .subtitle');
    if (subtitle) subtitle.textContent = t('dashboard_subtitle');
    const credits = document.getElementById('dashboardCredits');
    if (credits) credits.textContent = t('author_credit');

    const statusTexts = document.querySelectorAll('.header-center .status-indicator span:last-child');
    if (statusTexts[0]) statusTexts[0].textContent = t('system_normal');
    if (statusTexts[1]) statusTexts[1].textContent = t('data_link');
    if (statusTexts[2]) statusTexts[2].textContent = t('threat_level');

    const tickerLabel = document.querySelector('.ticker-label');
    if (tickerLabel) tickerLabel.textContent = t('ticker_label');

    const navMap = {
        overview: 'nav_overview',
        airbases: 'nav_airbases',
        equipment: 'nav_equipment',
        exercises: 'nav_exercises',
        admin: 'nav_admin',
    };
    document.querySelectorAll('.nav-tab').forEach((button) => {
        const key = navMap[button.dataset.tab];
        if (key) button.textContent = t(key);
    });

    const statLabels = document.querySelectorAll('.stat-label');
    const statSubs = document.querySelectorAll('.stat-sub');
    const statLabelKeys = ['stat_aircraft', 'stat_readiness', 'stat_missions', 'stat_personnel', 'stat_theaters'];
    const statSubKeys = ['stat_aircraft_sub', 'stat_readiness_sub', 'stat_missions_sub', 'stat_personnel_sub', 'stat_theaters_sub'];
    statLabels.forEach((label, index) => { if (statLabelKeys[index]) label.textContent = t(statLabelKeys[index]); });
    statSubs.forEach((label, index) => { if (statSubKeys[index]) label.textContent = t(statSubKeys[index]); });

    const panelTitles = document.querySelectorAll('#tab-overview .panel-title');
    const panelKeys = ['fleet_title', 'readiness_title', 'missions_title', 'radar_title', 'map_title', 'log_title', 'personnel_title'];
    panelTitles.forEach((panel, index) => {
        const icon = panel.querySelector('.icon')?.outerHTML || '';
        const key = panelKeys[index];
        if (key) panel.innerHTML = `${icon} ${t(key)}`;
    });

    const readinessLabel = document.querySelector('.readiness-label');
    if (readinessLabel) readinessLabel.textContent = t('readiness_center');
    const readinessTexts = document.querySelectorAll('.readiness-text');
    const readinessKeys = ['readiness_ready', 'readiness_maint', 'readiness_standby', 'readiness_upgrade'];
    readinessTexts.forEach((node, index) => { if (readinessKeys[index]) node.textContent = t(readinessKeys[index]); });

    const missionHeaders = document.querySelectorAll('.mission-table thead th');
    const headerKeys = ['table_id', 'table_type', 'table_theater', 'table_base', 'table_aircraft', 'table_time', 'table_status'];
    missionHeaders.forEach((node, index) => { if (headerKeys[index]) node.textContent = t(headerKeys[index]); });
    const adminTables = document.querySelectorAll('#tab-admin table');
    if (adminTables[0]) {
        const loginHeaders = adminTables[0].querySelectorAll('th');
        const loginKeys = ['col_time', 'col_account', 'col_ip', 'table_status'];
        loginHeaders.forEach((node, index) => { if (loginKeys[index]) node.textContent = t(loginKeys[index]); });
    }
    if (adminTables[1]) {
        const opHeaders = adminTables[1].querySelectorAll('th');
        const opKeys = ['col_time', 'col_operator', 'col_action', 'col_target', 'table_status'];
        opHeaders.forEach((node, index) => { if (opKeys[index]) node.textContent = t(opKeys[index]); });
    }

    const exercisesTitle = document.querySelector('#tab-exercises .panel-title');
    if (exercisesTitle) exercisesTitle.innerHTML = '<span class="icon">⚔</span> ' + t('exercises_title');

    const footerTexts = document.querySelectorAll('.footer-text');
    if (footerTexts[0]) footerTexts[0].textContent = t('footer_name');
    if (footerTexts[1]) footerTexts[1].textContent = t('footer_demo');
    if (footerTexts[2]) footerTexts[2].textContent = `${t('footer_updated')}: 2026-03-17`;
    const footerStatus = document.querySelector('.footer-status');
    if (footerStatus) footerStatus.innerHTML = '<span class="status-dot green"></span> ' + t('footer_online');

    const adminLabels = document.querySelectorAll('#tab-admin .stat-label');
    const adminKeys = ['admin_total_users', 'admin_total_logins', 'admin_failed_logins', 'admin_total_ops'];
    adminLabels.forEach((node, index) => { if (adminKeys[index]) node.textContent = t(adminKeys[index]); });
    const trend = document.querySelector('#tab-admin .stat-trend');
    if (trend) trend.innerHTML = `${t('admin_today_logins')} <span id="adminTodayLogins">0</span>${t('admin_count_suffix') ? ' ' + t('admin_count_suffix') : ''}`;
    const adminPanelTitles = document.querySelectorAll('#tab-admin .panel-title');
    if (adminPanelTitles[0]) adminPanelTitles[0].textContent = t('admin_login_title');
    if (adminPanelTitles[1]) adminPanelTitles[1].textContent = t('admin_op_title');
    const refreshBtn = document.querySelector('#tab-admin .view-btn');
    if (refreshBtn) refreshBtn.textContent = t('refresh');
}

document.addEventListener('DOMContentLoaded', async () => {
    applyStaticTranslations();
    // ===== Auth Guard =====
    const token = localStorage.getItem('plaaf_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 顯示使用者資訊 + 登出按鈕
    const userData = initUserInfo();
    initLanguageToggle();

    // 先初始化不需要資料的元件
    initParticles();
    initClock();
    initTabs(userData);
    initScrollToTop();

    // 從 API 載入資料
    const loaded = await loadAllData();
    if (!loaded) return; // loadAllData 會在 401 時自動跳轉

    // 初始化需要資料的元件
    initAlertTicker();
    initCountUp();
    initFleetChart();
    initReadinessRing();
    initMissionTable();
    initRadar();
    initTheaterMap();
    initEventLog();
    initPersonnel();
    initAirbases();
    initEquipment();
    initExercises();
    
    // 如果是管理員，載入管理端資料
    if (userData && userData.role === 'admin') {
        loadAdminData();
    }
});

// ===== 使用者資訊 + 登出 =====
function initUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (!userInfo) return null;

    const userData = JSON.parse(localStorage.getItem('plaaf_user') || '{}');
    const displayName = mapValue(userData.displayName || userData.username || t('role_operator'), USER_DISPLAY_EN);
    const role = userData.role === 'admin' ? t('role_admin') : t('role_operator');

    userInfo.innerHTML = `
        <span class="user-role-badge">${role}</span>
        <span class="user-display-name">${displayName}</span>
        <button class="logout-btn" id="logoutBtn" title="${t('logout')}">${t('logout')}</button>
    `;
    userInfo.style.display = 'flex';

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('plaaf_token');
        localStorage.removeItem('plaaf_user');
        window.location.href = 'login.html';
    });
    
    return userData;
}

// ===== 共用：數字上滾動畫 (#12 抽取共用) =====
function animateCountUp(el, target, duration = 2000, suffix = '') {
    const startTime = performance.now();
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ===== Clock =====
function initClock() {
    function update() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('clock').textContent = `${h}:${m}:${s}`;

        const y = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const weekDaysZh = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        document.getElementById('date').textContent = isEnglishMode()
            ? `${y}-${mo}-${d} ${weekDaysEn[now.getDay()]}`
            : `${y}-${mo}-${d} 星期${weekDaysZh[now.getDay()]}`;
    }
    update();
    setInterval(update, 1000);
}

// ===== 頁籤切換 =====
let currentTab = 'overview';
let radarAnimationId = null;

function initTabs(userData) {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-pane'); // 修改這裡，原本是 .tab-content 但 HTML 裡是 .tab-pane

    // 如果是管理員，顯示管理頁籤
    if (userData && userData.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = '';
        });
    }

    function switchTab(tabName) {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        const targetTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
        const targetContent = document.getElementById(`tab-${tabName}`);
        if (targetTab && targetContent) {
            targetTab.classList.add('active');
            targetContent.classList.add('active');
            targetContent.style.display = ''; // 確保被點擊的頁籤內容顯示
            currentTab = tabName;

            // 暫停/恢復雷達動畫
            if (tabName === 'overview') {
                resumeRadar();
            } else {
                pauseRadar();
            }
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            // 隱藏所有 tab-pane
            contents.forEach(c => c.style.display = 'none');
            switchTab(tabName);
            history.replaceState(null, '', `#${tabName}`);
        });
    });

    // 預設隱藏除了 overview 以外的 tab-pane
    contents.forEach(c => {
        if(c.id !== 'tab-overview') c.style.display = 'none';
    });

    // 載入時讀取 hash
    const hash = location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
        switchTab(hash);
    }

    // 瀏覽器前進/後退
    window.addEventListener('hashchange', () => {
        const h = location.hash.replace('#', '');
        if (h && document.getElementById(`tab-${h}`)) {
            switchTab(h);
        }
    });
}

// ===== Count Up Animation (使用共用函式 #12) =====
function initCountUp() {
    const elements = document.querySelectorAll('[data-count]');
    elements.forEach(el => {
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        animateCountUp(el, target, 2000, suffix);
    });
}

// ===== Fleet Bar Chart =====
function initFleetChart() {
    const container = document.getElementById('fleetChart');
    if (!container) return;
    const maxCount = Math.max(...FLEET_DATA.map(f => f.count));

    FLEET_DATA.forEach((fleet, i) => {
        const item = document.createElement('div');
        item.className = 'fleet-bar-item';
        const pct = (fleet.count / maxCount) * 100;
        item.innerHTML = `
      <div class="fleet-bar-label">${fleet.type}</div>
      <div class="fleet-bar-track">
        <div class="fleet-bar-fill" style="background: ${fleet.color}; color: ${fleet.color};" data-width="${pct}%"></div>
      </div>
      <div class="fleet-bar-count">${fleet.count}</div>
    `;
        container.appendChild(item);

        // Animate bars
        setTimeout(() => {
            item.querySelector('.fleet-bar-fill').style.width = pct + '%';
        }, 300 + i * 100);
    });
}

// ===== Readiness Ring (with animation #8) =====
function initReadinessRing() {
    const canvas = document.getElementById('readinessCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 90, cy = 90, radius = 75, lineWidth = 14;
    const data = [
        { pct: READINESS_DATA.ready, color: '#00ffc8' },
        { pct: READINESS_DATA.maintenance, color: '#ffa500' },
        { pct: READINESS_DATA.standby, color: '#00bfff' },
        { pct: READINESS_DATA.upgrade, color: '#7b68ee' },
    ];

    const animDuration = 1500;
    const startTime = performance.now();

    function drawRing(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        ctx.clearRect(0, 0, 180, 180);

        let startAngle = -Math.PI / 2;
        data.forEach(seg => {
            const fullSweep = (seg.pct / 100) * Math.PI * 2;
            const sweep = fullSweep * eased;
            if (sweep > 0.001) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
                ctx.strokeStyle = seg.color;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
            startAngle += fullSweep + 0.04;
        });

        // 中心數值也做動畫
        const readinessEl = document.querySelector('.readiness-value');
        if (readinessEl) {
            readinessEl.textContent = Math.floor(READINESS_DATA.ready * eased) + '%';
        }

        if (progress < 1) {
            requestAnimationFrame(drawRing);
        }
    }
    requestAnimationFrame(drawRing);
}

// ===== Mission Table (with completed status #7, cross-day fix #14) =====
function initMissionTable() {
    const tbody = document.getElementById('missionTableBody');
    if (!tbody) return;

    function renderMissions() {
        tbody.innerHTML = '';
        const missions = getMissionData();
        const now = new Date();
        const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Update panel title with date
        const panelTitle = tbody.closest('.panel')?.querySelector('.panel-title');
        if (panelTitle) panelTitle.innerHTML = '<span class="icon">\u{1F4CB}</span> ' + t('missions_title') + ' [' + dateLabel + ']';

        missions.forEach(m => {
            const statusClass = m.status === '\u9032\u884C\u4E2D' ? 'active'
                : m.status === '\u5F85\u547D' ? 'standby'
                    : m.status === '\u5DF2\u5B8C\u6210' ? 'completed'
                        : 'planned';
            const dot = m.status === '\u9032\u884C\u4E2D' ? '\u25CF'
                : m.status === '\u5F85\u547D' ? '\u25C9'
                    : m.status === '\u5DF2\u5B8C\u6210' ? '\u2713'
                        : '\u25CB';
            const tr = document.createElement('tr');
            tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.type}</td>
      <td>${m.area}</td>
      <td class="mission-base">📍 ${m.base || '-'}</td>
      <td>${m.aircraft}</td>
      <td>${m.time}</td>
      <td><span class="mission-status ${statusClass}">${dot} ${m.status}</span></td>
    `;
            tbody.appendChild(tr);
        });
    }

    renderMissions();
    setInterval(renderMissions, 60000);
}

// ===== Radar Animation (with pause/resume #1) =====
let radarRunning = true;

function pauseRadar() {
    radarRunning = false;
}

function resumeRadar() {
    if (!radarRunning) {
        radarRunning = true;
        if (typeof drawRadar === 'function') drawRadar();
    }
}

function initRadar() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 160, cy = 160, radius = 150;
    let angle = 0;

    // Random blips
    const blips = [];
    for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 30 + Math.random() * 110;
        blips.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, alpha: 1 });
    }

    window.drawRadar = function draw() {
        if (!radarRunning) return;

        ctx.clearRect(0, 0, 320, 320);

        // Background
        ctx.fillStyle = 'rgba(0, 10, 20, 0.95)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Concentric rings
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius * i / 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 200, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Cross lines
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
        ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
        ctx.stroke();

        // Diagonal lines
        const d = radius * 0.707;
        ctx.beginPath();
        ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d);
        ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d);
        ctx.stroke();

        // Sweep arc
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle - 0.5, angle);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        sweepGrad.addColorStop(0, 'rgba(0, 255, 200, 0.3)');
        sweepGrad.addColorStop(1, 'rgba(0, 255, 200, 0.05)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();

        // Sweep line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Blips
        blips.forEach(b => {
            const dx = b.x - cx;
            const dy = b.y - cy;
            const blipAngle = Math.atan2(dy, dx);
            let diff = angle - blipAngle;
            if (diff < 0) diff += Math.PI * 2;
            if (diff < 0.5) {
                b.alpha = 1;
            } else {
                b.alpha = Math.max(0, b.alpha - 0.008);
            }

            if (b.alpha > 0) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 200, ${b.alpha})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 200, ${b.alpha * 0.3})`;
                ctx.fill();
            }
        });

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffc8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'rgba(0, 255, 200, 0.4)';
        ctx.font = '9px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy - radius + 12);
        ctx.fillText('S', cx, cy + radius - 6);
        ctx.fillText('E', cx + radius - 10, cy + 4);
        ctx.fillText('W', cx - radius + 10, cy + 4);

        angle += 0.02;
        if (angle > Math.PI * 2) angle -= Math.PI * 2;
        radarAnimationId = requestAnimationFrame(draw);
    };
    window.drawRadar();
}

// ===== Personnel Grid (使用共用動畫 #12) =====
function initPersonnel() {
    const grid = document.getElementById('personnelGrid');
    if (!grid) return;

    grid.innerHTML = '';
    PERSONNEL_DATA.forEach(item => {
        const div = document.createElement('div');
        div.className = 'personnel-item';
        div.innerHTML = `
      <img class="personnel-photo" src="${item.image}" alt="${item.role}" loading="lazy">
      <div class="personnel-count" data-count="${item.count}">0</div>
      <div class="personnel-role">${item.role}</div>
    `;
        grid.appendChild(div);
    });

    // 使用共用函式
    setTimeout(() => {
        grid.querySelectorAll('[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            animateCountUp(el, target, 2000);
        });
    }, 500);
}

// ===== Equipment Cards (with filter #9, expand/collapse #5) =====
function initEquipment() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;

    // 建立篩選按鈕
    const filterContainer = document.createElement('div');
    filterContainer.className = 'equipment-filter';
    filterContainer.id = 'equipmentFilter';

    const categories = ['全部', '戰鬥機', '轟炸機', '運輸機', '預警機', '無人機'];
    const categoryMap = {
        '全部': null,
        '戰鬥機': ['第五代隱身戰鬥機', '多用途戰鬥機', '輕型多用途戰鬥機', '重型制空戰鬥機', '第五代中型隱身戰鬥機'],
        '轟炸機': ['遠程戰略轟炸機'],
        '運輸機': ['大型戰略運輸機'],
        '預警機': ['預警指揮機'],
        '無人機': ['隱身無人攻擊機'],
    };

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn${cat === '全部' ? ' active' : ''}`;
        btn.textContent = cat === '全部' ? t('filter_all')
            : cat === '戰鬥機' ? t('filter_fighters')
                : cat === '轟炸機' ? t('filter_bombers')
                    : cat === '運輸機' ? t('filter_transport')
                        : cat === '預警機' ? t('filter_awacs')
                            : t('filter_uav');
        btn.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterEquipment(categoryMap[cat]);
        });
        filterContainer.appendChild(btn);
    });

    grid.parentElement.insertBefore(filterContainer, grid);

    // 渲染卡片
    function renderEquipmentCards() {
        grid.innerHTML = '';
        EQUIPMENT_DATA.forEach((eq, i) => {
            const card = document.createElement('div');
            card.className = 'equipment-card animate-in';
            card.style.animationDelay = `${i * 0.1}s`;
            card.dataset.type = eq.type;

            const specsHtml = Object.entries(eq.specs).map(([key, val]) => {
                const labels = {
                    manufacturer: t('spec_manufacturer'),
                    firstFlight: t('spec_firstFlight'),
                    length: t('spec_length'),
                    wingspan: t('spec_wingspan'),
                    maxSpeed: t('spec_maxSpeed'),
                    range: t('spec_range'),
                    combatRadius: t('spec_combatRadius'),
                    ceiling: t('spec_ceiling'),
                    weapons: t('spec_weapons'),
                    payload: t('spec_payload'),
                    endurance: t('spec_endurance'),
                    radar: t('spec_radar')
                };
                return `<div class="spec-item"><span class="spec-label">${labels[key] || key}</span><span class="spec-value">${val}</span></div>`;
            }).join('');

            card.innerHTML = `
      <img class="equipment-card-image" src="${eq.image}" alt="${eq.name}" loading="lazy" onerror="this.style.background='linear-gradient(135deg, #0a1020, #1a2040)'; this.style.display='flex'; this.alt='圖片載入中...'">
      <div class="equipment-card-body">
        <div class="equipment-card-name">${eq.name}${eq.nickname ? ` 「${eq.nickname}」` : ''}</div>
        <div class="equipment-card-type">${eq.type}</div>
        <div class="equipment-card-desc">${eq.description}</div>
        <div class="equipment-specs-toggle">
          <button class="specs-toggle-btn" onclick="this.closest('.equipment-card').classList.toggle('specs-open'); this.textContent = this.closest('.equipment-card').classList.contains('specs-open') ? '${t('specs_close')}' : '${t('specs_open')}'">${t('specs_open')}</button>
        </div>
        <div class="equipment-specs collapsed">${specsHtml}</div>
      </div>
    `;
            grid.appendChild(card);
        });
    }

    renderEquipmentCards();

    function filterEquipment(types) {
        const cards = grid.querySelectorAll('.equipment-card');
        cards.forEach(card => {
            if (!types || types.includes(card.dataset.type)) {
                card.style.display = '';
                card.style.animation = 'none';
                card.offsetHeight; // reflow
                card.style.animation = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// ===== Exercises Timeline (with year filter #10) =====
function initExercises() {
    const timeline = document.getElementById('exercisesTimeline');
    if (!timeline) return;

    // 建立年份篩選列
    const filterContainer = document.createElement('div');
    filterContainer.className = 'exercise-filter';
    filterContainer.id = 'exerciseFilter';

    const years = ['全部', ...new Set(EXERCISES_DATA.map(e => e.year).reverse())];
    years.forEach(year => {
        const btn = document.createElement('button');
        btn.className = `filter-btn${year === '全部' ? ' active' : ''}`;
        btn.textContent = year === '全部' ? t('filter_all') : year;
        btn.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterExercises(year === '全部' ? null : year);
        });
        filterContainer.appendChild(btn);
    });

    timeline.parentElement.insertBefore(filterContainer, timeline);

    // Show newest first
    const sortedExercises = [...EXERCISES_DATA].reverse();

    sortedExercises.forEach((ex, i) => {
        const isCurrent = ex.year === 2026;
        const item = document.createElement('div');
        item.className = `exercise-item animate-in ${isCurrent ? 'current' : ''}`;
        item.style.animationDelay = `${i * 0.08}s`;
        item.dataset.year = ex.year;

        item.innerHTML = `
      <div class="exercise-year">${ex.year}</div>
      <div class="exercise-name">${ex.name}</div>
      <div class="exercise-date">📅 ${ex.date}</div>
      <div class="exercise-location">📍 ${ex.location}</div>
      <div class="exercise-desc">${ex.description}</div>
      <div class="exercise-meta">
        <span class="exercise-tag tag-scale">${t('scale_label')}: ${ex.scale}</span>
        <span class="exercise-tag tag-participants">${ex.participants}</span>
      </div>
    `;
        timeline.appendChild(item);
    });

    function filterExercises(year) {
        const items = timeline.querySelectorAll('.exercise-item');
        items.forEach(item => {
            if (!year || parseInt(item.dataset.year) === year) {
                item.style.display = '';
                item.style.animation = 'none';
                item.offsetHeight;
                item.style.animation = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// ===== 基地部署頁面 =====
function initAirbases() {
    const grid = document.getElementById('airbaseGrid');
    if (!grid) return;

    // 建立戰區篩選按鈕
    const filterContainer = document.createElement('div');
    filterContainer.className = 'equipment-filter';

    const theaters = ['全部', '東部戰區', '南部戰區', '西部戰區', '北部戰區', '中部戰區'];
    theaters.forEach(theaterName => {
        const btn = document.createElement('button');
        btn.className = `filter-btn${theaterName === '全部' ? ' active' : ''}`;
        btn.textContent = theaterName === '全部' ? t('filter_all') : mapValue(theaterName, EN_MAPS.theaters);
        btn.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterBases(theaterName === '全部' ? null : theaterName);
        });
        filterContainer.appendChild(btn);
    });

    grid.parentElement.insertBefore(filterContainer, grid);

    // 統計每個基地總機數
    function getTotalAircraft(base) {
        return base.aircraft.reduce((sum, a) => sum + a.count, 0);
    }

    // 渲染基地卡片
    AIRBASE_DATA.forEach((base, i) => {
        const total = getTotalAircraft(base);
        const maxCount = Math.max(...base.aircraft.map(a => a.count));
        const theaterColors = {
            '東部戰區': '#00ffc8',
            '南部戰區': '#ffa500',
            '西部戰區': '#7b68ee',
            '北部戰區': '#00bfff',
            '中部戰區': '#ff69b4',
        };
        const theaterColor = theaterColors[base.theater] || '#00ffc8';

        const card = document.createElement('div');
        card.className = 'airbase-card hud-corners animate-in';
        card.style.animationDelay = `${i * 0.06}s`;
        card.dataset.theater = base.theater;

        const aircraftBars = base.aircraft.map(a => {
            const pct = (a.count / maxCount) * 100;
            return `
        <div class="airbase-aircraft-row">
          <span class="airbase-aircraft-type" style="color: ${a.color}">${a.type}</span>
          <div class="airbase-aircraft-bar-track">
            <div class="airbase-aircraft-bar-fill" style="width: ${pct}%; background: ${a.color};"></div>
          </div>
          <span class="airbase-aircraft-count" style="color: ${a.color}">${a.count}</span>
        </div>`;
        }).join('');

        card.innerHTML = `
      <div class="airbase-card-header" style="border-left: 3px solid ${theaterColor}">
        <div class="airbase-card-name">${base.name}</div>
        <div class="airbase-card-meta">
          <span class="airbase-theater-badge" style="color: ${theaterColor}; border-color: ${theaterColor}">${base.theater}</span>
          <span class="airbase-province">${base.province}</span>
        </div>
      </div>
      <div class="airbase-card-body">
        <div class="airbase-info-row">
          <span class="airbase-info-label">${t('airbase_runway')}</span>
          <span class="airbase-info-value">${base.runway}</span>
        </div>
        <div class="airbase-info-row">
          <span class="airbase-info-label">${t('airbase_total')}</span>
          <span class="airbase-info-value airbase-total">${total}${isEnglishMode() ? '' : ' 架'}</span>
        </div>
        <div class="airbase-info-row">
          <span class="airbase-info-label">${t('airbase_status')}</span>
          <span class="airbase-status-dot"></span>
          <span class="airbase-info-value" style="color: var(--accent-green)">${t('airbase_ready')}</span>
        </div>
        <div class="airbase-aircraft-section">
          <div class="airbase-section-title">${t('airbase_section')}</div>
          ${aircraftBars}
        </div>
        <div class="airbase-desc">${base.description}</div>
      </div>
    `;
        grid.appendChild(card);
    });

    function filterBases(theater) {
        const cards = grid.querySelectorAll('.airbase-card');
        cards.forEach(card => {
            if (!theater || card.dataset.theater === theater) {
                card.style.display = '';
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// ===== Scroll to Top (#4) =====
function initScrollToTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-to-top';
    btn.id = 'scrollToTop';
    btn.innerHTML = '▲';
    btn.title = t('scroll_top');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== [A] 浮動微粒背景 =====
function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particleCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;
    const MAX_DIST = 120;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.2,
        });
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const alpha = (1 - dist / MAX_DIST) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 200, ${p.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(drawParticles);
    }
    drawParticles();
}

// ===== [C] 即時戰情跑馬燈 =====
function initAlertTicker() {
    const ticker = document.getElementById('alertTicker');
    if (!ticker) return;

    const alerts = ALERTS_DATA.length > 0 ? ALERTS_DATA : [
        { level: 'info', text: isEnglishMode() ? 'System initializing...' : '系統啟動中...' },
    ];

    const track = ticker.querySelector('.ticker-track');
    if (!track) return;

    // Duplicate alerts for seamless scroll
    const allAlerts = [...alerts, ...alerts];
    allAlerts.forEach(a => {
        const span = document.createElement('span');
        span.className = `ticker-item ticker-${a.level}`;
        const icon = a.level === 'danger' ? '🔴' : a.level === 'warning' ? '🟡' : '🟢';
        span.textContent = `${icon} ${a.text}`;
        track.appendChild(span);
    });
}

// ===== [D] 戰區指揮地圖 =====
function initTheaterMap() {
    const canvas = document.getElementById('theaterMapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    let time = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = 'rgba(6, 10, 18, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid overlay
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.06)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Draw simplified China outline (approximate polygon)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.2)';
        ctx.lineWidth = 1.5;
        const outline = [
            [42, 15], [55, 12], [65, 10], [80, 15], [88, 20],
            [92, 28], [90, 35], [85, 40], [88, 45], [92, 50],
            [85, 55], [80, 60], [75, 65], [70, 75], [60, 80],
            [52, 78], [45, 72], [38, 68], [30, 65], [22, 55],
            [18, 48], [20, 40], [25, 32], [30, 25], [35, 18], [42, 15]
        ];
        outline.forEach(([px, py], i) => {
            const x = (px / 100) * W;
            const y = (py / 100) * H;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill territory
        ctx.fillStyle = 'rgba(0, 255, 200, 0.03)';
        ctx.fill();

        // Draw theater zone centers
        const theaterColors = {
            '東部戰區': '#00ffc8', '南部戰區': '#ffa500',
            '西部戰區': '#7b68ee', '北部戰區': '#00bfff', '中部戰區': '#ff69b4',
        };

        THEATER_BASES.forEach(theater => {
            const cx = (theater.x / 100) * W;
            const cy = (theater.y / 100) * H;
            const tc = theaterColors[theater.name] || '#00ffc8';

            // Theater name label
            ctx.font = '11px "Orbitron", sans-serif';
            ctx.fillStyle = tc;
            ctx.globalAlpha = 0.7;
            ctx.textAlign = 'center';
            ctx.fillText(theater.name, cx, cy - 8);
            ctx.globalAlpha = 1;

            // Connection lines between theaters
            THEATER_BASES.forEach(other => {
                if (other === theater) return;
                const ox = (other.x / 100) * W;
                const oy = (other.y / 100) * H;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(ox, oy);
                ctx.strokeStyle = 'rgba(0, 255, 200, 0.04)';
                ctx.lineWidth = 0.5;
                ctx.setLineDash([4, 8]);
                ctx.stroke();
                ctx.setLineDash([]);
            });
        });

        // Draw individual airbases
        if (typeof AIRBASE_DATA !== 'undefined') {
            AIRBASE_DATA.forEach(base => {
                const bx = (base.x / 100) * W;
                const by = (base.y / 100) * H;
                const tc = theaterColors[base.theater] || '#00ffc8';
                const total = base.aircraft.reduce((s, a) => s + a.count, 0);

                // Pulse ring (subtle)
                const pulseR = 3 + Math.sin(time * 2 + bx) * 1.5;
                ctx.beginPath();
                ctx.arc(bx, by, pulseR + 4, 0, Math.PI * 2);
                ctx.strokeStyle = tc.replace(')', ', 0.2)').replace('rgb', 'rgba');
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Base dot
                ctx.beginPath();
                ctx.arc(bx, by, 3, 0, Math.PI * 2);
                ctx.fillStyle = tc;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(bx, by, 5, 0, Math.PI * 2);
                ctx.fillStyle = tc.replace(')', ', 0.15)').replace('#', 'rgba(');
                // Use hex to rgba fallback
                ctx.fillStyle = `rgba(${parseInt(tc.slice(1, 3), 16)}, ${parseInt(tc.slice(3, 5), 16)}, ${parseInt(tc.slice(5, 7), 16)}, 0.15)`;
                ctx.fill();

                // Base name
                ctx.font = '8px "JetBrains Mono", monospace';
                ctx.fillStyle = `rgba(${parseInt(tc.slice(1, 3), 16)}, ${parseInt(tc.slice(3, 5), 16)}, ${parseInt(tc.slice(5, 7), 16)}, 0.7)`;
                ctx.textAlign = 'left';
                ctx.fillText(isEnglishMode() ? base.name.replace(' Air Base', '') : base.name.replace('基地', ''), bx + 8, by + 3);
            });
        }

        // Scanning beam
        const beamAngle = time * 0.5;
        const beamCx = W * 0.55;
        const beamCy = H * 0.45;
        const beamLen = 200;
        ctx.beginPath();
        ctx.moveTo(beamCx, beamCy);
        ctx.lineTo(beamCx + Math.cos(beamAngle) * beamLen, beamCy + Math.sin(beamAngle) * beamLen);
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Coords label
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(0, 255, 200, 0.3)';
        ctx.textAlign = 'left';
        ctx.fillText('LAT: 35.8°N  LON: 104.1°E', 10, H - 10);
        ctx.textAlign = 'right';
        ctx.fillText(isEnglishMode() ? 'THEATER COMMAND OVERVIEW' : '戰區指揮總覽', W - 10, H - 10);

        time += 0.016;
        requestAnimationFrame(draw);
    }
    draw();
}

// ===== [E] 即時事件日誌 =====
function initEventLog() {
    const log = document.getElementById('eventLog');
    if (!log) return;

    const events = EVENTS_DATA.length > 0 ? EVENTS_DATA : [
        { level: 'info', msg: isEnglishMode() ? 'System initializing...' : '系統啟動中...' },
    ];

    let index = 0;

    function addEvent() {
        const e = events[index % events.length];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const div = document.createElement('div');
        div.className = `event-item event-${e.level} event-new`;
        div.innerHTML = `<span class="event-time">${timeStr}</span><span class="event-level-dot level-${e.level}"></span><span class="event-msg">${e.msg}</span>`;

        // Insert at top
        if (log.firstChild) {
            log.insertBefore(div, log.firstChild);
        } else {
            log.appendChild(div);
        }

        // Remove animation class
        setTimeout(() => div.classList.remove('event-new'), 500);

        // Keep max 8 items visible
        while (log.children.length > 8) {
            log.removeChild(log.lastChild);
        }

        index++;
    }

    // Initial burst
    for (let i = 0; i < 5; i++) {
        setTimeout(() => addEvent(), i * 200);
    }

    // Keep adding events
    setInterval(addEvent, 4000 + Math.random() * 2000);
}

// ==========================================
// [新增] 管理端資料處理
// ==========================================
async function loadAdminData() {
    try {
        const [stats, loginLogs, opLogs] = await Promise.all([
            apiFetch('/admin/stats'),
            apiFetch('/admin/login-logs?limit=50'),
            apiFetch('/admin/operation-logs?limit=50')
        ]);
        
        if (stats) renderAdminStats(stats);
        if (loginLogs) renderLoginLogs(loginLogs);
        if (opLogs) renderOperationLogs(opLogs);
    } catch (e) {
        console.error('Failed to load admin data:', e);
    }
}

function renderAdminStats(stats) {
    const safeSet = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    safeSet('adminTotalUsers', stats.totalUsers);
    safeSet('adminTotalLogins', stats.totalLogins);
    safeSet('adminTodayLogins', stats.todayLogins);
    safeSet('adminFailedLogins', stats.failedLogins);
    safeSet('adminTotalOps', stats.totalOperations);
}

function renderLoginLogs(logs) {
    const tbody = document.getElementById('loginLogsBody');
    if (!tbody) return;
    
    tbody.innerHTML = logs.map(log => {
        const time = new Date(log.created_at).toLocaleString('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
        const statusClass = log.success ? 'status-text-green' : 'status-text-red';
        const statusText = log.success ? t('status_success') : t('status_failed');
        const userDisplay = log.username + (log.display_name ? ` (${log.display_name})` : '');
        
        return `
            <tr>
                <td style="color: rgba(255,255,255,0.7);">${time}</td>
                <td style="color: #fff;">${userDisplay}</td>
                <td style="color: rgba(0,255,200,0.8);">${log.ip}</td>
                <td class="${statusClass}">${statusText}</td>
            </tr>
        `;
    }).join('');
}

function renderOperationLogs(logs) {
    const tbody = document.getElementById('operationLogsBody');
    if (!tbody) return;
    
    tbody.innerHTML = logs.map(log => {
        const time = new Date(log.created_at).toLocaleString('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
        const userDisplay = log.username + (log.display_name ? ` (${log.display_name})` : '');
        const methodClass = 
            log.method === 'GET' ? 'status-text-green' :
            log.method === 'POST' ? 'status-text-yellow' : 'status-text-red';
            
        // 狀態碼顏色
        let scClass = 'status-text-green';
        if (log.status_code >= 400 && log.status_code < 500) scClass = 'status-text-yellow';
        else if (log.status_code >= 500) scClass = 'status-text-red';
        
        return `
            <tr>
                <td style="color: rgba(255,255,255,0.7);">${time}</td>
                <td style="color: #fff;">${userDisplay}</td>
                <td class="${methodClass}">${log.method}</td>
                <td class="code-font" style="font-size: 0.85em;">${log.path}</td>
                <td class="${scClass}">${log.status_code}</td>
            </tr>
        `;
    }).join('');
}

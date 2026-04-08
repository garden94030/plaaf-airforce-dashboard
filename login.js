// ==========================================
// PLAAF 登入頁面 — GitHub Pages 靜態登入
// ==========================================

(function () {
  'use strict';

  const DEMO_USERS = [
    {
      username: 'admin',
      password: 'admin123',
      displayName: '系統管理員',
      role: 'admin',
    },
    {
      username: 'operator',
      password: 'op2026',
      displayName: '值班操作員',
      role: 'operator',
    },
  ];

  const token = localStorage.getItem('plaaf_token');
  if (token) {
    window.location.href = 'index.html';
    return;
  }

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const el = document.getElementById('loginClock');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'loginParticleCanvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];
    const PARTICLE_COUNT = 50;
    const MAX_DIST = 120;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 200, ${particle.alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }
    draw();
  }
  initParticles();

  const form = document.getElementById('loginForm');
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');
  const loginCard = document.querySelector('.login-card');
  const userInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
    loginCard.classList.add('shake');
    setTimeout(() => loginCard.classList.remove('shake'), 500);
  }

  function clearError() {
    errorMsg.classList.remove('visible');
  }

  function setLoading(loading) {
    if (loading) {
      loginBtn.classList.add('loading');
      loginBtn.disabled = true;
    } else {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  }

  function saveDemoLogin(account) {
    localStorage.setItem('plaaf_token', `pages-demo-${account.role}`);
    localStorage.setItem(
      'plaaf_user',
      JSON.stringify({
        id: account.role === 'admin' ? 1 : 2,
        username: account.username,
        displayName: account.displayName,
        role: account.role,
      })
    );
  }

  function findDemoAccount(username, password) {
    return DEMO_USERS.find(
      (account) =>
        account.username === username && account.password === password
    );
  }

  function completeLogin(account) {
    saveDemoLogin(account);
    loginCard.classList.add('success');
    loginBtn.innerHTML = '<span class="btn-text">✓ 驗證通過 — 進入系統</span>';
    loginBtn.style.color = '#44ee44';
    loginBtn.style.borderColor = '#44ee44';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 900);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const username = userInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError('⚠ 請輸入帳號和密碼');
      return;
    }

    setLoading(true);

    try {
      const account = findDemoAccount(username, password);
      if (!account) {
        throw new Error('帳號或密碼錯誤');
      }
      completeLogin(account);
    } catch (err) {
      setLoading(false);
      showError(`⚠ ${err.message}`);
    }
  });

  document.querySelectorAll('[data-demo-login]').forEach((button) => {
    button.addEventListener('click', () => {
      const account = DEMO_USERS.find(
        (item) => item.username === button.dataset.username
      );
      if (!account) return;
      userInput.value = account.username;
      passwordInput.value = account.password;
      clearError();
      userInput.focus();
    });
  });

  const params = new URLSearchParams(window.location.search);
  const localAutoLoginHosts = ['127.0.0.1', 'localhost'];
  if (
    params.get('autologin') === '1' &&
    localAutoLoginHosts.includes(window.location.hostname)
  ) {
    const targetUser = params.get('demo') || 'admin';
    const account = DEMO_USERS.find((item) => item.username === targetUser);
    if (account) {
      userInput.value = account.username;
      passwordInput.value = account.password;
      setLoading(true);
      completeLogin(account);
      return;
    }
  }

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });

  setTimeout(() => userInput.focus(), 800);
})();

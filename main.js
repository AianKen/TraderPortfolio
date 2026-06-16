/* ============================================================
   ALSTRÖM CAPITAL — main.js
   GSAP + ScrollTrigger + Three.js + market data
   ============================================================ */

'use strict';

/* ── DATA ───────────────────────────────────────────────── */

const TICKERS = [
  { sym: 'BTC/USD',  price: '63,842', chg: '+2.14%', dir: 'up' },
  { sym: 'ETH/USD',  price: '3,480',  chg: '+1.87%', dir: 'up' },
  { sym: 'XAU/USD',  price: '2,314.40', chg: '+0.23%', dir: 'up' },
  { sym: 'NVDA',     price: '912.50', chg: '+3.42%', dir: 'up' },
  { sym: 'WTI CRUDE',price: '74.35',  chg: '+0.91%', dir: 'up' },
  { sym: 'EUR/USD',  price: '1.0842', chg: '-0.12%', dir: 'dn' },
  { sym: 'US10Y',    price: '4.38%',  chg: '-0.04',  dir: 'dn' },
  { sym: 'SOL/USD',  price: '178.32', chg: '+4.21%', dir: 'up' },
  { sym: 'VIX',      price: '14.22',  chg: '-5.40%', dir: 'dn' },
  { sym: 'DXY',      price: '104.18', chg: '+0.08%', dir: 'up' },
  { sym: 'AAPL',     price: '169.40', chg: '-0.38%', dir: 'dn' },
  { sym: 'NIKKEI',   price: '39,210', chg: '+0.74%', dir: 'up' },
];

const ADVISORS = [
  {
    initials: 'LT',
    name: 'Lisa Trade',
    role: 'Macro & Rates Strategist',
    bio: 'Eighteen years on sell-side rates desks across Stockholm and London. Joins the quarterly review to pressure-test every macro assumption baked into position sizing.',
    focus: ['Rates', 'FX', 'Central Banks'],
  },
  {
    initials: 'JT',
    name: 'James Trade',
    role: 'Derivatives & Volatility',
    bio: 'Former options market maker turned independent researcher. Reviews every structured position for tail-risk exposure before it goes live.',
    focus: ['Options', 'Vol Surfaces', 'Tail Risk'],
  },
  {
    initials: 'HT',
    name: 'Henry Trade',
    role: 'On-Chain & Digital Assets',
    bio: 'Builds on-chain flow models for three crypto-native funds. Brings outside data to challenge Robert\'s digital asset thesis every cycle.',
    focus: ['On-Chain', 'L1/L2', 'Liquidity Flows'],
  },
];

const TRADES = [
  { name: 'NVDA',    sub: 'Equity · Long Call',  side: 'L', entry: '$847.20',   exit: '$912.50',   held: '8d',  r: '+2.2R', pnl: '+$13,060', pos: true  },
  { name: 'BTC/USD', sub: 'Crypto · Short',      side: 'S', entry: '$63,400',   exit: '$61,850',   held: '2d',  r: '+1.4R', pnl: '+$1,240',  pos: true  },
  { name: 'AAPL',    sub: 'Equity · Long',       side: 'L', entry: '$172.80',   exit: '$169.40',   held: '5d',  r: '-0.8R', pnl: '-$1,020',  pos: false },
  { name: 'SOL/USD', sub: 'Crypto · Long',       side: 'L', entry: '$142.60',   exit: '$178.30',   held: '11d', r: '+3.1R', pnl: '+$3,034',  pos: true  },
  { name: 'XOM',     sub: 'Equity · Long',       side: 'L', entry: '$104.15',   exit: '$112.80',   held: '14d', r: '+2.8R', pnl: '+$3,460',  pos: true  },
  { name: 'QQQ',     sub: 'ETF · Short Put',     side: 'S', entry: '$429.50',   exit: '$438.10',   held: '3d',  r: '-1.0R', pnl: '-$430',    pos: false },
  { name: 'XAU/USD', sub: 'Futures · Long',      side: 'L', entry: '$2,198.00', exit: '$2,314.40', held: '21d', r: '+3.6R', pnl: '+$4,660',  pos: true  },
];

const STRATEGY_STEPS = [
  { title: 'Regime Read', body: 'Every Monday begins with a macro regime classification — trending, ranging, or volatility expansion — using a 200-day slope and a VIX percentile filter.' },
  { title: 'Confluence Check', body: 'A trade only qualifies if the weekly bias, daily structure, and intraday trigger all align. Counter-trend setups on any single timeframe are discarded.' },
  { title: 'Risk-First Sizing', body: 'Position size is calculated from the stop distance, never from conviction. Every trade risks the same fraction of equity — full stop.' },
  { title: 'Written Review', body: 'Every closed position — winner or loser — gets a same-day written review focused on process quality, not outcome.' },
];

const ALLOCATION = [
  { name: 'US & European Equities', sub: 'Large & mid-cap, sector-tilted', pct: 38 },
  { name: 'Digital Assets', sub: 'BTC, ETH, select L1/L2', pct: 27 },
  { name: 'Rates & FX Derivatives', sub: 'Macro hedges & carry', pct: 19 },
  { name: 'Commodities', sub: 'Gold, energy futures', pct: 10 },
  { name: 'Cash & Reserves', sub: 'Dry powder for dislocations', pct: 6 },
];

/* ── PRELOADER ─────────────────────────────────────────── */

function runPreloader() {
  const pre = document.getElementById('preloader');
  window.addEventListener('load', () => {
    gsap.to(pre, {
      opacity: 0,
      duration: 0.6,
      delay: 0.4,
      ease: 'power2.inOut',
      onComplete: () => { pre.style.display = 'none'; startHeroAnimation(); }
    });
  });
  // fallback in case load already fired
  setTimeout(() => {
    if (pre.style.display !== 'none') {
      gsap.to(pre, { opacity: 0, duration: 0.6, ease: 'power2.inOut', onComplete: () => { pre.style.display = 'none'; startHeroAnimation(); } });
    }
  }, 2200);
}

/* ── CURSOR ────────────────────────────────────────────── */

function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });
  function loop() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  document.querySelectorAll('a, button, input, textarea, select, .advisor-card, .strat-card').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('active'); dot.classList.add('active'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('active'); dot.classList.remove('active'); });
  });
}

/* ── NAV BEHAVIOR ──────────────────────────────────────── */

function initNav() {
  const nav    = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    drawer.classList.toggle('open');
  });

  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('open');
    drawer.classList.remove('open');
  }));
}

/* ── CLOCK ─────────────────────────────────────────────── */

function updateClock() {
  const now  = new Date();
  const fmt  = n => String(n).padStart(2, '0');
  const time = `${fmt(now.getUTCHours())}:${fmt(now.getUTCMinutes())}:${fmt(now.getUTCSeconds())} UTC`;
  const navTime = document.getElementById('navTime');
  if (navTime) navTime.textContent = time;

  const fy = document.getElementById('footerYear');
  if (fy) fy.textContent = now.getFullYear();

  const fd = document.getElementById('footerDate');
  if (fd) fd.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ── TICKER BAND ───────────────────────────────────────── */

function buildTickerBand() {
  const row = document.getElementById('tickerRow');
  const html = TICKERS.map(t => `
    <div class="tick">
      <span class="tick-sym">${t.sym}</span>
      <span class="tick-price">${t.price}</span>
      <span class="tick-chg ${t.dir}"><span class="tick-arrow">${t.dir === 'up' ? '▲' : '▼'}</span> ${t.chg}</span>
    </div>`).join('');
  row.innerHTML = html + html;
}

/* ── HERO READOUT ──────────────────────────────────────── */

function animateReadout() {
  const ytdEl  = document.getElementById('roYtd');
  const openEl = document.getElementById('roOpen');
  const volEl  = document.getElementById('roVol');

  gsap.to({ val: 0 }, {
    val: 18.6,
    duration: 1.8,
    ease: 'power2.out',
    onUpdate: function () { ytdEl.textContent = `+${this.targets()[0].val.toFixed(1)}%`; }
  });
  gsap.to({ val: 0 }, {
    val: 7,
    duration: 1.4,
    ease: 'power2.out',
    onUpdate: function () { openEl.textContent = Math.floor(this.targets()[0].val); }
  });

  setTimeout(() => { volEl.textContent = 'Compressed'; }, 700);
}

/* ── THREE.JS HERO SCENE ───────────────────────────────── */

function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || !window.THREE) return;

  const wrap = canvas.parentElement;
  let W = wrap.clientWidth, H = wrap.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Lighting
  scene.add(new THREE.AmbientLight(0x404050, 2.2));
  const copperLight = new THREE.PointLight(0xE8915C, 60, 30);
  copperLight.position.set(4, 3, 6);
  scene.add(copperLight);
  const tealLight = new THREE.PointLight(0x4FA8A8, 30, 30);
  tealLight.position.set(-5, -3, 4);
  scene.add(tealLight);

  // Central "market core" — torus knot
  const coreGeo = new THREE.TorusKnotGeometry(2.1, 0.55, 180, 24, 2, 3);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x23252B,
    metalness: 0.85,
    roughness: 0.25,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Wireframe shell
  const wireGeo = new THREE.IcosahedronGeometry(3.6, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xE8915C, wireframe: true, transparent: true, opacity: 0.12 });
  const wireShell = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireShell);

  // Orbiting candle-like boxes (representing price action)
  const candleGroup = new THREE.Group();
  const candleCount = 14;
  for (let i = 0; i < candleCount; i++) {
    const h = 0.4 + Math.random() * 1.6;
    const geo = new THREE.BoxGeometry(0.18, h, 0.18);
    const up = Math.random() > 0.45;
    const mat = new THREE.MeshStandardMaterial({
      color: up ? 0x5FBF8F : 0xE15554,
      metalness: 0.4,
      roughness: 0.5,
      emissive: up ? 0x123322 : 0x331515,
      emissiveIntensity: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / candleCount) * Math.PI * 2;
    const radius = 4.6;
    mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 2.2, Math.sin(angle) * radius);
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.speed = 0.5 + Math.random();
    candleGroup.add(mesh);
  }
  scene.add(candleGroup);

  // Floating particles
  const pCount = 220;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const r = 5 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = r * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xE8915C, size: 0.045, transparent: true, opacity: 0.5 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Mouse parallax
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    core.rotation.x = t * 0.18;
    core.rotation.y = t * 0.26;

    wireShell.rotation.y = -t * 0.05;
    wireShell.rotation.x = t * 0.03;

    candleGroup.rotation.y = t * 0.08;
    candleGroup.children.forEach((c, i) => {
      c.position.y = c.userData.baseY + Math.sin(t * c.userData.speed + i) * 0.3;
    });

    particles.rotation.y = t * 0.02;

    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (-targetY - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    copperLight.intensity = 50 + Math.sin(t * 1.3) * 20;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    W = wrap.clientWidth; H = wrap.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
}

/* ── HERO GSAP ENTRANCE ────────────────────────────────── */

function startHeroAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.fromTo('.hero-kicker', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 })
    .fromTo('.hero-title .line > *', { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.12 }, '-=0.2')
    .fromTo('.hero-sub', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
    .fromTo('.hero-cta-row', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
    .fromTo('.hero-readout', { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.8 }, '-=0.6')
    .fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.4')
    .call(animateReadout);
}

/* ── BUILD ADVISORS ────────────────────────────────────── */

function buildAdvisors() {
  const grid = document.getElementById('advisorsGrid');
  grid.innerHTML = ADVISORS.map(a => `
    <div class="advisor-card reveal">
      <div class="advisor-avatar">${a.initials}</div>
      <div class="advisor-name">${a.name}</div>
      <div class="advisor-role">${a.role}</div>
      <p class="advisor-bio">${a.bio}</p>
      <div class="advisor-focus">${a.focus.map(f => `<span>${f}</span>`).join('')}</div>
    </div>`).join('');
}

/* ── BUILD TRADE LOG + EQUITY STATS ────────────────────── */

function buildTradeLog() {
  const body = document.getElementById('logBody');
  body.innerHTML = TRADES.map(t => `
    <div class="log-row">
      <span class="lr-name">${t.name}<small>${t.sub}</small></span>
      <span><span class="lr-side ${t.side}">${t.side === 'L' ? 'LONG' : 'SHORT'}</span></span>
      <span>${t.entry}</span>
      <span>${t.exit}</span>
      <span>${t.held}</span>
      <span class="lr-r ${t.pos ? 'pos' : 'neg'}">${t.r}</span>
      <span class="lr-pnl ${t.pos ? 'pos' : 'neg'}">${t.pnl}</span>
    </div>`).join('');

  const wins   = TRADES.filter(t => t.pos).length;
  const total  = TRADES.length;
  const gross  = TRADES.map(t => parseFloat(t.pnl.replace(/[^0-9.-]/g, '')) * (t.pos ? 1 : -1)).reduce((a, b) => a + b, 0);
  const winRate = Math.round((wins / total) * 100);

  document.getElementById('equityStats').innerHTML = `
    <div class="eq-stat"><span class="val pos">+18.6%</span><span class="key">YTD Return</span></div>
    <div class="eq-stat"><span class="val">${winRate}%</span><span class="key">Win Rate</span></div>
    <div class="eq-stat"><span class="val pos">$${gross.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span><span class="key">Net P&amp;L (shown)</span></div>
    <div class="eq-stat"><span class="val">2.6×</span><span class="key">Profit Factor</span></div>`;
}

/* ── EQUITY CURVE CANVAS ───────────────────────────────── */

function buildEquityChart() {
  const canvas = document.getElementById('equityCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const months = 60; // 5 years monthly
  let port = 100, bench = 100;
  const portPts = [100], benchPts = [100];
  for (let i = 1; i < months; i++) {
    port  *= 1 + (Math.random() * 0.055 - 0.011);
    bench *= 1 + (Math.random() * 0.04 - 0.009);
    portPts.push(port);
    benchPts.push(bench);
  }
  const portScale  = 3.1 / portPts[portPts.length - 1];
  const benchScale = 1.85 / benchPts[benchPts.length - 1];
  const portFinal  = portPts.map(v => v * portScale * 100);
  const benchFinal = benchPts.map(v => v * benchScale * 100);

  const W = canvas.parentElement.clientWidth - 64; // padding compensation
  const H = 260;
  canvas.width  = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const PAD = { t: 10, r: 16, b: 28, l: 48 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const allVals = [...portFinal, ...benchFinal];
  const minV = Math.min(...allVals) * 0.97;
  const maxV = Math.max(...allVals) * 1.03;

  const toX = i => PAD.l + (i / (months - 1)) * cW;
  const toY = v => PAD.t + cH - ((v - minV) / (maxV - minV)) * cH;

  // grid
  ctx.strokeStyle = 'rgba(245,243,239,0.06)';
  ctx.lineWidth = 1;
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = 'rgba(245,243,239,0.28)';
  for (let i = 0; i <= 4; i++) {
    const y = PAD.t + (i / 4) * cH;
    ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + cW, y); ctx.stroke();
    const val = minV + ((4 - i) / 4) * (maxV - minV);
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val) + '%', PAD.l - 8, y + 3);
  }
  ctx.textAlign = 'center';
  for (let yr = 0; yr <= 5; yr++) {
    const i = yr * 12;
    if (i >= months) break;
    ctx.fillText(2021 + yr, toX(i), H - 6);
  }

  // bench area
  ctx.beginPath();
  benchFinal.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(months - 1), PAD.t + cH); ctx.lineTo(toX(0), PAD.t + cH); ctx.closePath();
  ctx.fillStyle = 'rgba(245,243,239,0.04)'; ctx.fill();

  // bench line
  ctx.beginPath();
  benchFinal.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.strokeStyle = 'rgba(245,243,239,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // portfolio area
  const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + cH);
  grad.addColorStop(0, 'rgba(232,145,92,0.28)');
  grad.addColorStop(1, 'rgba(232,145,92,0)');
  ctx.beginPath();
  portFinal.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(months - 1), PAD.t + cH); ctx.lineTo(toX(0), PAD.t + cH); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // portfolio line
  ctx.beginPath();
  portFinal.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.strokeStyle = '#E8915C';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // end dot
  ctx.beginPath();
  ctx.arc(toX(months - 1), toY(portFinal[months - 1]), 4, 0, Math.PI * 2);
  ctx.fillStyle = '#E8915C';
  ctx.fill();
}

/* ── BUILD STRATEGY CARDS ──────────────────────────────── */

function buildStrategy() {
  const grid = document.getElementById('strategyGrid');
  grid.innerHTML = STRATEGY_STEPS.map((s, i) => `
    <div class="strat-card reveal">
      <span class="strat-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="strat-title">${s.title}</div>
      <div class="strat-body">${s.body}</div>
    </div>`).join('');
}

/* ── BUILD ALLOCATION BARS ─────────────────────────────── */

function buildAllocation() {
  const wrap = document.getElementById('allocBars');
  wrap.innerHTML = ALLOCATION.map(a => `
    <div class="alloc-row reveal">
      <div>
        <div class="alloc-name">${a.name}</div>
        <span class="alloc-sub">${a.sub}</span>
      </div>
      <div class="alloc-track"><div class="alloc-fill" data-w="${a.pct}%"></div></div>
      <div class="alloc-pct">${a.pct}%</div>
    </div>`).join('');
}

/* ── SCROLL REVEAL (GSAP ScrollTrigger) ────────────────── */

function initScrollReveal() {
  if (!window.gsap || !window.ScrollTrigger) {
    // fallback to IntersectionObserver
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        el.classList.add('visible');
        if (el.classList.contains('alloc-row')) {
          const fill = el.querySelector('.alloc-fill');
          if (fill) fill.style.width = fill.dataset.w;
        }
      },
      once: true,
    });
  });

  // Section title parallax-ish reveal
  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.fromTo(title, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: title, start: 'top 85%', once: true }
    });
  });

  // Equity panel + trade log slide-in
  gsap.fromTo('.equity-panel', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.equity-panel', start: 'top 85%', once: true }
  });
  gsap.fromTo('.trade-log', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.trade-log', start: 'top 85%', once: true }
  });

  // Contact orb subtle parallax
  gsap.to('.contact-bg-orb', {
    y: 120,
    ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true }
  });
}

/* ── INIT ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  runPreloader();
  initCursor();
  initNav();
  buildTickerBand();
  buildAdvisors();
  buildTradeLog();
  buildStrategy();
  buildAllocation();

  updateClock();
  setInterval(updateClock, 1000);

  setTimeout(() => {
    initHeroScene();
    buildEquityChart();
    initScrollReveal();
  }, 100);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildEquityChart, 250);
  });
});

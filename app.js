// ---------- state ----------
const KEY = 'canne-counter-v1';
const DEF = {
  log: [], seeds: 0, xp: 0, level: 1,
  skins: ['classic'], skin: 'classic', chars: ['rasta'], char: 'rasta', themes: ['rasta'], theme: 'rasta', trails: ['joints'], trail: 'joints',
  lastSpin: '', best: 0, ach: {}, goal: 5, price: 0, pauseClaim: 0, created: Date.now(), games: 0,
};
let S = load();
function load() {
  try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...DEF }; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

const $ = s => document.querySelector(s);
const HOUR = 3600e3, DAY = 24 * HOUR;
const dk = d => { d = new Date(d); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const vib = ms => navigator.vibrate && navigator.vibrate(ms);

// ---------- rolling papers & joint svg ----------
const SKINS = {
  classic: { name: 'Classic', price: 0, paper: ['#fffdf5', '#e6dcc2'] },
  hemp: { name: 'Hemp', price: 60, paper: ['#e2cfa4', '#b39661'] },
  rasta: { name: 'Rasta', price: 150, stripes: ['#e53935', '#fdd835', '#43a047'] },
  panettone: { name: 'Candy Cane', price: 250, stripes: ['#c62828', '#fffdf5', '#c62828', '#fffdf5', '#c62828', '#2e7d32'] },
  glitter: { name: 'Glitter Pop', price: 250, paper: ['#fde4f0', '#f06292'], stars: true },
  gold: { name: 'Zion Gold', price: 300, paper: ['#fff6a8', '#c9930e'] },
  cosmic: { name: 'Cosmic', price: 500, paper: ['#8e44ff', '#1d0b45'], stars: true },
  rainbow: { name: 'Rainbow', price: 800, stripes: ['#ff5252', '#ffb300', '#ffee58', '#66bb6a', '#42a5f5', '#ab47bc'], anim: true },
  neon: { name: 'Neon', lvl: 2, stripes: ['#00e5ff', '#ff2fd6', '#00e5ff', '#ff2fd6'] },
  lava: { name: 'Lava', lvl: 6, paper: ['#ffca28', '#c62828'] },
  camo: { name: 'Camo', lvl: 11, stripes: ['#4b5320', '#78866b', '#3b3b2b', '#8f9779', '#4b5320'] },
  diamond: { name: 'Diamond', lvl: 14, paper: ['#f1fdff', '#4dd0e1'], stars: true },
};
let uid = 0;
function jointSVG(id) {
  const s = SKINS[id] || SKINS.classic, u = 'g' + (++uid);
  let grad;
  if (s.stripes) {
    const n = s.stripes.length;
    grad = `<linearGradient id="${u}" x1="0" x2="1">` + s.stripes.map((c, i) =>
      `<stop offset="${i / n}" stop-color="${c}"/><stop offset="${(i + 1) / n}" stop-color="${c}"/>`).join('') + '</linearGradient>';
  } else {
    grad = `<linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.paper[0]}"/><stop offset="1" stop-color="${s.paper[1]}"/></linearGradient>`;
  }
  const stars = s.stars ? [[110, 44], [160, 56], [205, 38], [250, 60], [275, 44], [135, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('') : '';
  return `<svg viewBox="0 0 340 100" class="${s.anim ? 'rainbow' : ''}">
  <defs>${grad}
    <radialGradient id="${u}e"><stop offset="0" stop-color="#fff59d"/><stop offset=".4" stop-color="#ff9800"/><stop offset="1" stop-color="#d84315"/></radialGradient>
    <linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  </defs>
  <rect x="8" y="36" width="58" height="28" rx="6" fill="#e9d6a3" stroke="#b5964f" stroke-width="2"/>
  <path d="M20 37v26M33 37v26M46 37v26" stroke="#c4a660" stroke-width="2"/>
  <path d="M64 35 L294 21 L300 50 L294 79 L64 65 Z" fill="url(#${u})"/>
  ${stars}
  <path d="M64 35 L294 21 L300 50 L294 79 L64 65 Z" fill="url(#${u}s)"/>
  <path d="M88 39 L120 37 M150 35 L180 33 M215 31 L250 29" stroke="#000" stroke-opacity=".12" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="300" cy="50" rx="8" ry="29" fill="#9e9e9e"/>
  <ellipse cx="300" cy="50" rx="6" ry="26" fill="#616161"/>
  <g class="ember"><ellipse cx="312" cy="50" rx="11" ry="24" fill="url(#${u}e)"/><ellipse cx="312" cy="50" rx="18" ry="30" fill="#ff9800" opacity=".18"/></g>
</svg>`;
}

// ---------- game pilots ----------
const CHARS = {
  rasta: { name: 'Rastaman', price: 0 },
  hippie: { name: 'Flower Child', price: 250 },
  cat: { name: 'Stoner Cat', price: 300 },
  nonna: { name: 'Granny Rasta', price: 350 },
  popstar: { name: 'Monster Popstar', price: 400 },
  cumenda: { name: 'The Xmas Boss', price: 400 },
  alien: { name: 'Green Alien', price: 450 },
  skull: { name: 'Chill Skeleton', price: 500 },
  robot: { name: 'Dub Robot', lvl: 3 },
  ninja: { name: 'Ninja', lvl: 7 },
  lion: { name: 'Lion of Zion', lvl: 10 },
  wizard: { name: 'Ganja Wizard', lvl: 15 },
};

// ---------- levels ----------
// XP comes from the game, from breaks and from trophies — never from smoking.
const xpFor = n => 100 + 50 * (n - 1);   // XP to go from level n to n+1
const MAX_LEVEL = 15;
function levelOf(xp) {
  let n = 1;
  while (n < MAX_LEVEL && xp >= xpFor(n)) { xp -= xpFor(n); n++; }
  return { n, into: xp, need: n < MAX_LEVEL ? xpFor(n) : 0 };
}
const UNLOCKS = () => {
  const out = [];
  const add = (cat, list, label) => Object.entries(list).forEach(([id, it]) => it.lvl && out.push({ lvl: it.lvl, cat, id, name: it.name, label }));
  add('skins', SKINS, 'Rolling paper'); add('chars', CHARS, 'Pilot'); add('themes', Themes.T, 'World'); add('trails', Game.TRAILS, 'Jetpack trail');
  return out.sort((a, b) => a.lvl - b.lvl);
};
function addXp(n) {
  if (n <= 0) return;
  S.xp += n;
  const L = levelOf(S.xp).n;
  if (L > S.level) {
    const got = UNLOCKS().filter(u => u.lvl > S.level && u.lvl <= L);
    S.level = L; save();
    showLevelUp(L, got);
  }
  save();
}
function showLevelUp(L, got) {
  vib([60, 80, 60]);
  $('#luLevel').textContent = 'LEVEL ' + L;
  $('#luList').innerHTML = got.length ? got.map(u => `<li><small>${u.label}</small><b>${u.name}</b></li>`).join('') : '<li><b>+ bragging rights</b></li>';
  $('#levelUp').classList.add('show');
}
$('#luClose').addEventListener('click', () => $('#levelUp').classList.remove('show'));

// ---------- background leaves ----------
(function bgLeaves() {
  const box = $('#bgLeaves');
  for (let i = 0; i < 14; i++) {
    const d = document.createElement('div'), sz = 50 + Math.random() * 110;
    d.className = 'bl';
    d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${sz}px;height:${sz}px;opacity:${.05 + Math.random() * .09};--r0:${Math.random() * 360}deg;animation-duration:${8 + Math.random() * 10}s;margin:-${sz / 2}px`;
    d.innerHTML = Leaf.svg(pick(['#43a047', '#66bb6a', '#fdd835', '#2e7d32']));
    box.appendChild(d);
  }
})();

// ---------- toasts & fx ----------
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3300);
}
function addSeeds(n) {
  if (!n) return;
  S.seeds += n; save();
  const c = $('#seedChip'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  render();
}
function fx(cls, x, y, html, vars = {}) {
  const e = document.createElement('div'); e.className = cls; e.innerHTML = html || '';
  e.style.left = x + 'px'; e.style.top = y + 'px';
  for (const k in vars) e.style.setProperty(k, vars[k]);
  $('#fx').appendChild(e); setTimeout(() => e.remove(), 2400);
}

// ---------- achievements ----------
const ACH = [
  { id: 'first', i: '🌱', n: 'First Puff', d: 'Log your first joint', ok: () => S.log.length >= 1 },
  { id: 'c10', i: '🌿', n: 'Rasta Apprentice', d: '10 joints in total', ok: () => S.log.length >= 10 },
  { id: 'c50', i: '🦁', n: 'Lion of Judah', d: '50 joints in total', ok: () => S.log.length >= 50 },
  { id: 'c420', i: '👑', n: 'Four-Twenty', d: '420 joints in total', ok: () => S.log.length >= 420 },
  { id: 't420', i: '🕓', n: 'Sacred Hour', d: 'A joint at 4:20', ok: () => S.log.some(t => { const d = new Date(t); return d.getHours() % 12 === 4 && d.getMinutes() === 20; }) },
  { id: 'owl', i: '🦉', n: 'Night Owl', d: 'A joint between 2 and 5 am', ok: () => S.log.some(t => { const h = new Date(t).getHours(); return h >= 2 && h < 5; }) },
  { id: 'p12', i: '🧘', n: 'Deep Breath', d: '12 hours on a break', ok: () => pauseMs() >= 12 * HOUR },
  { id: 'p24', i: '☯️', n: 'Zen Master', d: '24 hours on a break', ok: () => pauseMs() >= DAY },
  { id: 'p72', i: '🏔', n: 'Tibetan Monk', d: '3 days on a break', ok: () => pauseMs() >= 3 * DAY },
  { id: 'spin', i: '🎡', n: 'Jah Luck', d: 'Spin the wheel', ok: () => !!S.lastSpin },
  { id: 'skin', i: '🛍', n: 'Rasta Fashion', d: 'Buy something in the shop', ok: () => S.skins.length + S.chars.length + S.themes.length + S.trails.length > 4 },
  { id: 'g500', i: '🚀', n: 'Rasta Pilot', d: '500 m in Jah-Pack Ride', ok: () => S.best >= 500 },
  { id: 'g2000', i: '🪐', n: 'Zion Astronaut', d: '2000 m in Jah-Pack Ride', ok: () => S.best >= 2000 },
  { id: 'lv5', i: '⭐', n: 'Rising Star', d: 'Reach level 5', ok: () => S.level >= 5 },
  { id: 'lv10', i: '🌟', n: 'Legend', d: 'Reach level 10', ok: () => S.level >= 10 },
];
const ACH_REWARD = 15, ACH_XP = 50;
function checkAch() {
  for (const a of ACH) {
    if (!S.ach[a.id] && a.ok()) {
      S.ach[a.id] = Date.now();
      toast(`${a.i} Trophy unlocked: <b>${a.n}</b> · +${ACH_REWARD} 🌱 +${ACH_XP} XP`);
      S.seeds += ACH_REWARD;
      addXp(ACH_XP);
    }
  }
  save();
}

// ---------- counter ----------
const lastJoint = () => S.log.length ? S.log[S.log.length - 1] : 0;
const pauseMs = () => Date.now() - (lastJoint() || S.created);
const todayN = () => { const k = dk(Date.now()); return S.log.filter(t => dk(t) === k).length; };
const VIBES_OK = ['One love, one joint at a time 🙏', 'Jah is watching… lovingly 🦁', 'Remember to drink some water 💧', 'Irie vibes only ☀️', 'Easy skanking, nice and slow 🎶', 'Breathe. Relax. Laugh 😌', 'Three little birds say it’s all good 🐦🐦🐦', 'Peace, love and king size papers ✌️'];
const VIBES_NEAR = ['Almost at your limit 👀', 'Last one for today? Jah would approve 🙏', 'Slow down a bit, breaks pay out in seeds 🌱'];
const VIBES_OVER = ['Limit passed! A break earns you seeds and XP 🌱', 'That’s enough for today. Tomorrow is a new day ☀️', 'Babylon wants you fried. Take a break 😎'];

$('#jointBtn').addEventListener('click', () => {
  S.log.push(Date.now());
  // starting a joint resets the break bonus window
  S.pauseClaim = Date.now();
  save(); vib(25);

  const b = $('#jointBtn'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
  const c = $('#todayCount'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');

  const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const a = -16 * Math.PI / 180, dx = (312 - 170) / 340 * r.width;
  const ex = cx + dx * Math.cos(a), ey = cy + dx * Math.sin(a);
  for (let i = 0; i < 6; i++) setTimeout(() => fx('smoke', ex - 20, ey - 20, '', { '--dx': (Math.random() * 120 - 40) + 'px' }), i * 90);
  for (let i = 0; i < 9; i++) {
    const ang = Math.random() * Math.PI * 2, d = 90 + Math.random() * 90;
    fx('fleaf', cx - 17, cy - 17, Leaf.svg(pick(['#43a047', '#fdd835', '#e53935', '#66bb6a'])),
      { '--dx': Math.cos(ang) * d + 'px', '--dy': Math.sin(ang) * d + 'px', '--rot': (Math.random() * 720 - 360) + 'deg' });
  }
  fx('plus', cx - 20, r.top + 10, '+1');

  const n = todayN();
  $('#vibe').textContent = n > S.goal ? pick(VIBES_OVER) : n >= S.goal - 1 ? pick(VIBES_NEAR) : pick(VIBES_OK);
  checkAch(); render();
});

$('#undoBtn').addEventListener('click', () => {
  if (!S.log.length) return;
  if (!confirm('Undo the last joint?')) return;
  S.log.pop(); save(); render();
});

// ---------- rewards: break bonus ----------
function claimable() {
  const base = Math.max(lastJoint(), S.pauseClaim || S.created);
  return { h: Math.min(24, Math.floor((Date.now() - base) / HOUR)), base };
}
$('#claimBtn').addEventListener('click', () => {
  const { h, base } = claimable();
  if (!h) return;
  S.pauseClaim = base + h * HOUR;
  toast(`☯ ${h} ${h === 1 ? 'hour' : 'hours'} on a break · +${h * 2} 🌱 +${h * 10} XP`);
  addXp(h * 10); addSeeds(h * 2);
});

// ---------- rewards: wheel ----------
const PRIZES = [5, 10, 25, 5, 50, 10, 100, 15];
const WEIGHTS = [20, 18, 10, 20, 5, 18, 2, 14];
const WCOL = ['#e53935', '#fdd835', '#43a047', '#e53935', '#fdd835', '#43a047', '#ffffff', '#fdd835'];
let wheelRot = 0;
(function drawWheel() {
  const R = 100, seg = 360 / PRIZES.length;
  let h = `<circle r="106" fill="#1c2a12" stroke="#fdd835" stroke-width="4"/>`;
  PRIZES.forEach((p, i) => {
    const a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180, am = ((i + .5) * seg);
    h += `<path d="M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 0 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z" fill="${WCOL[i]}" stroke="#1c2a12" stroke-width="2"/>`;
    h += `<text transform="rotate(${am}) translate(0 -66) rotate(90)" text-anchor="middle" dominant-baseline="middle" ${WCOL[i] === '#e53935' || WCOL[i] === '#43a047' ? 'style="fill:#fff"' : ''}>${p}</text>`;
  });
  h += `<circle r="18" fill="#1c2a12" stroke="#fdd835" stroke-width="3"/><g transform="translate(0 4) scale(.16)">${Leaf.svg('#43a047').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
  $('#wheel').innerHTML = h;
})();
let spinning = false;
$('#spinBtn').addEventListener('click', () => {
  if (spinning || S.lastSpin === dk(Date.now())) return;
  spinning = true;
  let r = Math.random() * WEIGHTS.reduce((a, b) => a + b), i = 0;
  while ((r -= WEIGHTS[i]) > 0) i++;
  const seg = 360 / PRIZES.length, target = 360 - (i * seg + seg / 2) + (Math.random() - .5) * seg * .6;
  wheelRot += 360 * 6 + ((target - wheelRot) % 360 + 360) % 360;
  $('#wheel').style.transform = `rotate(${wheelRot}deg)`;
  vib(30);
  setTimeout(() => {
    spinning = false; S.lastSpin = dk(Date.now());
    toast(`🎡 You won <b>${PRIZES[i]}</b> seeds! +20 XP ${PRIZES[i] >= 50 ? '🔥🔥🔥' : ''}`);
    vib([40, 60, 40]);
    addXp(20); addSeeds(PRIZES[i]); checkAch(); render();
  }, 4600);
});

// ---------- shop ----------
// every category: list of items, owned-list key, selected key, preview, what to do on equip
const SHOP = {
  skins: { list: SKINS, own: 'skins', sel: 'skin', prev: id => `<div class="prev">${jointSVG(id)}</div>`, apply: () => renderJoint() },
  chars: { list: CHARS, own: 'chars', sel: 'char', prev: id => `<canvas class="char-prev" data-c="${id}" width="160" height="140"></canvas>`, apply: id => Game.setChar(id) },
  themes: { list: Themes.T, own: 'themes', sel: 'theme', prev: id => `<canvas class="theme-prev" data-t="${id}" width="300" height="180"></canvas>`, apply: id => Game.setTheme(id) },
  trails: { list: Game.TRAILS, own: 'trails', sel: 'trail', prev: id => `<canvas class="trail-prev" data-r="${id}" width="240" height="120"></canvas>`, apply: id => Game.setTrail(id) },
};
let shopCat = 'skins';
const owns = (cat, id) => { const it = SHOP[cat].list[id]; return S[SHOP[cat].own].includes(id) || (it.lvl && S.level >= it.lvl); };
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
  shopCat = b.dataset.cat;
  document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('active', x === b));
  renderShop();
}));
$('#shopGrid').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const c = SHOP[shopCat], id = b.dataset.id, it = c.list[id];
  if (!owns(shopCat, id)) {
    if (it.lvl || S.seeds < it.price) return;
    S.seeds -= it.price; S[c.own].push(id);
    toast(`🛍 Unlocked: <b>${it.name}</b>!`);
  }
  S[c.sel] = id; save(); c.apply(id); checkAch(); render();
});
function renderShop() {
  const c = SHOP[shopCat];
  $('#shopGrid').innerHTML = Object.entries(c.list).map(([id, it]) => {
    const own = owns(shopCat, id), on = S[c.sel] === id;
    const btn = on ? '<button disabled>Equipped</button>'
      : own ? `<button data-id="${id}">Use</button>`
      : it.lvl ? `<button class="lock" disabled>🔒 Level ${it.lvl}</button>`
      : `<button class="buy" data-id="${id}" ${S.seeds < it.price ? 'disabled' : ''}>${it.price} 🌱</button>`;
    return `<div class="skin ${on ? 'on' : ''} ${!own && it.lvl ? 'locked' : ''}">${c.prev(id)}<b>${it.name}</b>${btn}</div>`;
  }).join('');
  document.querySelectorAll('.char-prev').forEach(cv => Game.preview(cv, cv.dataset.c));
  document.querySelectorAll('.theme-prev').forEach(cv => Game.previewTheme(cv, cv.dataset.t));
  document.querySelectorAll('.trail-prev').forEach(cv => Game.previewTrail(cv, cv.dataset.r));
}
function renderJoint() { $('#jointWrap').innerHTML = jointSVG(S.skin); }

function renderLevel() {
  const L = levelOf(S.xp);
  $('#lvlChip').textContent = 'LV ' + L.n;
  $('#lvlNum').textContent = L.n;
  $('#lvlFill').style.width = (L.need ? L.into / L.need * 100 : 100) + '%';
  $('#lvlTxt').textContent = L.need ? `${L.into} / ${L.need} XP to level ${L.n + 1}` : 'Max level. Respect 🙏';
  const next = UNLOCKS().filter(u => u.lvl > L.n).slice(0, 3);
  $('#lvlNext').innerHTML = next.length
    ? next.map(u => `<li><span>LV ${u.lvl}</span><b>${u.name}</b><small>${u.label}</small></li>`).join('')
    : '<li><b>Everything unlocked!</b></li>';
}

// ---------- game ----------
Game.init($('#game'), {
  hud: { dist: $('#hudDist'), leaves: $('#hudLeaves'), mult: $('#hudMult') },
  onOver(m, l, mult) {
    const reward = Math.floor(l / 5) + Math.floor(m / 100);
    const xp = Math.floor(m / 10) + Math.floor(l / 5);
    const rec = m > S.best;
    if (rec) S.best = m;
    S.games++;
    $('#goTitle').textContent = rec ? 'NEW RECORD!' : 'CRASHED!';
    $('#goText').innerHTML = `${m} m · ${l} leaves · max x${mult}<br>You earned <b>${reward} 🌱</b> and <b>${xp} XP</b>`;
    $('#goBest').textContent = 'Best: ' + S.best + ' m';
    $('#playBtn').textContent = 'AGAIN';
    $('#gameOverlay').classList.remove('hide');
    addXp(xp); addSeeds(reward); checkAch();
  },
});
Game.setChar(S.char);
Game.setTheme(S.theme);
Game.setTrail(S.trail);
$('#goBest').textContent = S.best ? 'Best: ' + S.best + ' m' : '';
$('#playBtn').addEventListener('click', () => { $('#gameOverlay').classList.add('hide'); Game.start(); });

// ---------- stats ----------
const fmtDur = ms => {
  const m = Math.floor(ms / 60e3), h = Math.floor(m / 60), d = Math.floor(h / 24);
  return d ? `${d}d ${h % 24}h` : h ? `${h}h ${m % 60}m` : `${m}m`;
};
function renderStats() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
    const k = dk(d);
    days.push({ l: d.toLocaleDateString('en', { weekday: 'short' }), n: S.log.filter(t => dk(t) === k).length });
  }
  const max = Math.max(S.goal, ...days.map(d => d.n), 1);
  $('#bars').innerHTML = days.map(d => `<div><em>${d.n}</em><i class="${d.n > S.goal ? 'over' : ''}" style="height:${d.n / max * 100}%"></i><small>${d.l}</small></div>`).join('');

  const perDay = {};
  S.log.forEach(t => perDay[dk(t)] = (perDay[dk(t)] || 0) + 1);
  const nDays = S.log.length ? Math.max(1, Math.ceil((Date.now() - S.log[0]) / DAY)) : 1;
  let longest = 0;
  for (let i = 1; i < S.log.length; i++) longest = Math.max(longest, S.log[i] - S.log[i - 1]);
  longest = Math.max(longest, pauseMs());
  const cells = [
    [S.log.length, 'joints total'],
    [(S.log.length / nDays).toFixed(1), 'per day'],
    [Math.max(0, ...Object.values(perDay)), 'best day'],
    [fmtDur(longest), 'longest break'],
    [S.price ? '€' + (S.log.length * S.price).toFixed(0) : '—', 'money spent'],
    [S.best + ' m', 'Jah-Pack best'],
  ];
  $('#gridStats').innerHTML = cells.map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join('');
}
$('#goalIn').addEventListener('change', e => { S.goal = Math.max(1, +e.target.value || 5); save(); render(); });
$('#priceIn').addEventListener('change', e => { S.price = Math.max(0, +e.target.value || 0); save(); render(); });
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Delete EVERYTHING (joints, seeds, levels, items, trophies)?')) return;
  S = { ...DEF, created: Date.now() }; save(); renderJoint();
  Game.setChar(S.char); Game.setTheme(S.theme); Game.setTrail(S.trail); render();
});

// ---------- render ----------
function render() {
  const n = todayN(), wk = Date.now() - 7 * DAY;
  $('#seedCount').textContent = S.seeds;
  $('#todayCount').textContent = n;
  $('#weekCount').textContent = S.log.filter(t => t > wk).length;
  $('#totalCount').textContent = S.log.length;
  $('#sinceLast').textContent = lastJoint() ? fmtDur(pauseMs()) : '—';
  $('#limitFill').style.width = Math.min(100, n / S.goal * 100) + '%';
  $('#limitFill').classList.toggle('over', n > S.goal);
  $('#limitTxt').textContent = `${n} / ${S.goal} daily limit` + (S.price ? ` · €${(n * S.price).toFixed(2)}` : '');
  const sp = S.lastSpin === dk(Date.now());
  $('#spinBtn').disabled = sp || spinning;
  $('#spinBtn').textContent = sp ? 'Come back tomorrow 🌙' : 'Spin!';
  $('#achList').innerHTML = ACH.map(a => `<div class="${S.ach[a.id] ? '' : 'lock'}"><span>${a.i}</span><p style="margin:0"><b>${a.n}</b><small>${a.d}</small></p></div>`).join('');
  $('#goalIn').value = S.goal; $('#priceIn').value = S.price || '';
  renderLevel(); renderShop(); renderStats(); tick();
}
function tick() {
  const ms = pauseMs(), s = Math.floor(ms / 1000);
  $('#pauseTimer').textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':');
  const { h } = claimable();
  $('#claimBtn').disabled = !h;
  $('#claimBtn').textContent = h ? `Claim ${h * 2} 🌱 + ${h * 10} XP` : 'Next seed in ' + (60 - Math.floor(((Date.now() - Math.max(lastJoint(), S.pauseClaim || S.created)) % HOUR) / 60e3)) + ' min';
  if (lastJoint()) $('#sinceLast').textContent = fmtDur(ms);
}
setInterval(() => { tick(); if (ACH.some(a => !S.ach[a.id] && a.ok())) { checkAch(); render(); } }, 1000);

// ---------- tabs ----------
document.querySelectorAll('nav.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('nav.tabs button').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === b.dataset.v));
  document.body.classList.toggle('in-game', b.dataset.v === 'v-game');
  if (b.dataset.v === 'v-game') Game.resume(); else Game.pause();
  window.scrollTo(0, 0);
}));

// no long-press menus / magnifier anywhere in the app (iOS)
document.addEventListener('contextmenu', e => e.preventDefault());

S.level = Math.max(S.level, levelOf(S.xp).n);
renderJoint(); render(); checkAch();
if (!localStorage.getItem(KEY + '-hi')) {
  try { localStorage.setItem(KEY + '-hi', '1'); } catch (e) {}
  setTimeout(() => toast('🎁 Welcome! Here are <b>20 seeds</b> to start'), 600);
  addSeeds(20);
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

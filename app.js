// ---------- state ----------
const KEY = 'canne-counter-v1';
const DEF = { log: [], seeds: 0, skins: ['classic'], skin: 'classic', chars: ['rasta'], char: 'rasta', themes: ['rasta'], theme: 'rasta', lastSpin: '', best: 0, ach: {}, goal: 5, price: 0, pauseClaim: 0, created: Date.now(), games: 0 };
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

// ---------- skins & joint svg ----------
const SKINS = {
  classic: { name: 'Classica', price: 0, paper: ['#fffdf5', '#e6dcc2'] },
  hemp: { name: 'Canapa', price: 60, paper: ['#e2cfa4', '#b39661'] },
  rasta: { name: 'Rasta', price: 150, stripes: ['#e53935', '#fdd835', '#43a047'] },
  panettone: { name: 'Cinepanettone', price: 250, stripes: ['#c62828', '#fffdf5', '#c62828', '#fffdf5', '#c62828', '#2e7d32'] },
  glitter: { name: 'Glitter Pop', price: 250, paper: ['#fde4f0', '#f06292'], stars: true },
  gold: { name: 'Oro di Zion', price: 300, paper: ['#fff6a8', '#c9930e'] },
  cosmic: { name: 'Cosmica', price: 500, paper: ['#8e44ff', '#1d0b45'], stars: true },
  rainbow: { name: 'Arcobaleno', price: 800, stripes: ['#ff5252', '#ffb300', '#ffee58', '#66bb6a', '#42a5f5', '#ab47bc'], anim: true },
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
  { id: 'first', i: '🌱', n: 'Prima Boccata', d: 'Conta la tua prima canna', ok: () => S.log.length >= 1 },
  { id: 'c10', i: '🌿', n: 'Rasta Apprendista', d: '10 canne in totale', ok: () => S.log.length >= 10 },
  { id: 'c50', i: '🦁', n: 'Leone di Giuda', d: '50 canne in totale', ok: () => S.log.length >= 50 },
  { id: 'c420', i: '👑', n: 'Quattro-Venti', d: '420 canne in totale', ok: () => S.log.length >= 420 },
  { id: 't420', i: '🕓', n: 'Ora Sacra', d: 'Una canna alle 4:20 (o 16:20)', ok: () => S.log.some(t => { const d = new Date(t); return d.getHours() % 12 === 4 && d.getMinutes() === 20; }) },
  { id: 'owl', i: '🦉', n: 'Gufo Notturno', d: 'Una canna tra le 2 e le 5 di notte', ok: () => S.log.some(t => { const h = new Date(t).getHours(); return h >= 2 && h < 5; }) },
  { id: 'p12', i: '🧘', n: 'Respiro Profondo', d: '12 ore di pausa', ok: () => pauseMs() >= 12 * HOUR },
  { id: 'p24', i: '☯️', n: 'Zen Master', d: '24 ore di pausa', ok: () => pauseMs() >= DAY },
  { id: 'p72', i: '🏔', n: 'Monaco Tibetano', d: '3 giorni di pausa', ok: () => pauseMs() >= 3 * DAY },
  { id: 'spin', i: '🎡', n: 'Fortuna di Jah', d: 'Gira la ruota', ok: () => !!S.lastSpin },
  { id: 'skin', i: '🛍', n: 'Fashion Rasta', d: 'Compra una skin', ok: () => S.skins.length > 1 },
  { id: 'g500', i: '🚀', n: 'Pilota Rasta', d: '500 m in Jah-Pack Ride', ok: () => S.best >= 500 },
  { id: 'g2000', i: '🪐', n: 'Astronauta di Zion', d: '2000 m in Jah-Pack Ride', ok: () => S.best >= 2000 },
];
const ACH_REWARD = 15;
function checkAch() {
  for (const a of ACH) {
    if (!S.ach[a.id] && a.ok()) {
      S.ach[a.id] = Date.now();
      toast(`${a.i} Trofeo sbloccato: <b>${a.n}</b> · +${ACH_REWARD} 🌱`);
      S.seeds += ACH_REWARD;
    }
  }
  save();
}

// ---------- counter ----------
const lastJoint = () => S.log.length ? S.log[S.log.length - 1] : 0;
const pauseMs = () => Date.now() - (lastJoint() || S.created);
const todayN = () => { const k = dk(Date.now()); return S.log.filter(t => dk(t) === k).length; };
const VIBES_OK = ['One love, una canna alla volta 🙏', 'Jah ti guarda… con affetto 🦁', 'Ricordati di bere acqua 💧', 'Irie vibes only ☀️', 'Easy, skanking piano piano 🎶', 'Respira. Rilassati. Ridi 😌', 'Tre uccellini dicono: va tutto bene 🐦🐦🐦', 'Pace, amore e cartine lunghe ✌️'];
const VIBES_NEAR = ['Quasi al limite, fratello 👀', 'Ultima per oggi? Jah approverebbe 🙏', 'Rallentiamo un po’, la pausa paga in semi 🌱'];
const VIBES_OVER = ['Limite superato! Una pausa ti fa guadagnare semi 🌱', 'Basta per oggi, sorella. Domani è un nuovo giorno ☀️', 'Babylon ti vuole fuso, tu fai pausa 😎'];

$('#jointBtn').addEventListener('click', () => {
  S.log.push(Date.now());
  // starting a joint resets the pause bonus window
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
  if (!confirm('Annullo l’ultima canna?')) return;
  S.log.pop(); save(); render();
});

// ---------- rewards: pause bonus ----------
function claimable() {
  const base = Math.max(lastJoint(), S.pauseClaim || S.created);
  return { h: Math.min(24, Math.floor((Date.now() - base) / HOUR)), base };
}
$('#claimBtn').addEventListener('click', () => {
  const { h, base } = claimable();
  if (!h) return;
  S.pauseClaim = base + h * HOUR;
  toast(`☯ ${h} ${h === 1 ? 'ora' : 'ore'} di pausa · +${h * 2} 🌱`);
  addSeeds(h * 2);
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
    toast(`🎡 Hai vinto <b>${PRIZES[i]}</b> semi! ${PRIZES[i] >= 50 ? '🔥🔥🔥' : ''}`);
    vib([40, 60, 40]);
    addSeeds(PRIZES[i]); checkAch(); render();
  }, 4600);
});

// ---------- rewards: shop ----------
$('#shop').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.id, s = SKINS[id];
  if (!S.skins.includes(id)) {
    if (S.seeds < s.price) return;
    S.seeds -= s.price; S.skins.push(id);
    toast(`🛍 Nuova cartina: <b>${s.name}</b>!`);
  }
  S.skin = id; save(); checkAch(); renderJoint(); render();
});
function renderShop() {
  $('#shop').innerHTML = Object.entries(SKINS).map(([id, s]) => {
    const own = S.skins.includes(id), on = S.skin === id;
    const btn = on ? '<button disabled>In uso</button>'
      : own ? `<button data-id="${id}">Usa</button>`
      : `<button class="buy" data-id="${id}" ${S.seeds < s.price ? 'disabled' : ''}>${s.price} 🌱</button>`;
    return `<div class="skin ${on ? 'on' : ''}"><div class="prev">${jointSVG(id)}</div><b>${s.name}</b>${btn}</div>`;
  }).join('');
}
// ---------- rewards: game characters ----------
const CHARS = {
  rasta: { name: 'Rastaman', price: 0 },
  popstar: { name: 'Popstar Mostruosa', price: 400 },
  cumenda: { name: 'Il Cumenda di Natale', price: 400 },
  hippie: { name: 'Figlio dei Fiori', price: 250 },
  cat: { name: 'Gatto Fattone', price: 300 },
  nonna: { name: 'Nonna Rasta', price: 350 },
  alien: { name: 'Alieno Verde', price: 450 },
  skull: { name: 'Scheletro Chill', price: 500 },
};
$('#charShop').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.id, ch = CHARS[id];
  if (!S.chars.includes(id)) {
    if (S.seeds < ch.price) return;
    S.seeds -= ch.price; S.chars.push(id);
    toast(`🚀 Nuovo pilota: <b>${ch.name}</b>!`);
  }
  S.char = id; save(); Game.setChar(id); render();
  renderThemes();
});
function renderChars() {
  $('#charShop').innerHTML = Object.entries(CHARS).map(([id, ch]) => {
    const own = S.chars.includes(id), on = S.char === id;
    const btn = on ? '<button disabled>In uso</button>'
      : own ? `<button data-id="${id}">Usa</button>`
      : `<button class="buy" data-id="${id}" ${S.seeds < ch.price ? 'disabled' : ''}>${ch.price} 🌱</button>`;
    return `<div class="skin ${on ? 'on' : ''}"><canvas class="char-prev" data-c="${id}" width="160" height="140"></canvas><b>${ch.name}</b>${btn}</div>`;
  }).join('');
  document.querySelectorAll('.char-prev').forEach(c => Game.preview(c, c.dataset.c));
}
// ---------- rewards: game backgrounds ----------
$('#themeShop').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.id, th = Themes.T[id];
  if (!S.themes.includes(id)) {
    if (S.seeds < th.price) return;
    S.seeds -= th.price; S.themes.push(id);
    toast(`🌄 Nuovo sfondo: <b>${th.name}</b>!`);
  }
  S.theme = id; save(); Game.setTheme(id); render();
});
function renderThemes() {
  $('#themeShop').innerHTML = Object.entries(Themes.T).map(([id, th]) => {
    const own = S.themes.includes(id), on = S.theme === id;
    const btn = on ? '<button disabled>In uso</button>'
      : own ? `<button data-id="${id}">Usa</button>`
      : `<button class="buy" data-id="${id}" ${S.seeds < th.price ? 'disabled' : ''}>${th.price} 🌱</button>`;
    return `<div class="skin ${on ? 'on' : ''}"><canvas class="theme-prev" data-t="${id}" width="300" height="180"></canvas><b>${th.name}</b>${btn}</div>`;
  }).join('');
  document.querySelectorAll('.theme-prev').forEach(c => Game.previewTheme(c, c.dataset.t));
}
function renderJoint() { $('#jointWrap').innerHTML = jointSVG(S.skin); }

// ---------- game ----------
Game.init($('#game'), {
  hud: { dist: $('#hudDist'), leaves: $('#hudLeaves'), mult: $('#hudMult') },
  onOver(m, l, mult) {
    const reward = Math.floor(l / 5) + Math.floor(m / 100);
    const rec = m > S.best;
    if (rec) S.best = m;
    S.games++;
    $('#goTitle').textContent = rec ? 'NUOVO RECORD!' : 'SCHIANTATO!';
    $('#goText').innerHTML = `${m} m · ${l} foglie · molt. x${mult}<br>Hai guadagnato <b>${reward} 🌱</b>`;
    $('#goBest').textContent = 'Record: ' + S.best + ' m';
    $('#playBtn').textContent = 'RIPROVA';
    $('#gameOverlay').classList.remove('hide');
    addSeeds(reward); checkAch();
  },
});
Game.setChar(S.char);
Game.setTheme(S.theme);
$('#goBest').textContent = S.best ? 'Record: ' + S.best + ' m' : '';
$('#playBtn').addEventListener('click', () => { $('#gameOverlay').classList.add('hide'); Game.start(); });

// ---------- stats ----------
const fmtDur = ms => {
  const m = Math.floor(ms / 60e3), h = Math.floor(m / 60), d = Math.floor(h / 24);
  return d ? `${d}g ${h % 24}h` : h ? `${h}h ${m % 60}m` : `${m}m`;
};
function renderStats() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
    const k = dk(d);
    days.push({ l: d.toLocaleDateString('it', { weekday: 'short' }).slice(0, 3), n: S.log.filter(t => dk(t) === k).length });
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
    [S.log.length, 'canne totali'],
    [(S.log.length / nDays).toFixed(1), 'media al giorno'],
    [Math.max(0, ...Object.values(perDay)), 'record in un giorno'],
    [fmtDur(longest), 'pausa più lunga'],
    [S.price ? '€' + (S.log.length * S.price).toFixed(0) : '—', 'spesa totale'],
    [S.best + ' m', 'record Jah-Pack'],
  ];
  $('#gridStats').innerHTML = cells.map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join('');
}
$('#goalIn').addEventListener('change', e => { S.goal = Math.max(1, +e.target.value || 5); save(); render(); });
$('#priceIn').addEventListener('change', e => { S.price = Math.max(0, +e.target.value || 0); save(); render(); });
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Cancello TUTTO (canne, semi, skin, trofei)?')) return;
  S = { ...DEF, created: Date.now() }; save(); renderJoint(); render();
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
  $('#limitTxt').textContent = `${n} / ${S.goal} limite giornaliero` + (S.price ? ` · €${(n * S.price).toFixed(2)}` : '');
  const sp = S.lastSpin === dk(Date.now());
  $('#spinBtn').disabled = sp || spinning;
  $('#spinBtn').textContent = sp ? 'Torna domani 🌙' : 'Gira!';
  $('#achList').innerHTML = ACH.map(a => `<div class="${S.ach[a.id] ? '' : 'lock'}"><span>${a.i}</span><p style="margin:0"><b>${a.n}</b><small>${a.d}</small></p></div>`).join('');
  $('#goalIn').value = S.goal; $('#priceIn').value = S.price || '';
  renderShop(); renderChars(); renderThemes(); renderStats(); tick();
}
function tick() {
  const ms = pauseMs(), s = Math.floor(ms / 1000);
  $('#pauseTimer').textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':');
  const { h } = claimable();
  $('#claimBtn').disabled = !h;
  $('#claimBtn').textContent = h ? `Riscuoti ${h * 2} 🌱` : 'Prossimo seme tra ' + (60 - Math.floor(((Date.now() - Math.max(lastJoint(), S.pauseClaim || S.created)) % HOUR) / 60e3)) + ' min';
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

renderJoint(); render(); checkAch();
if (!localStorage.getItem(KEY + '-hi')) {
  try { localStorage.setItem(KEY + '-hi', '1'); } catch (e) {}
  setTimeout(() => toast('🎁 Benvenuta! Ecco <b>20 semi</b> di benvenuto'), 600);
  addSeeds(20);
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

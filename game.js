// JAH-PACK RIDE — a Jetpack Joyride-style runner where the rocket backpack spits joints.
const Game = (() => {
  let cv, ctx, W = 0, H = 0, raf = 0, last = 0, scale = 1;
  let state = 'idle', hold = false, onOver = () => {}, hud = {}, char = 'rasta', theme = 'rasta';
  let dpr = 1, layers = null, ambient = [], sdt = 1;
  let p, level, missiles, parts, dist, speed, leaves, life, mult, banner;
  let leafSpr, leafSprBg;
  const G = Level.G, THRUST = Level.THRUST, TOP = 18, FLOOR_H = 42;
  const VIEW_W = 480;          // minimum world width shown, so phones see far enough ahead
  const MULT_EVERY = 900;      // frames alive (~15s) per +1 leaf multiplier
  const MULT_MAX = 5;
  const rand = (a, b) => a + Math.random() * (b - a);

  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d');
    onOver = opts.onOver; hud = opts.hud;
    leafSpr = Leaf.sprite(18, '#5ccf5f');
    leafSprBg = Leaf.sprite(60, 'rgba(67,160,71,.10)');
    const down = e => { e.preventDefault(); hold = true; };
    const up = () => { hold = false; };
    cv.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', e => { if (e.code === 'Space' && state === 'run') { hold = true; e.preventDefault(); } });
    window.addEventListener('keyup', e => { if (e.code === 'Space') hold = false; });
    window.addEventListener('resize', resize);
    resize(); reset(); draw();
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    scale = Math.min(1, r.width / VIEW_W);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (state === 'run') return;
    W = r.width / scale; H = r.height / scale;
    if (p) p.x = W * .2;
    rebake(); draw();
  }

  function rebake() {
    if (!W) return;
    layers = Themes.bake(theme, W, H, H - FLOOR_H, dpr * scale);
    initAmbient();
  }
  function initAmbient() {
    const a = layers ? layers.t.ambient : 'leaves';
    const n = { leaves: 6, snow: 60, bats: 5, birds: 5, comets: 2 }[a] || 0;
    ambient = Array.from({ length: n }, () => ({ k: a, x: rand(0, W), y: rand(0, H - FLOOR_H), r: rand(0, 6), s: rand(.15, .4), v: rand(.6, 1.6), ph: rand(0, 6) }));
  }

  const laneTop = () => TOP + 34, laneBottom = () => H - FLOOR_H - 23;

  function reset() {
    p = { x: W * .2, y: H / 2, vy: 0 };
    level = Level.create({ y0: laneTop(), y1: laneBottom(), top: TOP + 4, floor: H - FLOOR_H - 4, startX: W * .9 });
    missiles = []; parts = [];
    initAmbient();
    dist = 0; speed = Level.speedAt(0); leaves = 0; life = 0; mult = 1; banner = null;
  }

  function start() {
    resize(); reset(); state = 'run'; hold = false;
    hud.mult.textContent = 'x1';
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function pause() { cancelAnimationFrame(raf); hold = false; }
  function resume() { if (state === 'run') { last = performance.now(); raf = requestAnimationFrame(loop); } else { resize(); } }

  function loop(now) {
    // smoothed frame time: one slow frame doesn't make everything jump
    sdt += (Math.min(3, (now - last) / 16.67) - sdt) * .25; last = now;
    const dt = Math.min(2, sdt);
    update(dt); draw();
    if (state !== 'idle') raf = requestAnimationFrame(loop);
  }

  function puff(x, y, n, color, spread = 2) {
    for (let i = 0; i < n; i++) parts.push({ k: 'puff', x, y, vx: rand(-spread, spread), vy: rand(-spread, spread), life: 40, max: 40, r: rand(3, 7), color });
  }

  // --- update ---------------------------------------------------------------
  function update(dt) {
    if (state === 'run') {
      speed = Level.speedAt(dist); dist += speed * dt;
      p.vy += (hold ? -THRUST : G) * dt;
      p.vy = Math.max(Level.VMIN, Math.min(Level.VMAX, p.vy));
      p.y += p.vy * dt;
      if (p.y > laneBottom()) { p.y = laneBottom(); p.vy = 0; }
      if (p.y < laneTop()) { p.y = laneTop(); p.vy = 0; }

      // the longer you survive, the more each leaf is worth
      life += dt;
      const m = Math.min(MULT_MAX, 1 + Math.floor(life / MULT_EVERY));
      if (m > mult) {
        mult = m; banner = { txt: 'MOLTIPLICATORE x' + m, t: 90 };
        hud.mult.textContent = 'x' + m;
        hud.mult.classList.remove('pulse'); void hud.mult.offsetWidth; hud.mult.classList.add('pulse');
        navigator.vibrate && navigator.vibrate(40);
      }
      if (banner && (banner.t -= dt) <= 0) banner = null;

      // the jetpack spits joints
      if (hold && parts.length < 140 && Math.random() < .55 * dt) {
        parts.push({ k: 'joint', x: p.x - 18, y: p.y + 14, vx: -speed * .4 - rand(.5, 2), vy: rand(2.5, 5), rot: rand(0, 6), vr: rand(-.3, .3), life: 60, max: 60 });
      }
      if (hold && Math.random() < .8 * dt) parts.push({ k: 'puff', x: p.x - 18, y: p.y + 18, vx: -speed * .5, vy: rand(1, 3), life: 30, max: 30, r: rand(4, 8), color: '220,220,220' });
      if (hold && Math.random() < .6 * dt) parts.push({ k: 'puff', x: p.x - 18, y: p.y + 16, vx: -1, vy: rand(2, 4), life: 12, max: 12, r: rand(3, 6), color: '255,160,40' });

      while (level.x < dist + W + 400) level.next();

      const px = dist + p.x;
      for (const o of level.obs) if (Level.hit(o, px, p.y, dist)) die();
      level.obs = level.obs.filter(o => o.x + o.len / 2 + 20 > dist);

      for (const c of level.coins) {
        c.a += .08 * dt;
        if (Math.abs(c.x - px) < 30 && Math.abs(c.y - p.y + 4) < 30) {
          c.got = true; leaves += mult; puff(c.x - dist, c.y, 4, '120,220,120', 2.5);
        }
      }
      level.coins = level.coins.filter(c => !c.got && c.x > dist - 30);

      // missile packs: warn, lock on, fire
      for (const t of level.missiles) if (!t.done && px >= t.x) {
        t.done = true;
        for (let i = 0; i < t.n; i++) missiles.push({ x: W - 26, y: p.y, warn: 80 + i * 45, vx: 0 });
      }
      for (const mi of missiles) {
        if (mi.warn > 0) {
          mi.warn -= dt;
          if (mi.warn > 25) mi.y += (p.y - mi.y) * .08 * dt;
          if (mi.warn <= 0) mi.vx = speed + 7;
        } else {
          mi.x -= mi.vx * dt;
          if (Math.random() < .7) parts.push({ k: 'puff', x: mi.x + 18, y: mi.y, vx: 1, vy: 0, life: 20, max: 20, r: 5, color: '200,200,200' });
          if (Math.abs(mi.x - p.x) < 22 && mi.y > p.y - 30 && mi.y < p.y + 22) die();
        }
      }
      missiles = missiles.filter(mi => mi.x > -60);

      hud.dist.textContent = Math.floor(dist / 20) + ' m';
      hud.leaves.textContent = '🍃 ' + leaves;
    } else if (state === 'dead') {
      p.vy += G * dt; p.y = Math.min(laneBottom(), p.y + p.vy * dt);
    }
    for (const b of ambient) {
      if (b.k === 'snow') { b.x -= (speed * .35 + .5) * dt; b.y += b.v * dt; b.x += Math.sin(b.ph += .03 * dt) * .4; if (b.y > H - FLOOR_H) { b.y = -5; b.x = rand(0, W + 100); } }
      else if (b.k === 'bats' || b.k === 'birds') { b.x -= (speed * .5 + b.v) * dt; b.ph += .25 * dt; b.y += Math.sin(b.ph * .2) * .5 * dt; }
      else if (b.k === 'comets') { b.x -= (speed + 6) * dt; b.y += 2.5 * dt; if (b.x < -100 || b.y > H) { b.x = W + rand(100, 1500); b.y = rand(-50, H * .4); } }
      else b.x -= speed * b.s * dt;
      if (b.x < -80) { b.x = W + rand(40, 300); b.y = rand(0, (H - FLOOR_H) * (b.k === 'leaves' ? 1 : .6)); }
    }
    p.rot = (p.rot || 0) + (Math.max(-.3, Math.min(.3, p.vy * .035)) - (p.rot || 0)) * Math.min(1, .25 * dt);
    for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; if (q.k === 'joint') { q.rot += q.vr * dt; q.vy += .05 * dt; } }
    parts = parts.filter(q => q.life > 0);
  }

  function die() {
    if (state !== 'run') return;
    state = 'dead'; hold = false; banner = null;
    puff(p.x, p.y, 24, '255,180,60', 5);
    navigator.vibrate && navigator.vibrate(200);
    const meters = Math.floor(dist / 20), l = leaves, m = mult;
    setTimeout(() => { state = 'idle'; onOver(meters, l, m); }, 900);
  }

  // --- drawing --------------------------------------------------------------
  function drawJoint(x, y, rot, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#f7f2e2'; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(9, -3.2); ctx.lineTo(9, 3.2); ctx.lineTo(-10, 2); ctx.fill();
    ctx.fillStyle = '#d9c28a'; ctx.fillRect(-14, -2, 4, 4);
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(10, 0, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(10.5, 0, 1.4, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
    const sw = state === 'run' && p.vy === 0 ? Math.sin(dist * .15) * 5 : 3;
    drawChar(ctx, char, sw, dist);
    ctx.restore();
  }

  // Characters are parodies "in the style of", never named after real people.
  function drawChar(c, id, sw = 3, ph = 0) {
    // jetpack: two rockets
    for (const ox of [-24, -15]) {
      c.fillStyle = '#8d99a6'; c.beginPath(); c.roundRect(ox, -6, 9, 22, 4); c.fill();
      c.fillStyle = '#e53935'; c.fillRect(ox, -2, 9, 3);
      c.fillStyle = '#fdd835'; c.fillRect(ox, 1, 9, 3);
      c.fillStyle = '#43a047'; c.fillRect(ox, 4, 9, 3);
      c.fillStyle = '#555'; c.fillRect(ox + 1, 16, 7, 3);
    }
    // legs
    c.strokeStyle = { popstar: '#111', alien: '#90a4ae', cat: '#ef8a2c', skull: '#111', nonna: '#5d4037', hippie: '#1e88e5' }[id] || '#3b2a1a'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-3, 16); c.lineTo(-3 + sw, 28); c.moveTo(4, 16); c.lineTo(4 - sw, 28); c.stroke();
    if (id === 'popstar') {
      // platinum hair behind the head
      c.fillStyle = '#fff6c2'; c.beginPath(); c.ellipse(0, -11, 14, 15, 0, 0, 7); c.fill();
      // sparkly dress
      const g = c.createLinearGradient(-9, -4, 11, 18); g.addColorStop(0, '#f8bbd0'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#b0bec5');
      c.fillStyle = g; c.beginPath(); c.moveTo(-7, -4); c.lineTo(9, -4); c.lineTo(14, 18); c.lineTo(-12, 18); c.fill();
      c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect(-6 + ((i * 7 + ph * .3) % 16), 2 + (i * 5) % 14, 2, 2);
      c.fillStyle = '#f5cba7'; c.beginPath(); c.arc(2, -14, 10, 0, 7); c.fill();
      // fringe
      c.fillStyle = '#fff6c2'; c.beginPath(); c.ellipse(1, -21, 11, 5, -.1, Math.PI, 0); c.fill();
      // giant white shades + red lips
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-1, -19, 16, 7, 3); c.fill();
      c.fillStyle = '#111'; c.fillRect(1, -17, 5, 3); c.fillRect(8, -17, 5, 3);
      c.fillStyle = '#d50000'; c.beginPath(); c.ellipse(7, -8, 3, 1.6, 0, 0, 7); c.fill();
      // iconic hair bow
      c.fillStyle = '#fff6c2'; c.strokeStyle = '#e6d78a'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(1, -26); c.lineTo(-11, -34); c.lineTo(-10, -22); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(1, -26); c.lineTo(13, -34); c.lineTo(12, -22); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(1, -27, 3.5, 0, 7); c.fill(); c.stroke();
    } else if (id === 'cumenda') {
      // christmas sweater
      c.fillStyle = '#c62828'; c.beginPath(); c.roundRect(-11, -4, 24, 23, 7); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-11, 4, 24, 3);
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-6 + i * 7, 12, 1.6, 0, 7); c.fill(); }
      // round face, rosy cheeks, big grin
      c.fillStyle = '#f2b98f'; c.beginPath(); c.arc(2, -14, 11, 0, 7); c.fill();
      c.fillStyle = '#ef9a9a'; c.beginPath(); c.arc(9, -11, 2.5, 0, 7); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(5, -17, 1.4, 0, 7); c.arc(10, -17, 1.4, 0, 7); c.fill();
      c.strokeStyle = '#6d4c41'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(3, -20); c.lineTo(7, -21); c.moveTo(9, -21); c.lineTo(12, -20); c.stroke();
      c.fillStyle = '#5d1a1a'; c.beginPath(); c.arc(7, -11, 4, 0, Math.PI); c.fill();
      // thinning hair on the sides
      c.strokeStyle = '#8d7b6a'; c.lineWidth = 3; c.beginPath(); c.arc(1, -14, 10, Math.PI * .75, Math.PI * 1.15); c.stroke();
      // santa hat (cinepanettone vibes)
      c.fillStyle = '#d32f2f'; c.beginPath(); c.moveTo(-9, -22); c.quadraticCurveTo(0, -42, 16, -34); c.lineTo(13, -22); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-10, -25, 24, 5, 2.5); c.fill();
      c.beginPath(); c.arc(16, -34, 3.5, 0, 7); c.fill();
    } else if (id === 'hippie') {
      // long hair, tie-dye shirt, flower crown, round shades
      c.fillStyle = '#7b4a24'; c.beginPath(); c.ellipse(-2, -8, 13, 18, 0, 0, 7); c.fill();
      const g = c.createRadialGradient(1, 6, 2, 1, 6, 16); g.addColorStop(0, '#ffeb3b'); g.addColorStop(.4, '#ff4081'); g.addColorStop(.7, '#7c4dff'); g.addColorStop(1, '#00e5ff');
      c.fillStyle = g; c.beginPath(); c.roundRect(-9, -4, 20, 22, 6); c.fill();
      c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(2, -14, 10, 0, 7); c.fill();
      c.strokeStyle = '#ff9800'; c.lineWidth = 1.8; c.beginPath(); c.arc(5, -15, 3, 0, 7); c.moveTo(14, -15); c.arc(11, -15, 3, 0, 7); c.stroke();
      c.strokeStyle = '#5d3a1a'; c.lineWidth = 1.5; c.beginPath(); c.arc(8, -9, 3, .3, Math.PI - .3); c.stroke();
      ['#ff4081', '#ffeb3b', '#ffffff', '#ff4081', '#7c4dff'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(-8 + i * 4.5, -23 + Math.abs(i - 2) * 1.2, 2.6, 0, 7); c.fill(); });
    } else if (id === 'alien') {
      c.fillStyle = '#b0bec5'; c.beginPath(); c.roundRect(-9, -4, 20, 22, 6); c.fill();
      c.fillStyle = '#76ff03'; c.fillRect(-9, 6, 20, 3);
      c.strokeStyle = '#64dd17'; c.lineWidth = 2; c.beginPath(); c.moveTo(-2, -24); c.lineTo(-6, -34); c.moveTo(6, -24); c.lineTo(10, -34); c.stroke();
      c.fillStyle = '#ccff90'; c.beginPath(); c.arc(-6, -34, 3, 0, 7); c.arc(10, -34, 3, 0, 7); c.fill();
      c.fillStyle = '#76d672'; c.beginPath(); c.ellipse(2, -15, 11, 13, 0, 0, 7); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.ellipse(-1, -16, 3, 5, -.5, 0, 7); c.ellipse(8, -16, 3, 5, .5, 0, 7); c.fill();
      c.strokeStyle = '#2e5d2c'; c.lineWidth = 1.2; c.beginPath(); c.arc(4, -8, 2.5, .2, Math.PI - .2); c.stroke();
    } else if (id === 'cat') {
      // tail, striped body, sleepy eyes
      c.strokeStyle = '#ef8a2c'; c.lineWidth = 4; c.beginPath(); c.moveTo(-8, 14); c.quadraticCurveTo(-30, 18, -26, -2 + Math.sin(ph * .1) * 3); c.stroke();
      c.fillStyle = '#ef8a2c'; c.beginPath(); c.roundRect(-9, -4, 20, 22, 8); c.fill();
      c.fillStyle = '#c96a12'; for (let i = 0; i < 3; i++) c.fillRect(-9, 0 + i * 6, 20, 2.5);
      c.fillStyle = '#ef8a2c'; c.beginPath(); c.arc(2, -14, 11, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-8, -18); c.lineTo(-6, -30); c.lineTo(1, -23); c.fill();
      c.beginPath(); c.moveTo(12, -18); c.lineTo(11, -30); c.lineTo(4, -23); c.fill();
      c.fillStyle = '#ffab91'; c.beginPath(); c.moveTo(-6, -21); c.lineTo(-5, -27); c.lineTo(-2, -23); c.fill();
      c.strokeStyle = '#3e2723'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(2, -16); c.lineTo(7, -16); c.moveTo(9, -16); c.lineTo(13, -16); c.stroke();
      c.fillStyle = '#ff8a80'; c.beginPath(); c.arc(9, -12, 1.8, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(11, -11); c.lineTo(18, -12); c.moveTo(11, -10); c.lineTo(18, -8); c.stroke();
    } else if (id === 'skull') {
      c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect(-9, -4, 20, 22, 6); c.fill();
      c.strokeStyle = '#eee'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(1, -2); c.lineTo(1, 16);
      for (let i = 0; i < 3; i++) { c.moveTo(-6, 1 + i * 5); c.lineTo(8, 1 + i * 5); }
      c.stroke();
      c.fillStyle = '#f5f5f5'; c.beginPath(); c.arc(2, -16, 10, 0, 7); c.fill(); c.fillRect(-2, -10, 10, 6);
      c.fillStyle = '#111'; c.beginPath(); c.arc(-1, -16, 3, 0, 7); c.arc(7, -16, 3, 0, 7); c.fill();
      c.beginPath(); c.moveTo(3, -12); c.lineTo(1.5, -9.5); c.lineTo(4.5, -9.5); c.fill();
      c.fillStyle = '#ff7a00'; c.beginPath(); c.arc(-1, -16, 1, 0, 7); c.arc(7, -16, 1, 0, 7); c.fill();
      c.strokeStyle = '#111'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(-1 + i * 2.5, -7); c.lineTo(-1 + i * 2.5, -4); } c.stroke();
    } else if (id === 'nonna') {
      c.fillStyle = '#8e24aa'; c.beginPath(); c.roundRect(-10, -4, 22, 23, 7); c.fill();
      c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(1, 1 + i * 6, 1.5, 0, 7); c.fill(); }
      c.fillStyle = '#cfcfcf'; c.beginPath(); c.arc(1, -16, 12, Math.PI, 0); c.fill(); c.beginPath(); c.arc(-2, -28, 6, 0, 7); c.fill();
      c.fillStyle = '#f3c9a8'; c.beginPath(); c.arc(2, -13, 10, 0, 7); c.fill();
      c.fillStyle = '#cfcfcf'; c.beginPath(); c.ellipse(0, -21, 11, 5, 0, Math.PI, 0); c.fill();
      c.strokeStyle = '#795548'; c.lineWidth = 1.3; c.beginPath(); c.arc(5, -14, 3, 0, 7); c.moveTo(14, -14); c.arc(11, -14, 3, 0, 7); c.stroke();
      c.fillStyle = '#f48fb1'; c.beginPath(); c.arc(12, -9, 2.2, 0, 7); c.fill();
      c.strokeStyle = '#6d4c41'; c.beginPath(); c.arc(8, -8, 2.5, .3, Math.PI - .3); c.stroke();
    } else {
      // body
      c.fillStyle = '#2e7d32'; c.beginPath(); c.roundRect(-9, -4, 20, 22, 6); c.fill();
      c.fillStyle = '#fdd835'; c.fillRect(-9, 5, 20, 3);
      // dreads
      c.strokeStyle = '#3e2723'; c.lineWidth = 3.5;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6 + i * 2, -16); c.quadraticCurveTo(-14 - i * 2, -4, -10 - i * 3, 6 + Math.sin(ph * .1 + i) * 2); c.stroke(); }
      // head
      c.fillStyle = '#8d5524'; c.beginPath(); c.arc(2, -14, 10, 0, 7); c.fill();
      // sunglasses + smile
      c.fillStyle = '#111'; c.beginPath(); c.roundRect(1, -18, 12, 5, 2); c.fill();
      c.strokeStyle = '#2b1608'; c.lineWidth = 1.5; c.beginPath(); c.arc(7, -10, 3.5, .2, Math.PI - .5); c.stroke();
      // rasta tam
      const hat = [['#43a047', -23, 9], ['#fdd835', -27, 8], ['#e53935', -30, 6]];
      for (const [col, y, ry] of hat) { c.fillStyle = col; c.beginPath(); c.ellipse(-1, y, 14, ry, -.15, Math.PI, 0); c.fill(); }
    }
  }

  function preview(canvas, id) {
    const c = canvas.getContext('2d'), s = canvas.width / 80;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save(); c.translate(canvas.width / 2 + 4 * s, canvas.height * .64); c.scale(s * 1.3, s * 1.3); drawChar(c, id); c.restore();
  }
  function setChar(id) { char = id; draw(); }
  function setTheme(id) { theme = Themes.T[id] ? id : 'rasta'; layers = null; if (W) { rebake(); draw(); } }
  function previewTheme(canvas, id) {
    const c = canvas.getContext('2d'), t = Themes.T[id], Wp = 300, k = canvas.width / Wp, Hp = canvas.height / k, fy = Hp - 30;
    c.save(); c.scale(k, k);
    t.sky(c, Wp, Hp, fy); c.save(); c.translate(-40, 0); t.far(c, Hp, fy); c.restore();
    Themes.hills(c, t, Wp, Hp, fy, 30); Themes.floor(c, t, Wp, Hp, 8, 30, 0);
    c.translate(70, fy - 40); c.scale(1.3, 1.3); drawChar(c, char);
    c.restore();
  }

  // back = behind the scenery (leaves, birds), front = in front of it (snow)
  function drawAmbient(back) {
    for (const b of ambient) {
      if (b.k === 'leaves' && back) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.drawImage(leafSprBg, -60, -60); ctx.restore(); }
      else if (b.k === 'snow' && !back) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.v * 1.6, 0, 7); ctx.fill(); }
      else if ((b.k === 'bats' || b.k === 'birds') && back) {
        const w = Math.sin(b.ph) * 6, sz = b.k === 'bats' ? 12 : 9;
        ctx.strokeStyle = ctx.fillStyle = b.k === 'bats' ? '#0a0410' : '#3a1f3d'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(b.x - sz, b.y - w); ctx.quadraticCurveTo(b.x - sz / 2, b.y - 4, b.x, b.y); ctx.quadraticCurveTo(b.x + sz / 2, b.y - 4, b.x + sz, b.y - w); ctx.stroke();
      } else if (b.k === 'comets' && back) {
        const g = ctx.createLinearGradient(b.x, b.y, b.x + 60, b.y - 25); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + 60, b.y - 25); ctx.stroke();
      }
    }
  }

  function draw() {
    if (!W) return;
    if (!layers) rebake();
    const t = layers.t, fy = H - FLOOR_H;
    ctx.drawImage(layers.sky, 0, 0, W, H);
    drawAmbient(true);
    const fo = (dist * .25) % Themes.TILE;
    for (let x = -fo; x < W; x += Themes.TILE) ctx.drawImage(layers.far, x, 0, Themes.TILE, H);
    Themes.hills(ctx, t, W, H, fy, (dist * .3) % 240);
    Themes.floor(ctx, t, W, H, TOP, FLOOR_H, dist);
    drawAmbient(false);

    if (level) {
      for (const c of level.coins) {
        const x = c.x - dist;
        if (x < -30 || x > W + 30) continue;
        const sx = Math.abs(Math.cos(c.a));
        ctx.save(); ctx.translate(x, c.y); ctx.scale(.4 + sx * .6, 1);
        ctx.drawImage(leafSpr, -18, -20); ctx.restore();
      }
      for (const o of level.obs) {
        if (o.x - dist - o.len > W) continue;
        let [ax, ay, bx, by] = Level.ends(o, dist);
        ax -= dist; bx -= dist;
        ctx.lineCap = 'round';
        ctx.strokeStyle = o.spin ? 'rgba(255,82,82,.35)' : 'rgba(253,216,53,.35)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.strokeStyle = o.spin ? '#ffcdd2' : '#fff59d'; ctx.lineWidth = 4.5 + Math.sin(dist * .2) * 1.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        for (const [x, y] of [[ax, ay], [bx, by]]) {
          ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffcdd2'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
        }
      }
    }

    for (const m of missiles || []) {
      if (m.warn > 0) {
        if (m.warn <= 25 || Math.floor(m.warn / 8) % 2) {
          ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(W - 24, m.y, 14, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Bungee, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', W - 24, m.y + 1);
        }
      } else {
        ctx.save(); ctx.translate(m.x, m.y);
        ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-8, -6); ctx.lineTo(16, -6); ctx.lineTo(16, 6); ctx.lineTo(-8, 6); ctx.fill();
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-8, -6); ctx.lineTo(-8, 6); ctx.fill();
        ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.moveTo(16, -4); ctx.lineTo(26 + Math.random() * 6, 0); ctx.lineTo(16, 4); ctx.fill();
        ctx.restore();
      }
    }

    for (const q of parts) {
      const a = q.life / q.max;
      if (q.k === 'joint') { ctx.globalAlpha = Math.min(1, a * 2); drawJoint(q.x, q.y, q.rot, 1.1); }
      else { ctx.globalAlpha = a * .7; ctx.fillStyle = `rgb(${q.color})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.8 - a), 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (p) drawPlayer();
    if (banner) {
      ctx.save(); ctx.globalAlpha = Math.min(1, banner.t / 20);
      ctx.font = '28px Bungee, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(banner.txt, W / 2, H * .3);
      ctx.fillStyle = '#fdd835'; ctx.fillText(banner.txt, W / 2, H * .3);
      ctx.restore();
    }
  }

  return { init, start, pause, resume, resize, preview, setChar, setTheme, previewTheme };
})();

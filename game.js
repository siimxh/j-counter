// JAH-PACK RIDE — a Jetpack Joyride-style runner where the rocket backpack spits joints.
const Game = (() => {
  let cv, ctx, W = 0, H = 0, raf = 0, last = 0;
  let state = 'idle', hold = false, onOver = () => {}, hud = {}, char = 'rasta';
  let p, obs, coins, missiles, parts, bg, dist, speed, leaves, t;
  let leafSpr, leafSprBg;
  const G = 0.42, THRUST = 0.95, TOP = 18, FLOOR_H = 42;
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
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state !== 'run') { if (p) p.x = W * .22; draw(); }
  }

  function reset() {
    p = { x: W * .22, y: H / 2, vy: 0, r: 15 };
    obs = []; coins = []; missiles = []; parts = [];
    bg = Array.from({ length: 6 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0, 6), s: rand(.15, .4) }));
    dist = 0; speed = 4.2; leaves = 0; t = { zap: 70, coin: 30, miss: 0 };
  }

  function start() {
    resize(); reset(); state = 'run'; hold = false;
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function pause() { cancelAnimationFrame(raf); hold = false; }
  function resume() { if (state === 'run') { last = performance.now(); raf = requestAnimationFrame(loop); } else { resize(); } }

  function loop(now) {
    const dt = Math.min(2.5, (now - last) / 16.67); last = now;
    update(dt); draw();
    if (state !== 'idle') raf = requestAnimationFrame(loop);
  }

  // --- spawning -----------------------------------------------------------
  function spawnZapper() {
    const L = rand(90, 170), ang = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4][Math.floor(Math.random() * 4)];
    const hx = Math.cos(ang) * L / 2, hy = Math.sin(ang) * L / 2;
    const cy = rand(TOP + Math.abs(hy) + 14, H - FLOOR_H - Math.abs(hy) - 14);
    obs.push({ x: W + 90, y: cy, hx, hy });
  }
  function spawnCoins() {
    const n = 5 + Math.floor(Math.random() * 5), y0 = rand(TOP + 40, H - FLOOR_H - 40), wave = Math.random() < .5;
    for (let i = 0; i < n; i++) coins.push({ x: W + 40 + i * 30, y: y0 + (wave ? Math.sin(i * .8) * 34 : 0), a: rand(0, 6) });
  }
  function spawnMissile() { missiles.push({ x: W - 26, y: p.y, warn: 80, vx: 0 }); }

  function puff(x, y, n, color, spread = 2) {
    for (let i = 0; i < n; i++) parts.push({ k: 'puff', x, y, vx: rand(-spread, spread), vy: rand(-spread, spread), life: 40, max: 40, r: rand(3, 7), color });
  }

  // --- update ---------------------------------------------------------------
  function update(dt) {
    if (state === 'run') {
      dist += speed * dt; speed = Math.min(11, 4.2 + dist / 2600);
      p.vy += (hold ? -THRUST : G) * dt;
      p.vy = Math.max(-7.5, Math.min(9, p.vy));
      p.y += p.vy * dt;
      const floor = H - FLOOR_H - p.r - 8;
      if (p.y > floor) { p.y = floor; p.vy = 0; }
      if (p.y < TOP + 40) { p.y = TOP + 40; p.vy = 0; }

      // the jetpack spits joints
      if (hold && Math.random() < .55 * dt) {
        parts.push({ k: 'joint', x: p.x - 18, y: p.y + 14, vx: -speed * .4 - rand(.5, 2), vy: rand(2.5, 5), rot: rand(0, 6), vr: rand(-.3, .3), life: 60, max: 60 });
      }
      if (hold && Math.random() < .8 * dt) parts.push({ k: 'puff', x: p.x - 18, y: p.y + 18, vx: -speed * .5, vy: rand(1, 3), life: 30, max: 30, r: rand(4, 8), color: '220,220,220' });
      if (hold && Math.random() < .6 * dt) parts.push({ k: 'puff', x: p.x - 18, y: p.y + 16, vx: -1, vy: rand(2, 4), life: 12, max: 12, r: rand(3, 6), color: '255,160,40' });

      if ((t.zap -= dt) <= 0) { spawnZapper(); t.zap = Math.max(38, 95 - dist / 120) + rand(0, 40); }
      if ((t.coin -= dt) <= 0) { spawnCoins(); t.coin = rand(90, 160); }
      if (dist > 3000 && (t.miss -= dt) <= 0) { spawnMissile(); t.miss = Math.max(150, 420 - dist / 60) + rand(0, 120); }

      for (const o of obs) {
        o.x -= speed * dt;
        if (segDist(p.x, p.y, o.x - o.hx, o.y - o.hy, o.x + o.hx, o.y + o.hy) < p.r + 6) die();
      }
      obs = obs.filter(o => o.x > -120);

      for (const c of coins) {
        c.x -= speed * dt; c.a += .08 * dt;
        if (!c.got && Math.hypot(c.x - p.x, c.y - p.y) < p.r + 12) {
          c.got = true; leaves++; puff(c.x, c.y, 4, '120,220,120', 2.5);
        }
      }
      coins = coins.filter(c => !c.got && c.x > -30);

      for (const m of missiles) {
        if (m.warn > 0) { m.warn -= dt; m.y += (p.y - m.y) * .06 * dt; if (m.warn <= 0) m.vx = speed + 7; }
        else {
          m.x -= m.vx * dt;
          if (Math.random() < .7) parts.push({ k: 'puff', x: m.x + 18, y: m.y, vx: 1, vy: 0, life: 20, max: 20, r: 5, color: '200,200,200' });
          if (Math.hypot(m.x - p.x, m.y - p.y) < p.r + 9) die();
        }
      }
      missiles = missiles.filter(m => m.x > -60);

      hud.dist.textContent = Math.floor(dist / 20) + ' m';
      hud.leaves.textContent = '🍃 ' + leaves;
    } else if (state === 'dead') {
      p.vy += G * dt; p.y = Math.min(H - FLOOR_H - p.r - 8, p.y + p.vy * dt);
    }
    for (const b of bg) { b.x -= speed * b.s * dt; if (b.x < -80) { b.x = W + 80; b.y = rand(0, H); } }
    for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; if (q.k === 'joint') { q.rot += q.vr * dt; q.vy += .05 * dt; } }
    parts = parts.filter(q => q.life > 0);
  }

  function die() {
    if (state !== 'run') return;
    state = 'dead'; hold = false;
    puff(p.x, p.y, 24, '255,180,60', 5);
    navigator.vibrate && navigator.vibrate(200);
    const meters = Math.floor(dist / 20), l = leaves;
    setTimeout(() => { state = 'idle'; onOver(meters, l); }, 900);
  }

  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - ax - k * dx, py - ay - k * dy);
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
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.max(-.3, Math.min(.3, p.vy * .035)));
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
    c.strokeStyle = id === 'popstar' ? '#111' : '#3b2a1a'; c.lineWidth = 5; c.lineCap = 'round';
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
    c.save(); c.translate(canvas.width / 2 + 4 * s, canvas.height * .58); c.scale(s * 1.4, s * 1.4); drawChar(c, id); c.restore();
  }
  function setChar(id) { char = id; draw(); }

  function draw() {
    if (!W) return;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1f12'); sky.addColorStop(1, '#173a22');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (const b of bg) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.drawImage(leafSprBg, -60, -60); ctx.restore(); }

    // parallax hills
    ctx.fillStyle = '#12301c';
    const off = (dist * .3) % 240;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = -off; x < W + 240; x += 120) ctx.quadraticCurveTo(x + 60, H - FLOOR_H - 90, x + 120, H - FLOOR_H);
    ctx.lineTo(W, H); ctx.fill();

    // ceiling + rasta floor
    ctx.fillStyle = '#071209'; ctx.fillRect(0, 0, W, TOP);
    const fy = H - FLOOR_H;
    ['#e53935', '#fdd835', '#43a047'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, fy + i * 6, W, 6); });
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(0, fy + 18, W, FLOOR_H - 18);
    ctx.fillStyle = '#3a2816';
    for (let x = -(dist % 60); x < W; x += 60) ctx.fillRect(x, fy + 26, 30, 6);

    for (const c of coins) {
      const sx = Math.abs(Math.cos(c.a));
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(.4 + sx * .6, 1);
      ctx.drawImage(leafSpr, -18, -20); ctx.restore();
    }

    for (const o of obs) {
      const ax = o.x - o.hx, ay = o.y - o.hy, bx = o.x + o.hx, by = o.y + o.hy;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(253,216,53,.35)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 4 + Math.random() * 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      for (const [x, y] of [[ax, ay], [bx, by]]) {
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffcdd2'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      }
    }

    for (const m of missiles) {
      if (m.warn > 0) {
        if (Math.floor(m.warn / 8) % 2) {
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
  }

  return { init, start, pause, resume, resize, preview, setChar };
})();

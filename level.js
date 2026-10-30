// Level generator for Jah-Pack Ride.
// The world is a sequence of "columns" of lasers. Every column must leave a gap the
// player's hitbox fits through, and columns are spaced so the jetpack can physically
// move from one gap to the next at the current speed. sim.js checks this offline.
const Level = (() => {
  const G = 0.42, THRUST = 0.95, VMIN = -7.5, VMAX = 9;
  // player hitbox: head circle (y-14, r11) + body circle (y+6, r12); laser half-thickness
  const HEAD = 25, FEET = 18, LASER = 4, ORB = 9;
  const PI = Math.PI;
  const speedAt = d => Math.min(10, 4.2 + d / 2600);
  const clampV = v => Math.max(VMIN, Math.min(VMAX, v));

  // frames to move the player's centre by dy, starting from a bad vertical speed
  function travelFrames(dy) {
    if (Math.abs(dy) < 1) return 0;
    const up = dy < 0;
    let y = 0, vy = up ? VMAX * .4 : VMIN * .4, f = 0;
    while (up ? y > dy : y < dy) { vy = clampV(vy + (up ? -THRUST : G)); y += vy; f++; }
    return f;
  }

  function ends(o, d) {
    const a = o.ang + (o.spin || 0) * d, hx = Math.cos(a) * o.len / 2, hy = Math.sin(a) * o.len / 2;
    return [o.x - hx, o.y - hy, o.x + hx, o.y + hy];
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - ax - k * dx, py - ay - k * dy);
  }
  function hit(o, px, py, d) {
    if (Math.abs(o.x - px) > o.len / 2 + 30) return false;
    const [ax, ay, bx, by] = ends(o, d);
    return segDist(px, py - 14, ax, ay, bx, by) < 11 + LASER || segDist(px, py + 6, ax, ay, bx, by) < 12 + LASER;
  }

  const extentY = o => { const e = o.spin ? o.len / 2 : Math.abs(Math.sin(o.ang)) * o.len / 2; return [o.y - e, o.y + e]; };
  const extentX = o => (o.spin ? o.len / 2 : Math.abs(Math.cos(o.ang)) * o.len / 2) + ORB;

  // free ranges of the player's centre y left by a column of lasers
  function windows(lasers, Y0, Y1) {
    const bl = lasers.map(o => { const [a, b] = extentY(o); return [a - FEET - LASER, b + HEAD + LASER]; }).sort((p, q) => p[0] - q[0]);
    const out = []; let y = Y0;
    for (const [a, b] of bl) { if (a > y) out.push([y, Math.min(a, Y1)]); y = Math.max(y, b); }
    if (y < Y1) out.push([y, Y1]);
    return out.filter(w => w[1] > w[0]);
  }
  // vertical move needed to get from any window of A (the player may be in either) into B
  function shift(A, B) {
    let worst = 0, dy = 0;
    for (const a of A) {
      const c = (a[0] + a[1]) / 2;
      let best = Infinity, bdy = 0;
      for (const b of B) {
        const t = Math.max(b[0] + 10, Math.min(b[1] - 10, c));
        if (Math.abs(t - c) < best) { best = Math.abs(t - c); bdy = t - c; }
      }
      if (best > worst) { worst = best; dy = bdy; }
    }
    return dy;
  }

  // 3x5 pixel font for leaf writing
  const FONT = {
    4: ['101', '101', '111', '001', '001'], 2: ['111', '001', '111', '100', '111'], 0: ['111', '101', '101', '101', '111'],
    J: ['111', '001', '001', '101', '111'], A: ['010', '101', '111', '101', '101'], H: ['101', '101', '111', '101', '101'],
  };

  function create({ y0: Y0, y1: Y1, top: TOPY, floor: FLOORY, startX, rng = Math.random }) {
    const R = (a, b) => a + rng() * (b - a), pick = a => a[Math.floor(rng() * a.length)];
    const out = { obs: [], coins: [], missiles: [], x: startX };
    let prevW = [[Y0, Y1]], sinceCoins = 0;
    const diff = () => Math.min(1, out.x / 80000);
    const minFree = () => 82 - 26 * diff();
    const vert = (a, b) => ({ y: (a + b) / 2, ang: PI / 2, len: b - a });

    // add one column of lasers; returns its centre x or null if it would be unfair
    function column(lasers, extraGap = 0) {
      const win = windows(lasers, Y0, Y1).filter(w => w[1] - w[0] >= minFree());
      if (!win.length || lasers.some(o => o.len < 40)) return null;
      const hx = Math.max(...lasers.map(o => extentX(o) + Math.abs(o.dx || 0)));
      const cx = out.x + speedAt(out.x) * (travelFrames(shift(prevW, win)) + 10) + 30 + extraGap + hx;
      for (const o of lasers) out.obs.push({ y: o.y, ang: o.ang, len: o.len, spin: o.spin, x: cx + (o.dx || 0) });
      prevW = win; out.x = cx + hx;
      return { cx, win };
    }
    const coin = (x, y) => out.coins.push({ x, y, a: R(0, 6) });
    const coinRow = (cx, y, n, sp = 28) => { for (let i = 0; i < n; i++) coin(cx + (i - (n - 1) / 2) * sp, y); };

    const P = {
      single() {
        const ang = pick([0, PI / 2, PI / 4, -PI / 4]), len = R(90, 150 + 70 * diff());
        return column([{ y: R(Y0 - 30, Y1 + 20), ang, len }]);
      },
      gate() {
        const fw = R(minFree(), minFree() + 70), w0 = R(Y0, Y1 - fw), w1 = w0 + fw;
        const top = w0 - HEAD - LASER, bot = w1 + FEET + LASER, L = [];
        if (top - TOPY > 40) L.push(vert(TOPY, top));
        if (FLOORY - bot > 40) L.push(vert(bot, FLOORY));
        if (!L.length) return null;
        const c = column(L);
        if (c) coinRow(c.cx, (w0 + w1) / 2, 5);
        return c;
      },
      stairs() {
        const n = 3 + Math.floor(rng() * 2 + diff()), cov = R(.45, .6);
        let fromTop = rng() < .5, ok = null;
        for (let i = 0; i < n; i++) {
          const len = (FLOORY - TOPY) * cov;
          const c = column([fromTop ? vert(TOPY, TOPY + len) : vert(FLOORY - len, FLOORY)]);
          if (!c) return ok;
          ok = c; fromTop = !fromTop;
          const w = c.win[0]; coin(c.cx, (w[0] + w[1]) / 2);
        }
        return ok;
      },
      double() {
        const len = R(180, 300), a = R(Y0, Y1), b = R(Y0, Y1);
        if (Math.abs(a - b) < 150) return null;
        return column([{ y: a, ang: 0, len }, { y: b, ang: 0, len: len * R(.6, 1) }]);
      },
      corridor() {
        // a run of gates whose hole drifts up and down
        const n = 3 + Math.floor(rng() * 2), fw = minFree() + R(40, 70);
        let w0 = R(Y0, Y1 - fw), ok = null;
        for (let i = 0; i < n; i++) {
          const top = w0 - HEAD - LASER, bot = w0 + fw + FEET + LASER, L = [];
          if (top - TOPY > 40) L.push(vert(TOPY, top));
          if (FLOORY - bot > 40) L.push(vert(bot, FLOORY));
          const c = L.length && column(L);
          if (!c) return ok;
          ok = c; coin(c.cx, w0 + fw / 2);
          w0 = Math.max(Y0, Math.min(Y1 - fw, w0 + R(-90, 90)));
        }
        return ok;
      },
      pillars() {
        // short floating lasers one after another
        const n = 2 + Math.floor(rng() * 2);
        let ok = null;
        for (let i = 0; i < n; i++) {
          const len = R(80, 130), c = column([{ y: R(Y0 + 20, Y1 - 20), ang: PI / 2, len }]);
          if (!c) return ok;
          ok = c;
        }
        return ok;
      },
      chevron() {
        // "<" or ">" made of two diagonals
        const arm = R(110, 150), e = arm / Math.SQRT2 / 2, y = R(Y0, Y1), dir = pick([1, -1]);
        return column([{ y: y - e, ang: -dir * PI / 4, len: arm }, { y: y + e, ang: dir * PI / 4, len: arm }]);
      },
      spinner() {
        if (diff() < .25) return null;
        const len = Math.min(150, (Y1 - Y0) * .4);
        return column([{ y: R(Y0, Y1), ang: R(0, PI), len, spin: pick([-1, 1]) * R(.003, .005) }], 60);
      },
    };
    const OBST = [['single', 18], ['gate', 18], ['corridor', 12], ['stairs', 10], ['double', 8], ['pillars', 12], ['chevron', 10], ['spinner', 8]];

    const COINS = {
      block() {
        const rows = 2 + Math.floor(rng() * 4), cols = 6 + Math.floor(rng() * 7), y = R(Y0 + 10, Y1 - rows * 28);
        for (let r = 0; r < rows; r++) coinRow(out.x + cols * 14 + 40, y + r * 28, cols);
        return [y, y + rows * 28, cols * 28];
      },
      waves() {
        const rows = 2 + Math.floor(rng() * 2), n = 14, y = R(Y0 + 50, Y1 - 50 - rows * 30);
        for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) coin(out.x + 40 + i * 28, y + r * 30 + Math.sin(i * .5) * 45);
        return [y - 45, y + rows * 30 + 45, n * 28];
      },
      arrow() {
        const y = R(Y0 + 90, Y1 - 90);
        const tip = out.x + 40 + 6 * 28 + 150;
        for (let i = 0; i < 6; i++) { coin(out.x + 40 + i * 28, y); coin(tip - i * 26, y - i * 24); if (i) coin(tip - i * 26, y + i * 24); }
        return [y - 120, y + 120, 6 * 28 + 160];
      },
      text() {
        const y = R(Y0 + 10, Y1 - 5 * 24);
        pick([[4, 2, 0], ['J', 'A', 'H']]).forEach((ch, k) => FONT[ch].forEach((row, r) => [...row].forEach((v, c) => {
          if (v === '1') coin(out.x + 40 + k * 4 * 24 + c * 24, y + r * 24);
        })));
        return [y, y + 5 * 24, 11 * 24];
      },
      heart() {
        const y = R(Y0 + 70, Y1 - 70), cx = out.x + 120;
        for (let i = 0; i < 18; i++) {
          const t = i / 18 * 2 * PI;
          coin(cx + 5.5 * 16 * Math.pow(Math.sin(t), 3) / 3, y - 5.5 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 3);
        }
        return [y - 70, y + 70, 240];
      },
      zigzag() {
        const y = R(Y0 + 70, Y1 - 70), n = 18;
        for (let i = 0; i < n; i++) coin(out.x + 40 + i * 26, y + ((i % 8) < 4 ? (i % 4) : 4 - (i % 4)) * 30 - 60);
        return [y - 60, y + 60, n * 26];
      },
      diamond() {
        const y = R(Y0 + 90, Y1 - 90), cx = out.x + 140, r = 90;
        for (let i = 0; i < 16; i++) {
          const t = i / 16 * 4, k = t % 1, q = Math.floor(t);
          const pts = [[0, -r], [r, 0], [0, r], [-r, 0], [0, -r]];
          coin(cx + pts[q][0] + (pts[q + 1][0] - pts[q][0]) * k, y + pts[q][1] + (pts[q + 1][1] - pts[q][1]) * k);
        }
        coin(cx, y);
        return [y - r, y + r, 2 * r + 60];
      },
      ring() {
        const y = R(Y0 + 80, Y1 - 80), cx = out.x + 120, r = 75;
        for (let i = 0; i < 16; i++) coin(cx + Math.cos(i / 16 * 2 * PI) * r, y + Math.sin(i / 16 * 2 * PI) * r);
        coinRow(cx, y, 3);
        return [y - r, y + r, 2 * r + 80];
      },
      leaf() {
        // a big cannabis leaf drawn with leaves
        const y = R(Y0 + 120, Y1 - 30), cx = out.x + 150;
        for (const [a, s] of [[-100, .42], [-66, .66], [-33, .88], [0, 1], [33, .88], [66, .66], [100, .42]]) {
          const r = (a - 90) * PI / 180, n = Math.round(5 * s);
          for (let i = 1; i <= n; i++) coin(cx + Math.cos(r) * i * 24, y + Math.sin(r) * i * 24);
        }
        coin(cx, y); coin(cx, y + 24);
        return [y - 125, y + 30, 300];
      },
      smile() {
        const y = R(Y0 + 80, Y1 - 80), cx = out.x + 120;
        for (let i = 0; i < 9; i++) { const t = PI * (.15 + .7 * i / 8); coin(cx + Math.cos(t) * 70, y + Math.sin(t) * 55); }
        coin(cx - 30, y - 35); coin(cx + 30, y - 35);
        return [y - 50, y + 60, 240];
      },
    };

    function weighted(list) {
      let r = rng() * list.reduce((s, [, w]) => s + w, 0);
      for (const [k, w] of list) if ((r -= w) <= 0) return k;
      return list[0][0];
    }

    out.next = function () {
      if (sinceCoins >= 1 && rng() < .45) {
        const lead = speedAt(out.x) * 20;
        out.x += lead;
        const [a, b, w] = COINS[pick(Object.keys(COINS))]();
        out.x += w + 80; prevW = [[Math.max(Y0, a), Math.min(Y1, b)]]; sinceCoins = 0;
        return;
      }
      if (out.x > 6000 && rng() < .14) {
        const n = 1 + Math.floor(rng() * (2 + diff() * 2)), s = speedAt(out.x);
        out.missiles.push({ x: out.x + 40, n });
        out.x += 40 + s * (80 + (n - 1) * 45 + 90);
        prevW = [[Y0, Y1]];
        return;
      }
      sinceCoins++;
      for (let tries = 0; tries < 12; tries++) if (P[weighted(OBST)]()) return;
      out.x += 200;
    };
    return out;
  }

  return { create, hit, ends, speedAt, travelFrames, G, THRUST, VMIN, VMAX };
})();
if (typeof module !== 'undefined') module.exports = Level;

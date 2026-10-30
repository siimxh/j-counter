// Fairness check for Jah-Pack Ride levels.
// For each generated level it tracks every (y, vy) the player can reach frame by frame
// (holding or releasing). If that set ever becomes empty, the level had an unavoidable death.
// Usage: node tools/sim.js [runs] [maxMeters]
const Level = require('../level.js');

const RUNS = +process.argv[2] || 40, MAX_M = +process.argv[3] || 2500, ONLY = process.argv[4];
const TOP = 18, FLOOR_H = 42;

function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// the generator the game shipped with before, rebuilt in world coordinates
function oldWorld(W, H, rng) {
  const R = (a, b) => a + rng() * (b - a);
  const obs = [], tm = { zap: 70 };
  return {
    px: W * .22, y0: TOP + 40, y1: H - FLOOR_H - 15 - 8, vmin: -7.5, vmax: 9,
    speedAt: d => Math.min(11, 4.2 + d / 2600),
    step(dist, speed) {
      if ((tm.zap -= 1) <= 0) {
        const L = R(90, 170), ang = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4][Math.floor(rng() * 4)];
        const hy = Math.abs(Math.sin(ang) * L / 2);
        obs.push({ x: dist + W + 90, y: R(TOP + hy + 14, H - FLOOR_H - hy - 14), ang, len: L });
        tm.zap = Math.max(38, 95 - dist / 120) + R(0, 40);
      }
    },
    obs,
    hit(o, px, py) {
      if (Math.abs(o.x - px) > o.len / 2 + 30) return false;
      const [ax, ay, bx, by] = Level.ends(o, 0);
      const dx = bx - ax, dy = by - ay, k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(px - ax - k * dx, py - ay - k * dy) < 21;
    },
  };
}

function newWorld(W, H, rng) {
  const lv = Level.create({ y0: TOP + 34, y1: H - FLOOR_H - 23, top: TOP + 4, floor: H - FLOOR_H - 4, startX: W * .9, rng });
  return {
    px: W * .2, y0: TOP + 34, y1: H - FLOOR_H - 23, vmin: Level.VMIN, vmax: Level.VMAX,
    speedAt: Level.speedAt,
    step(dist) { while (lv.x < dist + W + 400) lv.next(); },
    get obs() { return lv.obs; },
    hit: (o, px, py, d) => Level.hit(o, px, py, d),
  };
}

function run(world) {
  const { y0, y1, vmin, vmax } = world;
  let states = new Map([[Math.round((y0 + y1) / 2) * 1000 + 0, [(y0 + y1) / 2, 0]]]);
  let dist = 0;
  while (dist / 20 < MAX_M) {
    const speed = world.speedAt(dist);
    world.step(dist, speed);
    dist += speed;
    const px = dist + world.px;
    const near = world.obs.filter(o => Math.abs(o.x - px) < o.len / 2 + 40);
    const dead = new Map();
    const next = new Map();
    for (const [y, vy] of states.values()) {
      for (const hold of [true, false]) {
        let v = Math.max(vmin, Math.min(vmax, vy + (hold ? -Level.THRUST : Level.G)));
        let ny = y + v;
        if (ny > y1) { ny = y1; v = 0; }
        if (ny < y0) { ny = y0; v = 0; }
        const yq = Math.round(ny / 2) * 2, vq = Math.round(v * 2) * 2;
        const key = yq * 1000 + vq + 500;
        if (next.has(key)) continue;
        let d = dead.get(yq);
        if (d === undefined) { d = near.some(o => world.hit(o, px, yq, dist)); dead.set(yq, d); }
        if (!d) next.set(key, [yq, vq / 4]);
      }
    }
    states = next;
    if (!states.size) { if (process.env.DEBUG) console.log(JSON.stringify(world.obs.filter(o => Math.abs(o.x - px) < 600).map(o => ({ dx: Math.round(o.x - px), y: Math.round(o.y), ang: +o.ang.toFixed(2), len: Math.round(o.len), spin: o.spin }))), 'lane', y0, y1); return Math.floor(dist / 20); }
  }
  return null;
}

// a phone in portrait: game area ~380x690 css px
for (const [name, make, W, H] of [['vecchio', oldWorld, 380, 690], ['nuovo', newWorld, 480, 690 * 480 / 380]].filter(r => !ONLY || r[0] === ONLY)) {
  const fails = [];
  for (let i = 0; i < RUNS; i++) {
    const m = run(make(W, H, mulberry(1000 + i)));
    if (m !== null) fails.push(m);
  }
  fails.sort((a, b) => a - b);
  console.log(`${name}: ${fails.length}/${RUNS} livelli con morte inevitabile entro ${MAX_M} m` +
    (fails.length ? ` (prima a ${fails[0]} m, mediana ${fails[fails.length >> 1]} m)` : ''));
}

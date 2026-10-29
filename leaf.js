// Cannabis leaf geometry shared by the DOM (SVG) and the game (canvas).
const Leaf = (() => {
  function leaflet(len, wid, teeth = 9) {
    const right = [], left = [];
    for (let i = 1; i <= teeth; i++) {
      const t = i / (teeth + 1), y = -len * t;
      const w = wid * Math.pow(Math.sin(Math.PI * t), 0.8) * (1 - t * 0.35);
      right.push(`L${(w).toFixed(1)} ${y.toFixed(1)}`, `L${(w * 0.78).toFixed(1)} ${(y - len / (teeth + 1) * 0.55).toFixed(1)}`);
      left.unshift(`L${(-w * 0.78).toFixed(1)} ${(y - len / (teeth + 1) * 0.55).toFixed(1)}`, `L${(-w).toFixed(1)} ${y.toFixed(1)}`);
    }
    return `M0 0 ${right.join(' ')} L0 ${-len} ${left.join(' ')} Z`;
  }
  const D = leaflet(75, 11);
  const PARTS = [[-100, .42], [-66, .66], [-33, .88], [0, 1], [33, .88], [66, .66], [100, .42]];

  const svg = (color = '#43a047') =>
    `<svg viewBox="-85 -85 170 110"><g fill="${color}">` +
    PARTS.map(([a, s]) => `<path d="${D}" transform="rotate(${a}) scale(${s})"/>`).join('') +
    `<rect x="-2" y="0" width="4" height="22" rx="2"/></g></svg>`;

  const path = new Path2D(D);
  function draw(ctx, x, y, size, rot, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size / 170, size / 170);
    ctx.fillStyle = color;
    for (const [a, s] of PARTS) {
      ctx.save(); ctx.rotate(a * Math.PI / 180); ctx.scale(s, s); ctx.fill(path); ctx.restore();
    }
    ctx.fillRect(-2, 0, 4, 22);
    ctx.restore();
  }
  // Pre-rendered sprite, much cheaper to blit every frame.
  function sprite(size, color) {
    const c = document.createElement('canvas');
    c.width = c.height = size * 2;
    draw(c.getContext('2d'), size, size * 1.15, size * 1.6, 0, color);
    return c;
  }
  return { svg, draw, sprite };
})();

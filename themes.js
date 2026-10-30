// Backgrounds for Jah-Pack Ride. The sky and the far layer are painted once into
// offscreen canvases; the game loop only blits them (plus cheap hills/floor).
const Themes = (() => {
  const TILE = 600;
  const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

  function grad(c, H, stops) {
    const g = c.createLinearGradient(0, 0, 0, H);
    stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
    return g;
  }
  function stars(c, W, H, n, maxY, seed) {
    const r = seeded(seed);
    for (let i = 0; i < n; i++) {
      c.globalAlpha = .3 + r() * .7; c.fillStyle = '#fff';
      c.beginPath(); c.arc(r() * W, r() * maxY, r() * 1.4 + .3, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }
  function moon(c, x, y, rad, col, glow) {
    const g = c.createRadialGradient(x, y, rad * .6, x, y, rad * 3);
    g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rad * 3, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill();
  }
  function palm(c, x, base, h, col) {
    c.strokeStyle = col; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + 30, base - h * .6, x + 12, base - h); c.stroke();
    c.fillStyle = col;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * .55, tx = x + 12, ty = base - h;
      c.beginPath(); c.moveTo(tx, ty);
      c.quadraticCurveTo(tx + Math.cos(a - .4) * 50, ty + Math.sin(a - .4) * 50 - 10, tx + Math.cos(a) * 75, ty + Math.sin(a) * 40 + 25);
      c.quadraticCurveTo(tx + Math.cos(a + .3) * 40, ty + Math.sin(a + .3) * 30, tx, ty); c.fill();
    }
  }
  function pine(c, x, base, h, snow) {
    for (let k = 0; k < 3; k++) {
      const w = h * (.42 - k * .1), y = base - h * k * .28;
      c.fillStyle = '#123524'; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h * .5); c.lineTo(x + w, y); c.fill();
      if (snow) { c.fillStyle = '#e8f1ff'; c.beginPath(); c.moveTo(x - w * .35, y - h * .33); c.lineTo(x, y - h * .5); c.lineTo(x + w * .35, y - h * .33); c.fill(); }
    }
    c.fillStyle = '#3e2723'; c.fillRect(x - 4, base, 8, 10);
  }
  function deadTree(c, x, base, h, col) {
    c.strokeStyle = col; c.lineCap = 'round';
    const br = (x0, y0, len, a, w) => {
      if (len < 8) return;
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
      c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      br(x1, y1, len * .68, a - .5, w * .65); br(x1, y1, len * .62, a + .45, w * .65);
    };
    br(x, base, h * .4, -Math.PI / 2, 8);
  }
  function grave(c, x, base, col) {
    c.fillStyle = col; c.beginPath(); c.roundRect(x - 14, base - 34, 28, 40, [14, 14, 2, 2]); c.fill();
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x - 6, base - 22, 12, 3); c.fillRect(x - 1.5, base - 28, 3, 14);
  }
  function pumpkin(c, x, y, r) {
    c.fillStyle = '#ff7a00';
    for (const dx of [-r * .45, r * .45, 0]) { c.beginPath(); c.ellipse(x + dx, y, r * .6, r * .8, 0, 0, 7); c.fill(); }
    c.fillStyle = '#ffeb3b';
    c.beginPath(); c.moveTo(x - r * .5, y - r * .2); c.lineTo(x - r * .2, y - r * .2); c.lineTo(x - r * .35, y - r * .45); c.fill();
    c.beginPath(); c.moveTo(x + r * .5, y - r * .2); c.lineTo(x + r * .2, y - r * .2); c.lineTo(x + r * .35, y - r * .45); c.fill();
    c.fillRect(x - r * .4, y + r * .15, r * .8, r * .15);
    c.fillStyle = '#33691e'; c.fillRect(x - 2, y - r * .95, 4, r * .3);
  }

  const T = {
    rasta: {
      name: 'Rasta', price: 0, ambient: 'leaves',
      hill: '#12301c', ceil: '#071209', stripes: ['#e53935', '#fdd835', '#43a047'], ground: '#2a1c10', dash: '#3a2816',
      sky(c, W, H) { c.fillStyle = grad(c, H, ['#0a1f12', '#173a22']); c.fillRect(0, 0, W, H); },
      far(c, H, fy) {
        const r = seeded(7);
        for (let i = 0; i < 4; i++) Leaf.draw(c, r() * TILE, fy - 40 - r() * (fy * .6), 120 + r() * 80, r() * 6, 'rgba(67,160,71,.08)');
      },
    },
    tropical: {
      name: 'Tropical', price: 250, ambient: 'birds',
      hill: '#d9a55b', ceil: '#5b2a4a', stripes: ['#00bcd4', '#ffeb3b', '#ff7043'], ground: '#e6c27a', dash: '#d4a95f',
      sky(c, W, H, fy) {
        c.fillStyle = grad(c, H, ['#4a2c6d', '#ff6f61', '#ffb36b', '#ffd98a']); c.fillRect(0, 0, W, H);
        moon(c, W * .65, fy * .52, 46, '#fff3b0', 'rgba(255,230,140,.55)');
        c.fillStyle = '#1c7fa0'; c.fillRect(0, fy * .68, W, H);
        c.fillStyle = 'rgba(255,255,255,.25)';
        const r = seeded(3);
        for (let i = 0; i < 40; i++) c.fillRect(r() * W, fy * .68 + 6 + r() * (fy * .32), 10 + r() * 30, 2);
        c.fillStyle = 'rgba(255,240,180,.35)'; c.fillRect(W * .65 - 30, fy * .68, 60, fy * .32);
      },
      far(c, H, fy) {
        const r = seeded(11);
        for (let i = 0; i < 3; i++) palm(c, 60 + i * 200 + r() * 60, fy - 20, 150 + r() * 90, '#3a1f3d');
      },
    },
    xmas: {
      name: 'Christmas', price: 300, ambient: 'snow', hillCap: true,
      hill: '#cfdcf0', ceil: '#06102a', stripes: ['#c62828', '#ffffff', '#2e7d32'], ground: '#f2f7ff', dash: '#d5e2f3',
      sky(c, W, H, fy) {
        c.fillStyle = grad(c, H, ['#050d24', '#13285a', '#2b4a86']); c.fillRect(0, 0, W, H);
        stars(c, W, H, 90, fy * .7, 5);
        moon(c, W * .78, fy * .18, 28, '#fdfbe8', 'rgba(255,255,230,.25)');
      },
      far(c, H, fy) {
        const r = seeded(13);
        for (let i = 0; i < 6; i++) {
          const x = 40 + i * 100 + r() * 40, h = 110 + r() * 80;
          pine(c, x, fy - 30, h, true);
          if (r() < .5) for (let k = 0; k < 6; k++) {
            c.fillStyle = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae'][k % 4];
            c.beginPath(); c.arc(x + (r() - .5) * h * .5, fy - 30 - r() * h * .55, 3, 0, 7); c.fill();
          }
        }
      },
    },
    halloween: {
      name: 'Halloween', price: 300, ambient: 'bats',
      hill: '#1d0d27', ceil: '#0a0410', stripes: ['#ff6f00', '#6a1b9a', '#ff6f00'], ground: '#1b1022', dash: '#2d1a38',
      sky(c, W, H, fy) {
        c.fillStyle = grad(c, H, ['#12051f', '#3b1048', '#a8326e', '#ff8a3d']); c.fillRect(0, 0, W, H);
        stars(c, W, H, 40, fy * .4, 9);
        moon(c, W * .7, fy * .3, 60, '#ffcc80', 'rgba(255,170,80,.35)');
      },
      far(c, H, fy) {
        const r = seeded(17);
        deadTree(c, 90 + r() * 40, fy - 10, 260 + r() * 60, '#140a1c');
        deadTree(c, 380 + r() * 60, fy - 10, 200 + r() * 60, '#140a1c');
        for (let i = 0; i < 4; i++) grave(c, 30 + i * 150 + r() * 50, fy - 18, '#2a1838');
        pumpkin(c, 230, fy - 30, 18); pumpkin(c, 520, fy - 26, 14);
      },
    },
    space: {
      name: 'Spazio', price: 400, ambient: 'comets', hillCraters: true,
      hill: '#3b3a4f', ceil: '#000000', stripes: ['#00e5ff', '#d500f9', '#00e5ff'], ground: '#263238', dash: '#37474f',
      sky(c, W, H, fy) {
        c.fillStyle = grad(c, H, ['#000', '#120a2e', '#2a0f4f']); c.fillRect(0, 0, W, H);
        const n = c.createRadialGradient(W * .3, fy * .4, 10, W * .3, fy * .4, W * .6);
        n.addColorStop(0, 'rgba(213,0,249,.25)'); n.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = n; c.fillRect(0, 0, W, H);
        stars(c, W, H, 160, fy, 21);
        moon(c, W * .75, fy * .25, 34, '#ffb74d', 'rgba(255,183,77,.2)');
        c.strokeStyle = 'rgba(255,224,178,.8)'; c.lineWidth = 4;
        c.beginPath(); c.ellipse(W * .75, fy * .25, 58, 12, -.3, 0, 7); c.stroke();
      },
      far(c, H, fy) {
        const r = seeded(23);
        for (let i = 0; i < 5; i++) {
          c.fillStyle = '#4a4458'; const x = r() * TILE, y = 60 + r() * fy * .6, s = 8 + r() * 18;
          c.beginPath(); c.ellipse(x, y, s, s * .8, r() * 3, 0, 7); c.fill();
        }
      },
    },
    city: {
      name: 'Night City', lvl: 5, ambient: 'rain',
      hill: '#140b26', ceil: '#05030c', stripes: ['#ff2fd6', '#2ff3ff', '#ff2fd6'], ground: '#24232b', dash: '#e8c84a',
      sky(c, W, H, fy) {
        c.fillStyle = grad(c, H, ['#07051a', '#1d0f3d', '#4a1c5c']); c.fillRect(0, 0, W, H);
        stars(c, W, H, 30, fy * .35, 31);
        moon(c, W * .25, fy * .2, 22, '#e1f5fe', 'rgba(150,220,255,.2)');
      },
      far(c, H, fy) {
        const r = seeded(37);
        let x = 0;
        while (x < TILE) {
          const w = 50 + r() * 50, h = 120 + r() * fy * .45;
          c.fillStyle = '#120a24'; c.fillRect(x, fy - h, w - 6, h);
          for (let wy = fy - h + 10; wy < fy - 12; wy += 14) for (let wx = x + 6; wx < x + w - 14; wx += 11)
            if (r() < .35) { c.fillStyle = r() < .2 ? '#ff9ff3' : '#ffe082'; c.fillRect(wx, wy, 5, 7); }
          if (r() < .3) { c.fillStyle = r() < .5 ? '#ff2fd6' : '#2ff3ff'; c.fillRect(x + 6, fy - h - 6, w - 18, 4); }
          x += w;
        }
      },
    },
    jungle: {
      name: 'Jungle', lvl: 8, ambient: 'fireflies',
      hill: '#0c3b1c', ceil: '#04170a', stripes: ['#2e7d32', '#8bc34a', '#2e7d32'], ground: '#3b2a1a', dash: '#4e3a22',
      sky(c, W, H, fy) {
        c.fillStyle = grad(c, H, ['#0b2e1f', '#1b5e3a', '#2f7d4f']); c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,200,.06)';
        for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(W * (.1 + i * .25), 0); c.lineTo(W * (.2 + i * .25), 0); c.lineTo(W * (.35 + i * .25), fy); c.lineTo(W * (.15 + i * .25), fy); c.fill(); }
      },
      far(c, H, fy) {
        const r = seeded(41);
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * 150 + r() * 40;
          c.fillStyle = '#123d22'; c.fillRect(x, 0, 18 + r() * 10, fy);
        }
        c.strokeStyle = '#1f6b33'; c.lineWidth = 3;
        for (let i = 0; i < 7; i++) {
          const x = r() * TILE, len = 60 + r() * fy * .4;
          c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 20, len / 2, x, len); c.stroke();
          c.fillStyle = '#2e8b44'; for (let k = 20; k < len; k += 26) { c.beginPath(); c.ellipse(x + 6, k, 7, 3.5, .6, 0, 7); c.fill(); }
        }
        for (let i = 0; i < 5; i++) Leaf.draw(c, r() * TILE, fy - 10 - r() * 40, 110 + r() * 60, (r() - .5) * .6, '#164d2a');
      },
    },
    trippy: {
      name: 'Trippy', lvl: 12, ambient: 'fireflies', fireflyHue: true,
      hill: '#5e1d7a', ceil: '#14002b', stripes: ['#ff1744', '#ffea00', '#00e676'], ground: '#3d1257', dash: '#ff4081',
      sky(c, W, H, fy) {
        const cx = W * .5, cy = fy * .55;
        for (let i = 14; i >= 0; i--) { c.fillStyle = `hsl(${i * 26 + 260},85%,${30 + i * 2}%)`; c.beginPath(); c.arc(cx, cy, i * W * .09 + 20, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H);
      },
      far(c, H, fy) {
        const r = seeded(43);
        for (let i = 0; i < 5; i++) {
          const x = 50 + i * 120 + r() * 30, h = 50 + r() * 70, w = 30 + r() * 30;
          c.fillStyle = '#f5e6c8'; c.fillRect(x - 6, fy - h, 12, h);
          c.fillStyle = r() < .5 ? '#e53935' : '#7c4dff'; c.beginPath(); c.ellipse(x, fy - h, w, w * .65, 0, Math.PI, 0); c.fill();
          c.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + (r() - .5) * w * 1.3, fy - h - r() * w * .5, 3 + r() * 3, 0, 7); c.fill(); }
        }
      },
    },
  };

  function hills(c, t, W, H, fy, off) {
    c.fillStyle = t.hill;
    c.beginPath(); c.moveTo(0, H);
    for (let x = -off; x < W + 240; x += 120) c.quadraticCurveTo(x + 60, fy - 90, x + 120, fy);
    c.lineTo(W, H); c.fill();
    if (t.hillCraters) {
      c.fillStyle = 'rgba(0,0,0,.25)';
      for (let x = -off; x < W + 240; x += 120) { c.beginPath(); c.ellipse(x + 60, fy - 30, 14, 5, 0, 0, 7); c.fill(); }
    }
  }
  function floor(c, t, W, H, top, fh, off) {
    c.fillStyle = t.ceil; c.fillRect(0, 0, W, top);
    const fy = H - fh;
    t.stripes.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, fy + i * 6, W, 6); });
    c.fillStyle = t.ground; c.fillRect(0, fy + 18, W, fh - 18);
    c.fillStyle = t.dash;
    for (let x = -(off % 60); x < W; x += 60) c.fillRect(x, fy + 26, 30, 6);
  }

  // offscreen layers at device resolution (k = device pixels per world unit)
  function bake(id, W, H, fy, k) {
    const t = T[id] || T.rasta;
    const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); const c = cv.getContext('2d'); c.scale(k, k); return [cv, c]; };
    const [sky, sc] = mk(W, H); t.sky(sc, W, H, fy);
    const [far, fc] = mk(TILE, H); t.far(fc, H, fy);
    return { t, sky, far };
  }

  return { T, TILE, bake, hills, floor };
})();

/* ==========================================================
   Syafiq portfolio – interactions & atmosphere effects
   No libraries. Everything respects "reduce motion" settings.
   ========================================================== */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = false; // animations always on (ignores the system "reduce motion" setting)
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------------------------------------------------------
     1. ATMOSPHERE ENGINE
     <canvas class="fx" data-fx="embers"> draws a living
     background. Modes are listed in MODES below.
     --------------------------------------------------------- */
  function hexToRgb(hex) {
    hex = (hex || '#FF7A45').trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  // Shared particle helper
  function particles(S, n, spawn, first) {
    if (!S.p) { S.p = []; for (var i = 0; i < n; i++) S.p.push(spawn(first)); }
    return S.p;
  }
  function repel(p, m, radius, force) {
    if (!m.on) return;
    var dx = p.x - m.x, dy = p.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < radius && d > 0.1) { var f = (1 - d / radius) * force; p.x += dx / d * f; p.y += dy / d * f; }
  }

  var MODES = {
    // Home: pixel grid that lights up around the cursor
    pixels: function (c, w, h, t, dt, m, S, A) {
      var cell = 26;
      for (var x = 0; x < w; x += cell) for (var y = 0; y < h; y += cell) {
        var seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; seed -= Math.floor(seed);
        var a = 0.05 + 0.05 * Math.sin(t * 0.0015 + seed * 40);
        if (m.on) { var dx = x - m.x, dy = y - m.y, d = Math.sqrt(dx * dx + dy * dy); a += Math.max(0, 1 - d / 170) * 0.75; }
        if (seed > 0.985) a += 0.35 * (0.5 + 0.5 * Math.sin(t * 0.004 + seed * 90));
        var s = 4 + Math.min(a, 1) * 8;
        c.fillStyle = rgba(a > 0.2 ? A : [236, 238, 242], Math.min(a, 0.9));
        c.fillRect(x + (cell - s) / 2, y + (cell - s) / 2, s, s);
      }
    },
    // Game category: arcade starfield scrolling down
    arcade: function (c, w, h, t, dt, m, S, A) {
      var ps = particles(S, 120, function (f) { var z = Math.ceil(Math.random() * 3); return { x: rand(0, w), y: f ? rand(0, h) : -10, z: z, col: Math.random() < 0.15 }; }, true);
      ps.forEach(function (p) {
        p.y += p.z * 0.9 * dt; repel(p, m, 90, 3);
        if (p.y > h + 10) { p.y = -10; p.x = rand(0, w); }
        c.fillStyle = p.col ? rgba(A, 0.8) : rgba([236, 238, 242], 0.15 * p.z);
        var s = p.z * 2; c.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      });
    },
    // Hellbound Heir: rising embers
    embers: function (c, w, h, t, dt, m, S, A) {
      var ps = particles(S, 110, function (f) { return { x: rand(0, w), y: f ? rand(0, h) : h + 10, vy: rand(0.4, 1.6), r: rand(1, 3.2), s: rand(0, 99) }; }, true);
      ps.forEach(function (p) {
        p.y -= p.vy * dt; p.x += Math.sin(t * 0.002 + p.s) * 0.5; repel(p, m, 100, 2.5);
        if (p.y < -10) { p.y = h + 10; p.x = rand(0, w); }
        var a = Math.max(0, p.y / h) * (0.6 + 0.4 * Math.sin(t * 0.01 + p.s));
        c.fillStyle = rgba(A, a * 0.18); c.beginPath(); c.arc(p.x, p.y, p.r * 4, 0, 6.283); c.fill();
        c.fillStyle = rgba([255, 200, 120], a); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      });
    },
    // AEKI: drifting fireflies
    fireflies: function (c, w, h, t, dt, m, S, A) {
      var ps = particles(S, 60, function () { return { x: rand(0, w), y: rand(0, h), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), s: rand(0, 99), r: rand(1.5, 3) }; });
      ps.forEach(function (p) {
        p.vx += rand(-0.03, 0.03); p.vy += rand(-0.03, 0.03); p.vx *= 0.98; p.vy *= 0.98;
        if (m.on) { p.vx += (m.x - p.x) * 0.00004; p.vy += (m.y - p.y) * 0.00004; }
        p.x = (p.x + p.vx * dt + w) % w; p.y = (p.y + p.vy * dt + h) % h;
        var a = 0.5 + 0.5 * Math.sin(t * 0.003 + p.s);
        c.fillStyle = rgba(A, a * 0.15); c.beginPath(); c.arc(p.x, p.y, p.r * 6, 0, 6.283); c.fill();
        c.fillStyle = rgba([240, 240, 255], a * 0.9); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      });
    },
    // Cedook: rising water bubbles
    bubbles: function (c, w, h, t, dt, m, S, A) {
      var ps = particles(S, 45, function (f) { return { x: rand(0, w), y: f ? rand(0, h) : h + 20, vy: rand(0.3, 1.1), r: rand(3, 16), s: rand(0, 99) }; }, true);
      c.lineWidth = 1.5;
      ps.forEach(function (p) {
        p.y -= p.vy * dt; p.x += Math.sin(t * 0.0015 + p.s) * 0.4; repel(p, m, 110, 3);
        if (p.y < -20) { p.y = h + 20; p.x = rand(0, w); }
        c.strokeStyle = rgba(A, 0.45); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.stroke();
        c.fillStyle = rgba([255, 255, 255], 0.35); c.beginPath(); c.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.2, 0, 6.283); c.fill();
      });
    },
    // Raya Rumble: festive string lights + glitter
    lights: function (c, w, h, t, dt, m, S, A) {
      var cols = [[255, 200, 61], [255, 90, 90], [61, 220, 151], [90, 176, 255]];
      [[0.12, 0.10], [0.30, 0.14]].forEach(function (row, ri) {
        var top = h * row[0], sag = h * row[1];
        c.strokeStyle = 'rgba(236,238,242,0.15)'; c.lineWidth = 1; c.beginPath();
        for (var x = 0; x <= w; x += 10) { var u = x / w, y = top + sag * 4 * u * (1 - u); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
        for (var i = 0, x2 = 20 + ri * 22; x2 < w; x2 += 44, i++) {
          var u2 = x2 / w, y2 = top + sag * 4 * u2 * (1 - u2) + 6, col = cols[(i + ri) % 4];
          var a = 0.55 + 0.45 * Math.sin(t * 0.004 + i * 1.7 + ri);
          c.fillStyle = rgba(col, a * 0.2); c.beginPath(); c.arc(x2, y2, 14, 0, 6.283); c.fill();
          c.fillStyle = rgba(col, a); c.beginPath(); c.arc(x2, y2, 4, 0, 6.283); c.fill();
        }
      });
      var ps = particles(S, 50, function (f) { return { x: rand(0, w), y: f ? rand(0, h) : -5, vy: rand(0.3, 0.9), c: cols[Math.floor(Math.random() * 4)], s: rand(0, 99) }; }, true);
      ps.forEach(function (p) {
        p.y += p.vy * dt; p.x += Math.sin(t * 0.002 + p.s) * 0.3; repel(p, m, 80, 2);
        if (p.y > h + 5) { p.y = -5; p.x = rand(0, w); }
        c.fillStyle = rgba(p.c, 0.5 + 0.5 * Math.sin(t * 0.01 + p.s)); c.fillRect(p.x, p.y, 3, 3);
      });
    },
    // Only Forward: speed lines rushing past
    speed: function (c, w, h, t, dt, m, S, A) {
      var ps = particles(S, 70, function (f) { return { x: f ? rand(0, w) : w + rand(0, 200), y: rand(0, h), v: rand(3, 16) }; }, true);
      ps.forEach(function (p) {
        p.x -= p.v * dt;
        if (p.x < -300) { p.x = w + rand(0, 200); p.y = rand(0, h); p.v = rand(3, 16); }
        c.strokeStyle = rgba(p.v > 12 ? A : [236, 238, 242], p.v / 40); c.lineWidth = p.v > 12 ? 2 : 1;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.v * 14, p.y); c.stroke();
      });
    },
    // Fragmented Alliance: drifting shards
    shards: function (c, w, h, t, dt, m, S, A) {
      var ps = particles(S, 28, function () { return { x: rand(0, w), y: rand(0, h), vx: rand(-0.3, 0.3), vy: rand(-0.2, 0.2), r: rand(0, 6.28), vr: rand(-0.01, 0.01), s: rand(10, 42) }; });
      ps.forEach(function (p) {
        p.x = (p.x + p.vx * dt + w + 60) % (w + 60) - 30; p.y = (p.y + p.vy * dt + h + 60) % (h + 60) - 30; p.r += p.vr * dt; repel(p, m, 140, 4);
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.beginPath();
        c.moveTo(0, -p.s); c.lineTo(p.s * 0.8, p.s * 0.6); c.lineTo(-p.s * 0.5, p.s * 0.4); c.closePath();
        c.fillStyle = rgba(A, 0.06); c.fill(); c.strokeStyle = rgba(A, 0.4); c.lineWidth = 1; c.stroke(); c.restore();
      });
    },
    // Duel Beats: audio visualiser pulsing at 120 BPM
    bars: function (c, w, h, t, dt, m, S, A) {
      var n = Math.floor(w / 16), beat = Math.exp(-((t % 500) / 140));
      for (var i = 0; i < n; i++) {
        var x = i * 16 + 4;
        var v = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.35 + t * 0.0025) * Math.cos(i * 0.13 - t * 0.0017));
        if (m.on) v += Math.max(0, 1 - Math.abs(x - m.x) / 120) * 0.6;
        var bh = v * (0.35 + 0.65 * beat) * h * 0.5;
        c.fillStyle = rgba(A, 0.55); c.fillRect(x, h - bh, 9, bh);
        c.fillStyle = rgba(A, 0.12); c.fillRect(x, 0, 9, bh * 0.35);
      }
      c.strokeStyle = rgba(A, 0.35 * beat); c.lineWidth = 2;
      c.beginPath(); c.arc(w * 0.8, h * 0.4, 60 + beat * 40, 0, 6.283); c.stroke();
    },
    // Cyberpunk 1997: synthwave grid + sun
    synthgrid: function (c, w, h, t, dt, m, S, A) {
      var y0 = h * 0.58, cx = w / 2 + (m.on ? (m.x - w / 2) * 0.05 : 0), r = Math.min(w, h) * 0.22;
      var g = c.createLinearGradient(0, y0 - r, 0, y0); g.addColorStop(0, 'rgba(255,200,80,0.8)'); g.addColorStop(1, rgba(A, 0.8));
      c.fillStyle = g; c.beginPath(); c.arc(cx, y0, r, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(15,17,21,1)';
      for (var k = 0; k < 6; k++) { var yy = y0 - r * 0.1 - k * r * 0.14; c.fillRect(cx - r, yy, r * 2, 2 + k * 1.2); }
      c.fillStyle = 'rgba(15,17,21,0.9)'; c.fillRect(0, y0, w, h - y0);
      c.strokeStyle = 'rgba(61,232,255,0.45)'; c.lineWidth = 1;
      for (var i = -24; i <= 24; i++) { c.beginPath(); c.moveTo(cx + i * 10, y0); c.lineTo(cx + i * w / 9, h); c.stroke(); }
      var off = (t * 0.0006) % 1;
      for (var j = 0; j < 16; j++) { var z = j + 1 - off; if (z <= 0) continue; var y = y0 + (h - y0) / (z * 0.6 + 0.4) * 0.4; if (y > h) continue; c.globalAlpha = Math.min(1, (y - y0) / (h - y0) * 2); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.globalAlpha = 1;
    },
    // App: Bluetooth beacon – rings pulse out and phones "check in" as a ring reaches them
    beacon: function (c, w, h, t, dt, m, S, A) {
      var bx = m.on ? m.x : w * 0.78, by = m.on ? m.y : h * 0.42, PERIOD = 1600;
      if (!S.p) {
        S.p = [];
        for (var i = 0; i < 16; i++) S.p.push({ x: rand(0.04, 0.96) * w, y: rand(0.08, 0.92) * h, hit: -1e9, s: rand(0, 99) });
      }
      // grid of faint dots
      c.fillStyle = 'rgba(236,238,242,0.05)';
      for (var gx = 0; gx < w; gx += 34) for (var gy = 0; gy < h; gy += 34) c.fillRect(gx, gy, 2, 2);
      // expanding rings
      var maxR = Math.hypot(w, h) * 0.75;
      for (var k = 0; k < 4; k++) {
        var age = ((t + k * PERIOD) % (PERIOD * 4)) / (PERIOD * 4), r = age * maxR;
        c.strokeStyle = rgba(A, 0.45 * (1 - age)); c.lineWidth = 2;
        c.beginPath(); c.arc(bx, by, r, 0, 6.283); c.stroke();
        S.p.forEach(function (p) { var d = Math.hypot(p.x - bx, p.y - by); if (Math.abs(d - r) < 6) p.hit = t; });
      }
      // beacon core
      var beat = Math.exp(-((t % PERIOD) / 300));
      c.fillStyle = rgba(A, 0.18 + 0.25 * beat); c.beginPath(); c.arc(bx, by, 26 + 10 * beat, 0, 6.283); c.fill();
      c.fillStyle = rgba(A, 0.95); c.beginPath(); c.arc(bx, by, 9, 0, 6.283); c.fill();
      // phones (little rounded rectangles) that light up when a ring passes
      S.p.forEach(function (p) {
        var since = t - p.hit, lit = Math.max(0, 1 - since / 1400);
        c.fillStyle = lit > 0 ? rgba(A, 0.15 + 0.45 * lit) : 'rgba(236,238,242,0.08)';
        c.beginPath(); c.roundRect ? c.roundRect(p.x - 7, p.y - 12, 14, 24, 4) : c.rect(p.x - 7, p.y - 12, 14, 24); c.fill();
        if (lit > 0.35) {   // check mark
          c.strokeStyle = 'rgba(255,255,255,' + (lit * 0.8) + ')'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(p.x - 4, p.y); c.lineTo(p.x - 1, p.y + 3); c.lineTo(p.x + 5, p.y - 4); c.stroke();
        }
      });
    },
    // 3D & Hardware: blueprint / CAD workspace
    blueprint: function (c, w, h, t, dt, m, S, A) {
      var B = [79, 168, 255];
      c.fillStyle = 'rgba(14,40,80,0.35)'; c.fillRect(0, 0, w, h);
      c.lineWidth = 1;
      for (var x = 0; x < w; x += 20) { c.strokeStyle = rgba(B, x % 100 ? 0.06 : 0.16); c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, h); c.stroke(); }
      for (var y = 0; y < h; y += 20) { c.strokeStyle = rgba(B, y % 100 ? 0.06 : 0.16); c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(w, y + 0.5); c.stroke(); }
      // Rotating wireframe part
      var cx = w * 0.78, cy = h * 0.48, s = Math.min(w, h) * 0.17;
      var ry = t * 0.0005 + (m.on ? (m.x / w - 0.5) : 0), rx = 0.5 + (m.on ? (m.y / h - 0.5) * 0.6 : 0);
      var V = [[-1, -0.6, -1], [1, -0.6, -1], [1, 0.6, -1], [-1, 0.6, -1], [-1, -0.6, 1], [1, -0.6, 1], [1, 0.6, 1], [-1, 0.6, 1]];
      var P = V.map(function (v) {
        var x1 = v[0] * Math.cos(ry) - v[2] * Math.sin(ry), z1 = v[0] * Math.sin(ry) + v[2] * Math.cos(ry);
        var y1 = v[1] * Math.cos(rx) - z1 * Math.sin(rx), z2 = v[1] * Math.sin(rx) + z1 * Math.cos(rx);
        var k = 3 / (z2 + 4); return [cx + x1 * s * k, cy + y1 * s * k];
      });
      c.strokeStyle = rgba(B, 0.7); c.lineWidth = 1.4;
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { c.beginPath(); c.moveTo(P[e[0]][0], P[e[0]][1]); c.lineTo(P[e[1]][0], P[e[1]][1]); c.stroke(); });
      // Dimension line
      var dy = cy + s * 1.25; c.strokeStyle = rgba(B, 0.5); c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - s, dy); c.lineTo(cx + s, dy); c.moveTo(cx - s, dy - 6); c.lineTo(cx - s, dy + 6); c.moveTo(cx + s, dy - 6); c.lineTo(cx + s, dy + 6); c.stroke();
      c.fillStyle = rgba(B, 0.8); c.font = '12px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.fillText('120.00 mm', cx, dy - 8);
      // Crosshair + coordinates
      if (m.on) {
        c.strokeStyle = rgba(B, 0.35); c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(m.x, 0); c.lineTo(m.x, h); c.moveTo(0, m.y); c.lineTo(w, m.y); c.stroke(); c.setLineDash([]);
        c.textAlign = 'left'; c.fillText('X ' + Math.round(m.x) + '  Y ' + Math.round(m.y), m.x + 10, m.y - 10);
      }
    },
    // Learning: chalkboard with floating letters & symbols
    chalk: function (c, w, h, t, dt, m, S, A, opts) {
      var set = (opts.glyphs || 'A B C 1 2 3 + − × ÷ = π ∑ { } < / > ? x² √').split(' ');
      c.fillStyle = 'rgba(24,60,44,0.32)'; c.fillRect(0, 0, w, h);
      var ps = particles(S, 34, function (f) { return { x: rand(0, w), y: f ? rand(0, h) : h + 40, vy: rand(0.15, 0.5), g: set[Math.floor(Math.random() * set.length)], s: rand(18, 46), r: rand(-0.4, 0.4), k: rand(0, 99) }; }, true);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      ps.forEach(function (p) {
        p.y -= p.vy * dt; if (p.y < -50) { p.y = h + 40; p.x = rand(0, w); }
        var a = 0.14 + 0.06 * Math.sin(t * 0.002 + p.k);
        if (m.on) { var d = Math.hypot(p.x - m.x, p.y - m.y); a += Math.max(0, 1 - d / 160) * 0.6; }
        c.save(); c.translate(p.x, p.y); c.rotate(p.r + Math.sin(t * 0.001 + p.k) * 0.08);
        c.font = '600 ' + p.s + 'px Georgia, "Times New Roman", serif';
        c.fillStyle = 'rgba(232,240,232,' + (a * 0.5) + ')'; c.fillText(p.g, 1, 1);
        c.fillStyle = a > 0.3 ? rgba(A, Math.min(a, 0.9)) : 'rgba(232,240,232,' + a + ')'; c.fillText(p.g, 0, 0);
        c.restore();
      });
    },
    // Video: film projector – grain, flicker, scratches, letterbox
    film: function (c, w, h, t, dt, m, S, A) {
      if (!S.n) { S.n = document.createElement('canvas'); S.n.width = 160; S.n.height = 90; S.nc = S.n.getContext('2d'); S.f = 0; }
      if ((S.f++ & 1) === 0) {
        var id = S.nc.createImageData(160, 90), d = id.data;
        for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 40; }
        S.nc.putImageData(id, 0, 0);
      }
      c.imageSmoothingEnabled = false; c.globalAlpha = 0.16; c.drawImage(S.n, 0, 0, w, h); c.globalAlpha = 1;
      var cx = m.on ? m.x : w * 0.5, cy = m.on ? m.y : h * 0.4;
      var g = c.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.6);
      g.addColorStop(0, rgba(A, 0.10 + Math.random() * 0.03)); g.addColorStop(1, 'rgba(0,0,0,0.45)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (Math.random() < 0.06) S.sc = { x: rand(0, w), life: 6 };
      if (S.sc && S.sc.life-- > 0) { c.strokeStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(S.sc.x, 0); c.lineTo(S.sc.x + rand(-3, 3), h); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.25)';
      for (var k = 0; k < 4; k++) if (Math.random() < 0.3) c.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 3));
      var bar = h * 0.045; c.fillStyle = '#000'; c.fillRect(0, 0, w, bar); c.fillRect(0, h - bar, w, bar);
    }
  };

  function mountFX(canvas) {
    var ctx = canvas.getContext('2d');
    var S = {}, m = { x: 0, y: 0, on: false }, visible = true, last = 0, w = 0, h = 0, raf = 0;
    var api = { mode: canvas.getAttribute('data-fx'), opts: { glyphs: canvas.getAttribute('data-glyphs') } };
    function accent() { return hexToRgb(getComputedStyle(canvas).getPropertyValue('--accent')); }
    var A = accent();
    function size() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); S = {};
    }
    function frame(t) {
      var dt = last ? Math.min((t - last) / 16.7, 3) : 1; last = t;
      ctx.clearRect(0, 0, w, h);
      var fn = MODES[api.mode]; if (fn) fn(ctx, w, h, t, dt, m, S, A, api.opts);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame); else raf = 0;
    }
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    size();
    if (reduce) { for (var i = 0; i < 60; i++) { ctx.clearRect(0, 0, w, h); MODES[api.mode] && MODES[api.mode](ctx, w, h, 1000 + i * 16, 1, m, S, A, api.opts); } }
    else start();
    window.addEventListener('resize', function () { size(); if (reduce) frame(1000); });
    var host = canvas.parentElement;
    var target = canvas.classList.contains('page-fx') ? window : host;
    target.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; m.on = e.pointerType === 'mouse';
    });
    (target === window ? document : host).addEventListener('pointerleave', function () { m.on = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !reduce) start(); }).observe(canvas);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduce) start(); });
    api.set = function (mode, accentHex) {
      canvas.style.opacity = 0;
      setTimeout(function () {
        api.mode = mode; S = {}; if (accentHex) A = hexToRgb(accentHex); else A = accent();
        if (reduce) frame(1000); else start();
        canvas.style.opacity = '';
      }, 260);
    };
    canvas._fx = api;
    return api;
  }
  $$('canvas.fx').forEach(mountFX);

  /* ---------------------------------------------------------
     2. HERO TYPING HEADLINE
     --------------------------------------------------------- */
  $$('[data-words]').forEach(function (el) {
    if (reduce) return;
    var words = el.getAttribute('data-words').split('|'), wi = 0, ci = words[0].length, del = true;
    function tick() {
      var word = words[wi];
      if (del) { ci--; el.textContent = word.slice(0, ci); if (ci === 0) { del = false; wi = (wi + 1) % words.length; } setTimeout(tick, 45); }
      else { ci++; el.textContent = words[wi].slice(0, ci); if (ci === words[wi].length) { del = true; setTimeout(tick, 1900); } else setTimeout(tick, 85); }
    }
    setTimeout(tick, 2200);
  });

  /* ---------------------------------------------------------
     3. SCROLL REVEAL + COUNT-UP STATS
     --------------------------------------------------------- */
  var revealSel = '.reveal, .card, .stat, .timeline > li, .h-section, .fact, .keynum, .gallery button, .panel, .prose > div, .video';
  var toReveal = $$(revealSel);
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-decimals') || 0), suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = end.toFixed(dec) + suf; return; }
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min((now - t0) / 1300, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (end * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ('IntersectionObserver' in window && !reduce) {
    toReveal.forEach(function (el) {
      el.classList.add('reveal');
      var sib = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--d', (sib % 6) * 70 + 'ms');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    toReveal.forEach(function (el) { io.observe(el); });
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } });
    });
    $$('[data-count]').forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); co.observe(el); });
  }

  /* ---------------------------------------------------------
     4. CARD TILT + CURSOR SPOTLIGHT
     --------------------------------------------------------- */
  if (finePointer && !reduce) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
        card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 7) + 'deg) rotateY(' + ((x - 0.5) * 9) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     5. PROJECT FILTER – shuffles cards and changes the
        page atmosphere to match the category
     --------------------------------------------------------- */
  $$('[data-filter-group]').forEach(function (group) {
    var buttons = $$('[data-filter]', group), cards = $$('[data-cat]'), page = $('canvas.page-fx');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        function apply() {
          buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
          cards.forEach(function (c) { c.hidden = !(f === 'all' || c.getAttribute('data-cat') === f); if (!c.hidden) c.classList.add('in'); });
          doc.style.setProperty('--accent', btn.getAttribute('data-accent'));
          doc.setAttribute('data-env', f);
        }
        if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
        if (page && page._fx) page._fx.set(btn.getAttribute('data-fx'), btn.getAttribute('data-accent'));
      });
    });
  });

  /* ---------------------------------------------------------
     6. TABS (experience page)
     --------------------------------------------------------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function show(tab) {
      tabs.forEach(function (t) {
        var on = t === tab; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls')); p.hidden = !on;
        if (on) $$('.reveal', p).forEach(function (el) { el.classList.add('in'); });
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (document.startViewTransition && !reduce) document.startViewTransition(function () { show(t); }); else show(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; next.focus(); show(next);
      });
    });
    list.hidden = false; show(tabs[0]);
  });

  /* ---------------------------------------------------------
     7. GALLERY LIGHTBOX – arrows, keyboard, swipe
     --------------------------------------------------------- */
  var box = $('.lightbox');
  if (box) {
    var shots = $$('.gallery img'), cur = 0, boxImg = $('img', box), counter = $('.lightbox-count', box);
    function open(i) {
      cur = (i + shots.length) % shots.length;
      boxImg.src = shots[cur].src; boxImg.alt = shots[cur].alt; counter.textContent = (cur + 1) + ' / ' + shots.length;
      boxImg.classList.remove('swap'); void boxImg.offsetWidth; boxImg.classList.add('swap');
      if (!box.open) box.showModal();
    }
    $$('.gallery button').forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    $('.lightbox-close', box).addEventListener('click', function () { box.close(); });
    $('.lightbox-prev', box).addEventListener('click', function () { open(cur - 1); });
    $('.lightbox-next', box).addEventListener('click', function () { open(cur + 1); });
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') open(cur - 1); if (e.key === 'ArrowRight') open(cur + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    var sx = null;
    box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) open(cur + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------------------------------------------------------
     8. MOBILE MENU, PROGRESS BAR, BACK TO TOP
     --------------------------------------------------------- */
  var menuBtn = $('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.site-nav').classList.toggle('open', open);
  });
  var bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var top = document.createElement('button'); top.className = 'to-top'; top.type = 'button'; top.setAttribute('aria-label', 'Back to top'); top.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(top);
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    top.classList.toggle('show', scrollY > 700);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------------------------------------------------------
     9. EASTER EGG – ↑ ↑ ↓ ↓ ← → ← → B A
     --------------------------------------------------------- */
  var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.classList.add('bye'); }, 2600); setTimeout(function () { t.remove(); }, 3200);
  }
  function burst() {
    if (reduce) return;
    var cv = document.createElement('canvas'), c = cv.getContext('2d'); cv.className = 'burst'; document.body.appendChild(cv);
    cv.width = innerWidth; cv.height = innerHeight;
    var cols = ['#FF7A45', '#FFC83D', '#3DDC97', '#5AB0FF', '#FF5CA8'], ps = [];
    for (var i = 0; i < 160; i++) ps.push({ x: innerWidth / 2, y: innerHeight / 2, vx: rand(-9, 9), vy: rand(-13, 2), c: cols[i % 5], s: rand(4, 9) });
    var n = 0;
    (function f() {
      c.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(function (p) { p.vy += 0.35; p.x += p.vx; p.y += p.vy; c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
      if (++n < 110) requestAnimationFrame(f); else cv.remove();
    })();
  }
  addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) {
      pos = 0;
      if (!$('#retro-font')) { var l = document.createElement('link'); l.id = 'retro-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'; document.head.appendChild(l); }
      var on = doc.classList.toggle('retro');
      burst();
      toast(on ? 'CHEAT ACTIVATED: 8-BIT MODE  ·  +1UP' : '8-BIT MODE OFF  ·  THANKS FOR PLAYING');
    }
  });

  /* Footer year */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* БГИТУ — фон кабинета: звёздная пыль и линии-«нити», как на основном сайте.
   Цвета берутся из токенов темы (--brand-accent/--brand-aux/--brand-ink) и
   обновляются по событию bgitu:palette. Цикл на setTimeout (~30 кадров/с) —
   работает и там, где requestAnimationFrame заморожен (фоновые вкладки). */
(function () {
  'use strict';

  var cv = document.querySelector('.bg-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0;
  var ACC = '255,90,46', AUX = '255,154,60', INK = '242,242,242';

  function hex(v) {
    v = v.trim();
    if (v[0] === '#') {
      v = v.slice(1);
      if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
      return parseInt(v.slice(0, 2), 16) + ',' + parseInt(v.slice(2, 4), 16) + ',' + parseInt(v.slice(4, 6), 16);
    }
    return ACC;
  }

  function palette() {
    var cs = getComputedStyle(document.documentElement);
    try {
      ACC = hex(cs.getPropertyValue('--brand-accent'));
      AUX = hex(cs.getPropertyValue('--brand-aux'));
      INK = hex(cs.getPropertyValue('--brand-ink'));
    } catch (e) {}
  }

  var rgba = function (v, a) { return 'rgba(' + v + ',' + a + ')'; };

  var PARTS = [];
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    PARTS = [];
  }

  function seedParts() {
    var n = Math.min(80, Math.max(24, Math.round(W * H / 24000)));
    PARTS = [];
    for (var i = 0; i < n; i++) {
      var z = 0.25 + Math.random() * 0.75;
      var c = Math.random();
      PARTS.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: z,
        r: 0.5 + z * 1.3,
        a: 0.08 + 0.3 * z,
        vx: (Math.random() - 0.5) * 0.06,
        vy: -(0.03 + Math.random() * 0.14) * z,
        ph: Math.random() * 6.28,
        col: c < 0.1 ? 'acc' : (c < 0.24 ? 'aux' : 'ink'),
        glow: c < 0.16,
      });
    }
  }

  var scrollY = 0;
  addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });

  // Линии-следы как на основном сайте: идут через всю страницу и врезаются
  // в надпись «БГИТУ» в футере (каждая — в свою часть слова).
  var ANCHOR_FRACTIONS = [0.22, 0.5, 0.78];
  var TRAIL_COLORS = function (l) { return l === 0 ? ACC : (l === 1 ? AUX : INK); };

  function trailAnchor(l) {
    var fw = document.querySelector('.footer__word');
    if (fw) {
      var wr = fw.getBoundingClientRect();
      var wTop = wr.top + scrollY;
      return {
        x: wr.left + wr.width * ANCHOR_FRACTIONS[l],
        y: wTop + wr.height * 0.55,
        wordTop: wTop,
      };
    }
    var endY = Math.max(document.documentElement.scrollHeight, H) - 80;
    return { x: W * 0.5, y: endY, wordTop: endY };
  }

  function drawTrails() {
    for (var l = 0; l < 3; l++) {
      var anchor = trailAnchor(l);
      var seed = l * 2.7 + 1.3;
      var amp = W * (0.30 - 0.08 * l);
      var startY = 150; // страничные координаты, под шапкой
      var endY = anchor.y;
      var span = Math.max(1, endY - startY);
      ctx.beginPath();
      var began = false;
      for (var y = startY; y <= endY; y += 8) {
        var t = (y - startY) / span;
        var x = W * 0.5
          + Math.sin(y * 0.0011 + seed) * amp
          + Math.sin(y * 0.0042 + seed * 5.1) * 42;
        // финальный участок: линия врезается в свою точку надписи
        if (endY - y < 380) {
          var u = 1 - (endY - y) / 380;
          u = u * u * (3 - 2 * u); // smoothstep
          x = x + (anchor.x - x) * u;
        }
        var vy = y - scrollY;
        if (vy > -60 && vy < H + 60) {
          if (!began) { ctx.moveTo(x, vy); began = true; }
          else ctx.lineTo(x, vy);
        }
      }
      if (!began) continue;
      var grad = ctx.createLinearGradient(0, startY - scrollY, 0, endY - scrollY);
      var c = TRAIL_COLORS(l);
      grad.addColorStop(0, rgba(c, 0));
      grad.addColorStop(0.10, rgba(c, 0.07));
      grad.addColorStop(0.55, rgba(c, 0.06));
      grad.addColorStop(0.85, rgba(c, 0.16));
      grad.addColorStop(0.96, rgba(c, 0.34));
      grad.addColorStop(1, rgba(c, 0.5)); // вспышка у надписи
      ctx.strokeStyle = grad;
      ctx.lineWidth = l === 0 ? 1.4 : 1;
      ctx.stroke();
    }
  }

  // Насколько футер вошёл в кадр: 0..1 — подпитка свечения надписи.
  var footerBoost = 0;
  function measureFooterBoost() {
    var fw = document.querySelector('.footer__word');
    if (!fw) { footerBoost = 0; return; }
    var top = fw.getBoundingClientRect().top;
    footerBoost = 1 - Math.min(1, Math.max(0, (top - H * 0.75) / (H * 0.5)));
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    drawTrails();
    measureFooterBoost();
    if (!PARTS.length) seedParts();
    var span = H + 40;
    for (var i = 0; i < PARTS.length; i++) {
      var p = PARTS[i];
      var tt = reduce ? 0 : t;
      var px = p.x + p.vx * 60 * tt + Math.sin(tt * 0.3 + p.ph) * 3.2;
      var py = p.y + p.vy * 60 * tt;
      var x = ((px % (W + 20)) + W + 20) % (W + 20) - 10;
      var y = (((py - scrollY * 0.25 * p.z) % span) + span) % span - 20;
      var a = p.a * (0.65 + 0.35 * Math.sin(t * 0.7 + p.ph));
      var col = p.col === 'acc' ? ACC : (p.col === 'aux' ? AUX : INK);
      if (p.glow) {
        ctx.fillStyle = rgba(col, a * 0.18);
        ctx.beginPath();
        ctx.arc(x, y, p.r * 4, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = rgba(col, a);
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, 7);
      ctx.fill();
    }
  }

  // Футер «БГИТУ» теперь подсвечивает фон-«след» (static/js/trail.js):
  // он сам ставит --x0..2/--y0..2 по точкам входа линий и --f0..2, когда линии доходят.

  var t0 = performance.now();
  var timer = 0;
  function loop() {
    frame((performance.now() - t0) / 1000);
    timer = setTimeout(loop, 33);
  }

  palette();
  resize();
  addEventListener('resize', resize);
  document.addEventListener('bgitu:palette', function () { palette(); });
  if (reduce) {
    frame(0);
  } else {
    loop();
  }
})();

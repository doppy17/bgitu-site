/* БГИТУ — лендинг. Чистый JS без зависимостей. Порядок: утилиты → шапка → появление →
   институты → поиск → фон-«шёлк». Каждый блок независим: сломается один — остальные живут. */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toast = (() => {
    const el = $('#toast'); let t;
    return (msg) => { el.textContent = msg; el.classList.add('is-on'); clearTimeout(t); t = setTimeout(() => el.classList.remove('is-on'), 2600); };
  })();

  // Страницы, которых ещё нет в макете, не должны вести в 404
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-soon]')) return;
    e.preventDefault();
    toast('Эта страница появится на следующем этапе');
  });

  $('#year').textContent = new Date().getFullYear();
  $$('[data-since]').forEach((el) => { el.textContent = new Date().getFullYear() - el.dataset.since; });

  /* ---------- Появление, счётчики, «скремблер» ---------- */
  const countUp = (el) => {
    const to = el.dataset.since ? new Date().getFullYear() - el.dataset.since : +el.dataset.count;
    if (reduce || 'plain' in el.dataset) return (el.textContent = to);
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(to * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  };
  const scramble = (el) => {
    if (reduce || el.dataset.scrambled) return;
    el.dataset.scrambled = '1';
    const text = el.textContent, abc = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789', t0 = performance.now();
    const nodes = text.split(/(\s+)/).filter(Boolean).map((part) => {
      if (/^\s+$/.test(part)) return document.createTextNode(part);
      const b = document.createElement('span'); b.textContent = part; b.style.cssText = 'display:inline-block;white-space:nowrap;overflow:clip;overflow-clip-margin:0.12em'; return b; });
    el.textContent = ''; el.append(...nodes);
    const boxes = nodes.filter((n) => n.nodeType === 1);
    boxes.map((b) => b.offsetWidth).forEach((w, i) => { boxes[i].style.width = w + 'px'; });
    let at = 0; const words = boxes.map((b) => { const w = { b, s: b.textContent, at }; at += w.s.length; return w; });
    (function tick(t) {
      const p = Math.min((t - t0) / 900, 1), n = p * at;
      words.forEach((w) => { w.b.textContent = [...w.s].map((c, i) => (w.at + i < n ? c : abc[(Math.random() * abc.length) | 0])).join(''); });
      if (p < 1) requestAnimationFrame(tick); else el.textContent = text;
    })(t0);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.classList.add('is-in');
    $$('[data-count], [data-since]', e.target).concat(e.target.matches('[data-count], [data-since]') ? [e.target] : []).forEach(countUp);
    $$('[data-scramble]', e.target).concat(e.target.matches('[data-scramble]') ? [e.target] : []).forEach(scramble);
  }), { threshold: 0.15 });
  $$('[data-reveal], [data-scramble]').forEach((el) => io.observe(el));

  /* ---------- Институты: плашки-аккордеон ---------- */
  const insts = $$('.inst');
  const setOpen = (li, open) => {
    li.classList.toggle('is-open', open);
    $('.inst__row', li).setAttribute('aria-expanded', open);
  };
  insts.forEach((li) => $('.inst__row', li).addEventListener('click', () => {
    const open = !li.classList.contains('is-open');
    insts.forEach((x) => setOpen(x, false));
    setOpen(li, open);
  }));

  // Переход к любому блоку по id; если это институт — раскрываем его
  const reveal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains('inst')) insts.forEach((x) => setOpen(x, x === el));
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  };
  if (/^#inst-\d/.test(location.hash)) setTimeout(() => reveal(location.hash.slice(1)), 300);

  /* ---------- Фон «шёлк»: линии со светящимся наложением ---------- */
  // Цвета берутся из CSS (color = акцент, border-color = второй оттенок), поэтому
  // смена палитры в tokens.css перекрашивает и канвас. Режим наложения — токен --aurora-blend.
  const aurora = (canvas) => {
    const ctx = canvas.getContext('2d'), seed = +canvas.dataset.seed || 0, N = 56;
    let w, h, dpr, grad, aux, blend, raf = 0, frame = 0, visible = true;

    const palette = () => {
      const cs = getComputedStyle(canvas);
      blend = getComputedStyle(document.documentElement).getPropertyValue('--aurora-blend').trim() || 'lighter';
      aux = cs.borderTopColor;
      grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, aux); grad.addColorStop(0.5, cs.color); grad.addColorStop(1, cs.color);
    };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      palette();
    };
    const draw = (t) => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = blend;
      const step = Math.max(8, w / 120), small = w < 700;
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1) - 0.5, core = 1 - Math.abs(k) * 2;
        ctx.strokeStyle = i % 6 === 0 ? aux : grad;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += step) {
          const u = x / w;
          const twist = 0.15 + 0.85 * Math.abs(Math.sin(u * 2.8 + t * 0.2 + seed));
          const y = h * (0.8 - 0.42 * u + 0.12 * Math.sin(u * 3 + t * 0.25 + seed))
                  + Math.sin(u * 5.4 - t * 0.5 + k * 2.6 + seed) * h * 0.05
                  + k * h * 0.8 * twist * (0.12 + 0.88 * u);
          x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        if (!small && core > 0.45) { ctx.globalAlpha = 0.05 * core; ctx.lineWidth = 7; ctx.stroke(); } // мягкое свечение
        ctx.globalAlpha = 0.1 + 0.4 * core * core;
        ctx.lineWidth = 0.9 + core * 1.1;
        ctx.stroke();
      }
    };
    const loop = (ms) => {
      if (!visible || document.hidden) return (raf = 0);
      draw(ms / 1000);
      if (++frame % 120 === 0) palette();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };

    new ResizeObserver(() => { resize(); reduce && draw(seed + 3); }).observe(canvas);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);
    resize(); reduce ? draw(seed + 3) : start();
  };
})();

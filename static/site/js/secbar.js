/* Липкая плашка раздела. Плашка — клон настоящего заголовка, поэтому совпадает с ним пиксель в пиксель:
   заголовок доезжает до места плашки → подмена без анимации и затуханий. Следующий заголовок, подъезжая
   снизу, выталкивает плашку вверх и сам встаёт на её место. Между разделами плашка не пропадает. */
(() => {
  const bar = document.querySelector('.secbar'), slot = bar && bar.querySelector('.secbar__slot');
  const heads = [...document.querySelectorAll('main .sec-head')];
  if (!bar || !heads.length || document.documentElement.classList.contains('shot')) return;
  let cur = -1, clone = null, raf = 0;
  const place = (k) => {
    if (k === cur) return;
    cur = k; clone = heads[k].cloneNode(true);
    clone.removeAttribute('data-reveal'); clone.style.cssText = '';
    clone.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    slot.replaceChildren(clone);
  };
  const update = () => {
    raf = 0;
    const pin = parseFloat(getComputedStyle(bar).paddingTop);
    const tops = heads.map((h) => h.getBoundingClientRect().top);
    let k = -1; tops.forEach((t, i) => { if (t <= pin + 1) k = i; });
    heads.forEach((h, i) => { h.style.visibility = i === k && tops[i] < pin - 0.5 ? 'hidden' : ''; });
    if (k < 0) { bar.hidden = true; cur = -1; return; }
    place(k); bar.hidden = false;
    const hgt = clone.offsetHeight;
    const pusher = k + 1 < heads.length ? tops[k + 1] : heads[k].closest('section').getBoundingClientRect().bottom;
    const off = Math.min(0, pusher - (pin + hgt));
    bar.style.transform = off ? `translateY(${off}px)` : '';
    if (off <= -(pin + hgt)) bar.hidden = true;
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { cur = -1; req(); });
  update();
})();

/* Тема: «Бумага» по умолчанию, «Сурик» и «Латунь» — тёмные. Выбор хранится в браузере. */
(() => {
  const root = document.documentElement, pop = document.getElementById('theme-pop');
  const sync = () => document.querySelectorAll('[data-theme-set]').forEach((b) => b.setAttribute('aria-checked', b.dataset.themeSet === (root.dataset.theme || 'paper')));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-theme-set]'); if (!b) return;
    root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 500);
    root.dataset.theme = b.dataset.themeSet;
    try { localStorage.setItem('bgitu-theme', b.dataset.themeSet); } catch (err) {}
    sync(); dispatchEvent(new Event('bgitu:palette'));
    if (pop && pop.matches(':popover-open')) setTimeout(() => pop.hidePopover(), 180);
  });
  // стрелки внутри группы тем
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('[data-theme-set]'); if (!b || !/Arrow(Up|Down)/.test(e.key)) return;
    const all = [...b.parentElement.querySelectorAll('[data-theme-set]')], i = all.indexOf(b);
    all[(i + (e.key === 'ArrowDown' ? 1 : all.length - 1)) % all.length].focus(); e.preventDefault();
  });
  sync();
})();

/* Фильтры направлений и новостей: группы чипов (data-g: k — институт/тип, l — уровень) + поиск по строке */
document.querySelectorAll('[data-filter]').forEach((box) => {
  const list = document.querySelector(box.dataset.filter), q = box.querySelector('input'), empty = list.parentElement.querySelector('.dirs__empty');
  const state = {};
  box.querySelectorAll('.chips').forEach((g) => { state[g.dataset.g || 'k'] = 'all'; });
  const apply = () => {
    const words = (q ? q.value : '').toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean);
    let shown = 0;
    list.querySelectorAll(':scope > li').forEach((li) => {
      const hay = li.textContent.toLowerCase().replace(/ё/g, 'е');
      const ok = Object.entries(state).every(([g, v]) => v === 'all' || li.dataset[g] === v) && words.every((w) => hay.includes(w));
      li.hidden = !ok; if (ok) { shown++; li.classList.add('is-in'); }
    });
    if (empty) empty.hidden = shown > 0;
  };
  box.querySelectorAll('.chips').forEach((g) => g.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state[g.dataset.g || 'k'] = b.dataset.k; g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); apply();
  })));
  q && q.addEventListener('input', apply);
});

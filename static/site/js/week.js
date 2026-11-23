Индикатор учебной недели: считается от опорного понедельника, неделя на bgitu.ru 19.10.2026 — «вторая» */
(() => {
  const anchor = Date.UTC(2026, 9, 19), d = new Date(), today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (d.getDay() + 6) % 7, monday = today - wd * 864e5, weeks = Math.round((monday - anchor) / (7 * 864e5));
  const kind = ((weeks % 2) + 2) % 2 === 0 ? 'вторая' : 'первая';
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }), day = d.toLocaleDateString('ru-RU', { weekday: 'long' });
  window.BGITU_WEEK = kind;
  document.querySelectorAll('[data-week]').forEach((el) => { el.innerHTML = `<i aria-hidden="true"></i>${date}, ${day} · ${kind} неделя`; });
})();

/*

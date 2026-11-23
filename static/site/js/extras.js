/* Версия для слабовидящих: настройки хранятся в браузере */
(() => {
  const root = document.documentElement;
  let st = {}; try { st = JSON.parse(localStorage.getItem('bgitu-a11y') || '{}'); } catch (e) {}
  const apply = () => {
    root.classList.toggle('a11y-fs1', st.fs === '1'); root.classList.toggle('a11y-fs2', st.fs === '2');
    root.classList.toggle('a11y-sp', st.sp === '1'); root.classList.toggle('a11y-gray', st.cl === 'gray');
    root.classList.toggle('a11y-hc', st.cl === 'hc'); root.classList.toggle('a11y-im', st.im === '1');
    document.querySelectorAll('[data-a11y]').forEach((b) => b.setAttribute('aria-pressed', (st[b.dataset.a11y] || '0') === b.dataset.v));
    try { localStorage.setItem('bgitu-a11y', JSON.stringify(st)); } catch (e) {}
    dispatchEvent(new Event('bgitu:palette'));
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a11y]'); if (b) { st[b.dataset.a11y] = b.dataset.v; apply(); }
    if (e.target.closest('[data-a11y-reset]')) { st = {}; apply(); }
  });
  apply();
})();

/*

Cookies / ПДн: только технические, без трекеров в макете */
(() => {
  const bar = document.querySelector('.cookie'); if (!bar || document.documentElement.classList.contains('shot')) return;
  let ok = false; try { ok = localStorage.getItem('bgitu-cookie') === '1'; } catch (e) {}
  if (!ok) bar.hidden = false;
  bar.querySelector('button').addEventListener('click', () => { bar.hidden = true; try { localStorage.setItem('bgitu-cookie', '1'); } catch (e) {} });
})();

/*

PWA: сайт ставится на экран телефона как приложение и открывается офлайн */
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

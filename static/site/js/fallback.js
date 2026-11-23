/* Страховка показа контента.
   Анимации появления в core.js включаются через IntersectionObserver; если он
   не срабатывает (скрытая вкладка, печать в PDF, старый браузер), блоки
   остаются с opacity: 0. Через 1.5 с показываем их без анимации. */
(() => {
  const SELECTOR = '[data-reveal], [data-scramble]';
  const show = () => {
    document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('is-in'));
  };
  setTimeout(() => {
    if (!document.querySelector('[data-reveal].is-in, [data-scramble].is-in')) show();
  }, 1500);
  window.addEventListener('beforeprint', show);
})();

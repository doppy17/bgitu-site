/* Плавное появление текста: блоки — снизу вверх по очереди, крупные заголовки — по словам.
   Запускается до основного скрипта макета, тот подхватывает [data-reveal] своим IntersectionObserver. */
(() => {
  if (document.documentElement.classList.contains('shot')) document.querySelectorAll('[data-scramble]').forEach((el) => el.removeAttribute('data-scramble'));
  const AUTO = '.hero .tag, .hero__title, .hero__lead, .hero__cta, .hero__meta, .flow, .page-hero .crumbs, .page-hero .tag, .page-hero h1, .page-hero__lead, .page-hero .hero__cta, .page-hero .meta-row, .timeline li, .cta > .container > *, main .card, main .person, .vtl li, .dirs li, .deps li, .faq details, .people, .cards, .chips, .filter-bar, .feature, .prose > *, .map, .more, .lead-2, .split-layout h3.big, .footer__cols > div';
  document.querySelectorAll(AUTO).forEach((el) => {
    if (el.hasAttribute('data-reveal') || el.parentElement.closest('[data-reveal]:not(.split)')) return;
    el.setAttribute('data-reveal', '');
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min([...el.parentElement.children].indexOf(el), 6));
  });
  // по словам: текстовые узлы режем на слова, вложенные элементы (акцентное слово) — целиком
  document.querySelectorAll('.hero__title, .page-hero h1, .statement, .cta h2, .split-layout h3.big, .feature h2').forEach((el) => {
    let n = 0;
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--w', n++); w.textContent = part; frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) { node.classList.add('w'); node.style.setProperty('--w', n++); }
    });
    el.classList.add('split'); el.setAttribute('data-reveal', '');
  });
})();

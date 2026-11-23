/* Кастомный выпадающий список в стиле сайта.
   Прогрессивное улучшение: любой <select class="input|select"> превращается
   в кнопку + тематическую панель; нативный select остаётся для отправки формы. */
(() => {
  const TARGETS = 'select.input, select.select';
  const CHEVRON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function build(select) {
    if (select.dataset.selReady) return;
    select.dataset.selReady = '1';

    const wrap = document.createElement('div');
    wrap.className = 'sel';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('sel__native');
    select.tabIndex = -1;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sel__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (select.id) btn.id = select.id + '-btn';

    const val = document.createElement('span');
    val.className = 'sel__val';
    const chev = document.createElement('span');
    chev.className = 'sel__chev';
    chev.innerHTML = CHEVRON;
    btn.append(val, chev);

    const panel = document.createElement('div');
    panel.className = 'sel__panel';
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;

    const sync = () => {
      const current = select.options[select.selectedIndex];
      val.textContent = current ? current.textContent.trim() : '';
      panel.replaceChildren();
      Array.from(select.options).forEach((option, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'sel__opt' + (option.selected ? ' is-active' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
        item.dataset.index = String(index);
        item.textContent = option.textContent.trim();
        item.addEventListener('click', () => choose(index));
        panel.appendChild(item);
      });
    };

    const open = () => {
      if (select.disabled) return;
      panel.hidden = false;
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      const active = panel.querySelector('.is-active') || panel.firstElementChild;
      if (active) active.focus({ preventScroll: true });
    };

    const close = (focusBtn) => {
      panel.hidden = true;
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus({ preventScroll: true });
    };

    const choose = (index) => {
      if (select.selectedIndex !== index) {
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
      close(true);
    };

    btn.addEventListener('click', () => (panel.hidden ? open() : close()));
    btn.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open();
      }
    });

    panel.addEventListener('keydown', (event) => {
      const items = Array.from(panel.querySelectorAll('.sel__opt'));
      const index = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        (items[Math.min(items.length - 1, index + 1)] || items[0]).focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        (items[Math.max(0, index - 1)] || items[0]).focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0].focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Tab') {
        close();
      }
    });

    document.addEventListener('click', (event) => {
      if (!wrap.contains(event.target)) close();
    });
    select.addEventListener('change', sync);

    sync();
    wrap.append(btn, panel);
  }

  const init = () => document.querySelectorAll(TARGETS).forEach(build);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

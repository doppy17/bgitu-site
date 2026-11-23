/* Портал БГИТУ — минимальный клиентский слой без зависимостей. */
(function () {
  'use strict';

  var burger = document.getElementById('burger');
  var nav = document.getElementById('cabNav');
  var backdrop = document.getElementById('navBackdrop');

  // Мобильное меню (общее для сайта и кабинета: <nav class="menu" id="menu">)
  var mobileNav = document.getElementById('menu') || document.getElementById('siteNavMobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = mobileNav.hasAttribute('hidden');
      if (mobileNav.id === 'menu') {
        mobileNav.hidden = !open;
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
        document.documentElement.classList.toggle('menu-open', open);
      } else {
        mobileNav.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('is-nav-open', open);
      }
    });
    mobileNav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        if (mobileNav.id === 'menu') {
          mobileNav.hidden = true;
          burger.setAttribute('aria-expanded', 'false');
          document.documentElement.classList.remove('menu-open');
        } else {
          mobileNav.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('is-nav-open');
        }
      }
    });
  }
  var navClose = document.getElementById('navClose');

  function setMenu(open) {
    if (!burger || !nav || !backdrop) return;
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    backdrop.hidden = !open;
    document.body.classList.toggle('nav-open', open);
    if (open && navClose) navClose.focus();
  }

  if (burger && nav && backdrop) {
    burger.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
    backdrop.addEventListener('click', function () {
      setMenu(false);
      burger.focus();
    });
    if (navClose) {
      navClose.addEventListener('click', function () {
        setMenu(false);
        burger.focus();
      });
    }
    nav.addEventListener('click', function (event) {
      if (event.target.closest('.cab-nav__item') && window.matchMedia('(max-width: 1000px)').matches) {
        setMenu(false);
      }
    });

    // Пункты навбара — кнопки с data-href (не <a>: у браузера не показывается
    // адрес в статусной строке при наведении).
    document.addEventListener('click', function (event) {
      var item = event.target.closest('.cab-nav__item');
      if (item && item.dataset.href) {
        window.location.href = item.dataset.href;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        burger.focus();
      }
    });
  }

  var head = document.getElementById('siteHead');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-stuck', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Раскрытие/сворачивание рельса — только кнопкой-стрелкой.
  // Док-магнификация убрана (требование юзера): пункты стоят на местах.
  (function () {
    var dockNav = document.getElementById('cabNav');
    var toggle = document.getElementById('cabToggle');
    if (!dockNav || !toggle) return;
    toggle.addEventListener('click', function () {
      var open = !dockNav.classList.contains('is-expanded');
      dockNav.classList.toggle('is-expanded', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  })();

  // Поле поиска в шапке: ⌘K/Ctrl+K — фокус; Enter — пока честный ответ.
  var search = document.getElementById('headSearch');
  if (search) {
    document.addEventListener('keydown', function (event) {
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        search.focus();
      }
    });
    search.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Поиск в разработке — скоро появится.';
          toast.classList.add('is-on');
          window.setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
        }
      }
    });
  }

  // Сообщения не мешают работе: плавно убираем через 7 секунд.
  var flashes = document.querySelectorAll('.flash');
  if (flashes.length) {
    window.setTimeout(function () {
      flashes.forEach(function (node) {
        node.style.transition = 'opacity .4s ease';
        node.style.opacity = '0';
        window.setTimeout(function () { node.remove(); }, 420);
      });
    }, 7000);
  }
})();

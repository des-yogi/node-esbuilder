/**
 * Главный JS-файл проекта (точка входа)
 * Минимальная инициализация: no-js → js, vh fix, lazy-bg, theme switcher
 * Подключение сторонних библиотек (например, CoreUI) и кастомных скриптов блоков
 */

// =============================================================================
//  Подключение и конфигурация скриптов CoreUI в версии Bootstrap
//  Конфигурация стилей производится в отдельном файле src/scss/_coreui-custom.scss
// =============================================================================
// import "@popperjs/core"; // CoreUI 5.6.1 требует Popper.js для некоторых компонентов (dropdown, tooltip, popover), но только в случае программного управления ими (требуется проверка). Если используются только декларативные атрибуты, можно не подключать и не беспокоиться о Popper.js, модули сами подтянут нужные им зависимости.

// import '@coreui/coreui/js/src/dropdown.js';
// import '@coreui/coreui/js/src/modal.js';
// import '@coreui/coreui/js/src/collapse.js';
// import '@coreui/coreui/js/src/tab.js';
// import '@coreui/coreui/js/src/navigation.js';
// import '@coreui/coreui/js/src/offcanvas.js';
// import Popover from '@coreui/coreui/js/src/popover.js';
// import Tooltip from '@coreui/coreui/js/src/tooltip.js';
// import '@coreui/coreui/js/src/scrollspy.js';
// import '@coreui/coreui/js/src/alert.js';
// import '@coreui/coreui/js/src/button.js';
// import '@coreui/coreui/js/src/carousel.js';
// import '@coreui/coreui/js/src/sidebar.js';
// import Toast from '@coreui/coreui/js/src/toast.js';
// import '@coreui/coreui/js/src/chip.js';
// import '@coreui/coreui/js/src/chip-input.js';

// =============================================================================
//  Enable popovers everywhere (by data-coreui-toggle="popover" attribute)
// =============================================================================
// const popoverTriggerList = document.querySelectorAll('[data-coreui-toggle="popover"]')
// const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new Popover(popoverTriggerEl))

// =============================================================================
//  Enable Bootstrap tooltips
// =============================================================================
// const tooltipTriggerList = document.querySelectorAll('[data-coreui-toggle="tooltip"]')
// const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl))

// =============================================================================
//  Toasts are opt-in for performance reasons, so you must initialize them yourself.
// =============================================================================
// const toastTrigger = document.getElementById('liveToastBtn')
// const toastLiveExample = document.getElementById('liveToast')

// if (toastTrigger) {
//   const toastCoreUI = Toast.getOrCreateInstance(toastLiveExample)
//   toastTrigger.addEventListener('click', () => {
//     toastCoreUI.show()
//   })
// }

// =============================================================================
//  1. Замена класса no-js → js
// =============================================================================

function applyJsClass() {
  document.documentElement.className = document.documentElement.className.replace('no-js', 'js');
}

// =============================================================================
//  2. Фикс 100vh на мобилках
//     Использование в CSS:  height: 100vh; height: calc(var(--vh, 1vh) * 100);
// =============================================================================

function setupVhFix() {
  var setVh = function () {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  };
  setVh();
  window.addEventListener('resize', setVh);
}

// =============================================================================
//  3. Lazy-загрузка фоновых изображений (data-bg / data-bg-webp)
//     С определением поддержки WebP и плавным появлением
// =============================================================================

function canUseWebp() {
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d')) &&
    elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

function loadBackgroundImage(element, fastScroll) {
  var isWebpSupported = canUseWebp();
  var bgImage = isWebpSupported
    ? element.getAttribute('data-bg-webp')
    : element.getAttribute('data-bg');

  if (!bgImage) return;

  element.style.backgroundImage = 'url(' + bgImage + ')';
  element.removeAttribute('data-bg');
  element.removeAttribute('data-bg-webp');

  var speed = parseFloat(element.getAttribute('data-bg-speed')) || 1;
  var finalSpeed = fastScroll ? speed * 0.5 : speed;

  requestAnimationFrame(function () {
    element.style.transition = 'opacity ' + finalSpeed + 's ease-out';
    element.style.opacity = 1;
  });
}

function observeLazyLoad() {
  var lazyElements = document.querySelectorAll('[data-bg], [data-bg-webp]');

  lazyElements.forEach(function (el) {
    el.style.opacity = '0';
    el.style.willChange = 'opacity';
  });

  var lastTime = performance.now();
  var lastScrollY = window.scrollY;

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries, obs) {
      var now = performance.now();
      var deltaY = Math.abs(window.scrollY - lastScrollY);
      var deltaT = now - lastTime;
      var speed = deltaY / (deltaT || 1);
      var fastScroll = speed > 1;

      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadBackgroundImage(entry.target, fastScroll);
          obs.unobserve(entry.target);
        }
      });

      lastTime = now;
      lastScrollY = window.scrollY;
    }, { rootMargin: '0px', threshold: 0.1 });

    lazyElements.forEach(function (el) { observer.observe(el); });
  } else {
    lazyElements.forEach(function (el) { loadBackgroundImage(el, false); });
  }
}

// =============================================================================
//  4. Theme Switcher (переключатель светлой/тёмной темы)
// =============================================================================

/**
 * Theme Switcher Script
 *
 * Автоматически определяет и применяет светлую или тёмную тему
 * на основе системных настроек пользователя (prefers-color-scheme).
 * Позволяет вручную переключать тему с плавной анимацией перехода.
 * Сохраняет выбор пользователя в localStorage и синхронизирует
 * тему между всеми открытыми вкладками.
 * При удалении значения из localStorage возвращается к системной теме.
 *
 * Основные возможности:
 * - Автоматический выбор темы при первой загрузке (по system preference).
 * - Переключение темы по кнопке с id="toggle-theme" с плавным переходом.
 * - Реакция на изменение системной темы (если пользователь не выбрал вручную).
 * - Синхронизация темы между вкладками через событие storage.
 * - Отключение анимации при первой установке темы (через класс no-transition).
 *
 * Для корректной работы требуется:
 * - Кнопка с id="toggle-theme" для ручного переключения.
 * - Класс "no-transition" на <html> для предотвращения анимации при первой загрузке.
 * - CSS для .theme-transition с нужными transition-свойствами:
 *
 *   html.no-transition *,
 *   html.no-transition {
 *     transition: none !important;
 *   }
 *
 *   html.theme-transition * {
 *     transition:
 *       background-color 0.3s ease,
 *       color 0.3s ease,
 *       border-color 0.3s ease;
 *   }
 */

function initThemeSwitcher() {
  var STORAGE_KEY = 'theme';
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  var transitionTimeout;
  var lastToggleTime = 0;

  function setThemeAttribute(theme, smooth) {
    if (smooth) {
      clearTimeout(transitionTimeout);
      document.documentElement.classList.add('theme-transition');
      transitionTimeout = setTimeout(function () {
        document.documentElement.classList.remove('theme-transition');
      }, 350);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }

  function applyTheme(theme, smooth) {
    setThemeAttribute(theme, smooth);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function applySystemTheme(smooth) {
    var systemTheme = prefersDark.matches ? 'dark' : 'light';
    setThemeAttribute(systemTheme, smooth);
    localStorage.removeItem(STORAGE_KEY);
  }

  function toggleTheme() {
    var now = Date.now();
    if (now - lastToggleTime < 500) return;
    lastToggleTime = now;

    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  }

  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      // Блокируем toggleTheme, чтобы не создать цикл
      lastToggleTime = Date.now();

      if (e.newValue === null) {
        setThemeAttribute(prefersDark.matches ? 'dark' : 'light', true);
      } else if (e.newValue === 'dark' || e.newValue === 'light') {
        setThemeAttribute(e.newValue, true);
      }
    }
  });

  function initDOM() {
    var saved = localStorage.getItem(STORAGE_KEY);

    if (saved === 'dark' || saved === 'light') {
      setThemeAttribute(saved, false);
    } else {
      setThemeAttribute(prefersDark.matches ? 'dark' : 'light', false);
    }

    requestAnimationFrame(function () {
      document.documentElement.classList.remove('no-transition');
    });

    var toggleBtn = document.getElementById('toggle-theme');
    if (toggleBtn) {
      toggleBtn.removeEventListener('click', toggleTheme);
      toggleBtn.addEventListener('click', toggleTheme);
    }

    prefersDark.addEventListener('change', function () {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applySystemTheme(true);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOM);
  } else {
    initDOM();
  }
}

// =============================================================================
//  5. Инициализация
// =============================================================================

function initGlobal() {
  applyJsClass();
  setupVhFix();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeLazyLoad);
  } else {
    observeLazyLoad();
  }

  initThemeSwitcher();
}

initGlobal();


// =============================================================================
//  Сниппеты-напоминалки (закомментированы)
// =============================================================================

// --- DOMContentLoaded без jQuery (современный вариант) ---
// function ready(fn) {
//   if (document.readyState !== 'loading') {
//     fn();
//   } else {
//     document.addEventListener('DOMContentLoaded', fn);
//   }
// }
//
// ready(function () {
//   // code
// });

// --- Изоляция без jQuery (IIFE) ---
// (function () {
//   // code
// }());

// --- Выполнить код только на определённой ширине ---
// if (window.matchMedia('(min-width: 1366px)').matches) {
//   // код для экранов >= 1366px
// }

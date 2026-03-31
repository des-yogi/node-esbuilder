/**
 * Главный JS-файл проекта (точка входа)
 * Минимальная инициализация: no-js → js, vh fix, lazy-bg, theme switcher
 */


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

/**
 * Проверка поддержки WebP через canvas
 */
function canUseWebp() {
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d')) &&
    elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Подгрузка фона для одного элемента
 * @param {HTMLElement} element  — элемент с data-bg / data-bg-webp
 * @param {boolean}     fastScroll — быстрая прокрутка (сокращает время анимации)
 */
function loadBackgroundImage(element, fastScroll) {
  var isWebpSupported = canUseWebp();
  var bgImage = isWebpSupported
    ? element.getAttribute('data-bg-webp')
    : element.getAttribute('data-bg');

  if (!bgImage) return;

  element.style.backgroundImage = 'url(' + bgImage + ')';
  element.removeAttribute('data-bg');
  element.removeAttribute('data-bg-webp');

  // Читаем скорость из атрибута (по умолчанию 1 сек)
  var speed = parseFloat(element.getAttribute('data-bg-speed')) || 1;
  var finalSpeed = fastScroll ? speed * 0.5 : speed;

  // Плавное появление
  requestAnimationFrame(function () {
    element.style.transition = 'opacity ' + finalSpeed + 's ease-out';
    element.style.opacity = 1;
  });
}

/**
 * Инициализация IntersectionObserver для ленивой загрузки фонов
 */
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
    // Фоллбек для старых браузеров без IntersectionObserver
    lazyElements.forEach(function (el) { loadBackgroundImage(el, false); });
  }
}

/* Разметка lazy-bg:

  // Фон появится за 0.5 секунды
  <div data-bg="/images/image2.jpg" data-bg-webp="/images/image2.webp" data-bg-speed="0.5"></div>

  // Фон появится дефолтно за 1 сек
  <div data-bg="/img/image.jpg" data-bg-webp="/img/image.webp"></div>
*/


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
 * - Класс "no-transition" на <html> для п��едотвращения анимации при первой загрузке.
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

  function getPreferredTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return prefersDark.matches ? 'dark' : 'light';
  }

  function applyTheme(theme, smooth) {
    if (smooth) {
      clearTimeout(transitionTimeout);
      document.documentElement.classList.add('theme-transition');
      transitionTimeout = setTimeout(function () {
        document.documentElement.classList.remove('theme-transition');
      }, 350); // должно соответствовать времени transition в CSS
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function applySystemTheme(smooth) {
    var systemTheme = prefersDark.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', systemTheme);
    // Важно: не сохраняем в localStorage, чтобы не мешать системному выбору
    localStorage.removeItem(STORAGE_KEY);
    if (smooth) {
      clearTimeout(transitionTimeout);
      document.documentElement.classList.add('theme-transition');
      transitionTimeout = setTimeout(function () {
        document.documentElement.classList.remove('theme-transition');
      }, 350);
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  }

  // Синхронизация между вкладками
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      if (e.newValue === null) {
        applySystemTheme(true);
      } else if (e.newValue === 'dark' || e.newValue === 'light') {
        applyTheme(e.newValue, true);
      }
    }
  });

  // Инициализация при загрузке
  document.addEventListener('DOMContentLoaded', function () {
    var theme = getPreferredTheme();
    applyTheme(theme, false);

    // Убираем класс, отключающий анимации, после первой отрисовки
    requestAnimationFrame(function () {
      document.documentElement.classList.remove('no-transition');
    });

    // Назначаем обработчик на переключатель (если кнопка есть)
    var toggleBtn = document.getElementById('toggle-theme');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }

    // Реакция на смену системной темы, если нет сохранённого выбора
    prefersDark.addEventListener('change', function () {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applySystemTheme(true);
      }
    });
  });
}


// =============================================================================
//  5. Инициализация
// =============================================================================

function initGlobal() {
  applyJsClass();
  setupVhFix();
  document.addEventListener('DOMContentLoaded', observeLazyLoad);
  initThemeSwitcher();
}

// Выполняем init сразу — файл выполняется при подключении в бандл
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

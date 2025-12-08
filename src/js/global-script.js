document.documentElement.className = document.documentElement.className.replace('no-js', 'js');

// Добавление 1vh (использование: height: 100vh; height: calc(var(--vh, 1vh) * 100);) для фикса 100vh на мобилках
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

(function () {
  function canUseWebp() {
    let elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'))
      && elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  function loadBackgroundImage(element, fastScroll) {
    let isWebpSupported = canUseWebp();
    let bgImage = isWebpSupported
      ? element.getAttribute('data-bg-webp')
      : element.getAttribute('data-bg');

    if (bgImage) {
      element.style.backgroundImage = `url(${bgImage})`;
      element.removeAttribute('data-bg');
      element.removeAttribute('data-bg-webp');

      // Читаем скорость из атрибута (по умолчанию 1 сек)
      let speed = parseFloat(element.getAttribute('data-bg-speed')) || 1;
      if (fastScroll) speed *= 0.5; // Ускоряем при быстрой прокрутке

      // Плавное появление
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${speed}s ease-out`;
        element.style.opacity = 1;
      });
    }
  }

  function observeLazyLoad() {
    let lazyElements = document.querySelectorAll('[data-bg], [data-bg-webp]');

    lazyElements.forEach(el => {
      el.style.opacity = '0';
      el.style.willChange = 'opacity';
    });

    let lastTime = performance.now();
    let lastScrollY = window.scrollY;

    if ('IntersectionObserver' in window) {
      let observer = new IntersectionObserver((entries, obs) => {
        let now = performance.now();
        let deltaY = Math.abs(window.scrollY - lastScrollY);
        let deltaT = now - lastTime;
        let speed = deltaY / (deltaT || 1);
        let fastScroll = speed > 1;

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadBackgroundImage(entry.target, fastScroll);
            obs.unobserve(entry.target);
          }
        });

        lastTime = now;
        lastScrollY = window.scrollY;
      }, { rootMargin: '0px', threshold: 0.1 });

      lazyElements.forEach(el => observer.observe(el));
    } else {
      lazyElements.forEach(el => loadBackgroundImage(el, false));
    }
  }

  document.addEventListener('DOMContentLoaded', observeLazyLoad);

  /* Разметка:
    // Фон появится за 0.5 секунды
    <div data-bg="/images/image2.jpg" data-bg-webp="/images/image2.webp" data-bg-speed="0.5"></div>

    // Фон появится дефолтно за 1 сек
    <div data-bg="/img/image.jpg" data-bg-webp="/img/image.webp"></div>
  */

})();

// Если на проекте jQuery
// $( document ).ready(function() {
//   // code
// });

// Изоляция без jQuery
// (function(){
//   // code
// }());

// На проекте нет jQuery, но хочется $( document ).ready...
// function ready(fn) {
//   if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
//     fn();
//   } else {
//     document.addEventListener('DOMContentLoaded', fn);
//   }
// }
//
// ready(function(){
//   // code
// });



// $(document).ready(function(){
//   if(window.matchMedia('(min-width: 1366px)').matches){
//   // do functionality on screens bigger than 1366px
//     $("#sticker").sticky({
//       topSpacing: 100
//     });
//   }
//   return false;
// });

/*(function () {
  //const agreementElems = document.querySelectorAll('.contacts__agreement');
  const agreementElems = document.querySelectorAll('[class$="__agreement"]');

  for (let i = 0; i < agreementElems.length; i++) {
    let agreementElem = agreementElems[i];
    if (!agreementElem) return;
    //const submitBtn = agreementElem.querySelector('.contacts__submit');
    const submitBtn = agreementElem.querySelector('button[type=submit]');
    const agreementCheckbox = agreementElem.querySelector('.agreement-field');

    if (agreementCheckbox) {
      agreementCheckbox.addEventListener('change', function (e) {
        if (!e.target.checked) {
          submitBtn.disabled = true;
        } else {
          submitBtn.disabled = false;
        }
      });
    }
  }

})();*/

// (function () {
//   const root = document.documentElement;
//   const themeKey = 'theme';
//   const toggleBtn = document.getElementById('toggle-theme');

//   // Получить системную тему
//   function getSystemTheme() {
//     return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
//   }

//   // Установить тему (и записать в localStorage, если передана)
//   function applyTheme(theme, persist = true) {
//     root.setAttribute('data-theme', theme);
//     if (persist) {
//       localStorage.setItem(themeKey, theme);
//     }
//   }

//   // Инициализация при загрузке страницы
//   function initTheme() {
//     const savedTheme = localStorage.getItem(themeKey);
//     const theme = savedTheme || getSystemTheme();
//     applyTheme(theme, false);
//   }

//   // Переключение между темами
//   function toggleTheme() {
//     const current = root.getAttribute('data-theme');
//     const next = current === 'dark' ? 'light' : 'dark';
//     applyTheme(next);
//   }

//   // Синхронизация между вкладками
//   window.addEventListener('storage', (e) => {
//     if (e.key === themeKey && e.newValue) {
//       applyTheme(e.newValue, false);
//     }
//   });

//   // Привязка кнопки
//   toggleBtn.addEventListener('click', toggleTheme);

//   // Инициализация
//   initTheme();


// })()

(function () {
  const STORAGE_KEY = 'theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  let transitionTimeout;

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return prefersDark.matches ? 'dark' : 'light';
  }

  function applyTheme(theme, smooth = false) {
    if (smooth) {
      clearTimeout(transitionTimeout);
      document.documentElement.classList.add('theme-transition');
      transitionTimeout = setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 350); // должно соответствовать времени transition в CSS
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function applySystemTheme(smooth = false) {
    const systemTheme = prefersDark.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', systemTheme);
    // Важно: не сохраняем в localStorage, чтобы не мешать системному выбору
    if (smooth) {
      clearTimeout(transitionTimeout);
      document.documentElement.classList.add('theme-transition');
      transitionTimeout = setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 350);
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  }

  // Синхронизация между вкладками
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      if (e.newValue === null) {
        applySystemTheme(true);
      } else if (e.newValue === 'dark' || e.newValue === 'light') {
        applyTheme(e.newValue, true);
      }
    }
  });

  // Инициализация при загрузке
  window.addEventListener('DOMContentLoaded', () => {
    const theme = getPreferredTheme();
    applyTheme(theme);

    // Убираем класс, отключающий анимации, после первой отрисовки
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transition');
    });

    // Назначаем обработчик на переключатель
    document.getElementById('toggle-theme')?.addEventListener('click', toggleTheme);

    // Реакция на смену системной темы, если нет сохранённого выбора
    prefersDark.addEventListener('change', () => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applySystemTheme(true);
      }
    });
  });
  /**
   * Theme Switcher Script
   *
   * Автоматически определяет и применяет светлую или тёмную тему на основе системных настроек пользователя.
   * Позволяет вручную переключать тему с плавной анимацией перехода.
   * Сохраняет выбор пользователя в localStorage и синхронизирует тему между всеми открытыми вкладками.
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
   * - html.no-transition *,
   * - html.no-transition {
   * -   transition: none !important;
   * - }
   * - html.theme-transition * {
   * -  transition:
   * -    background-color 0.3s ease,
   * -     color 0.3s ease,
   * -     border-color 0.3s ease;
   * - }
   */
})();

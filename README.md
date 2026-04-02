# node-esbuilder

Современный сборщик проектов для классической вёрстки на основе БЭМ-методологии.

Замена устаревшего Gulp-стека. Без React, Vue и прочих фреймворков —
чистый HTML, SCSS, vanilla JS.

## Стек

| Инструмент                   | Для чего                                           |
| ---------------------------- | -------------------------------------------------- |
| **Dart Sass:** "sass: 1.98.0 | Компиляция SCSS → CSS                              |
| **PostCSS: "^8.5.6"**        | Autoprefixer, сортировка media-queries, inline SVG |
| **esbuild: "^0.27.5"**       | Сборка JS в один бандл (IIFE), минификация         |
| **browser-sync: "^3.0.4"**   | Dev-сервер с live-reload                           |
| **chokidar**: "^5.0.0"       | Слежение за изменениями файлов                     |
| **sharp**: "0.34.5"          | Оптимизация и конвертация изображений (WebP, AVIF) |

## Быстрый старт

```bash
# Клонирование
git clone https://github.com/des-yogi/node-esbuilder.git my-project
cd my-project

# Установка зависимостей
npm i

# Запуск dev-сервера (сборка + browser-sync + вотчеры)
npm run dev

# Production-сборка
npm run build
```

## Команды

| Команда                             | Что делает                                      |
| ----------------------------------- | ----------------------------------------------- |
| `npm run dev`                       | Dev-сервер: сборка + browser-sync + во��черы    |
| `npm start`                         | Алиас для `npm run dev`                         |
| `npm run build`                     | Production-сборка (минификация, без sourcemaps) |
| `npm run create-block`              | Создание нового БЭМ-блока                       |
| `npm run gen:style`                 | Перегенерация `style.scss`                      |
| `npm run img:opt -- <вход> <выход>` | Оптимизация картинок + конвертация в WebP/AVIF  |
| `npm run lint:css`                  | Проверка SCSS через stylelint                   |
| `npm run lint:js`                   | Проверка JS через eslint                        |

## Структура проекта

```
project/
├── build/                     # Результат сборки (генерируется)
│   ├── css/
│   │   ├── style.min.css      # Основной бандл стилей
│   │   └── bootstrap.min.css  # copiedCss
│   ├── js/
│   │   ├── script.min.js      # Основной бандл JS
│   │   └── bootstrap.bundle.min.js  # copiedJs
│   ├── img/
│   ├── fonts/
│   ├── video/
│   └── index.html
│
├── design/                    # Служебная папка (НЕ в git)
│
├── src/                       # Исходники
│   ├── _include/              # HTML-фрагменты для @@include
│   ├── blocks/                # БЭМ-блоки
│   │   ├── page/
│   │   │   ├── page.html
│   │   │   ├── page.scss
│   │   │   ├── page.js        # (опционально)
│   │   │   └── img/           # Картинки блока → build/img/
│   │   └── ...
│   ├── css/                   # Готовые CSS для copiedCss
│   ├── fonts/                 # Шрифты → build/fonts/
│   ├── img/                   # Глобальные картинки → build/img/
│   ├── video/                 # Видео → build/video/
│   ├── js/
│   │   ├── index.js           # Точка входа (глобальные скрипты)
│   │   └── libs/              # Готовые JS для copiedJs
│   ├── scss/
│   │   ├── variables.scss
│   │   ├── mixins.scss
│   │   ├── print.scss
│   │   └── style.scss         # Генерируется автоматически!
│   └── index.html             # Главная страница
│
├── scripts/                   # Скрипты сборщика
│   ├── build.mjs              # Оркестратор сборки
│   ├── dev-server.mjs         # Dev-сервер + вотчеры
│   ├── config.mjs             # Чтение projectConfig.json
│   ├── clean.mjs              # Очистка build/
│   ├── generateStyle.mjs      # Генерация style.scss
│   ├── styles.mjs             # Компиляция SCSS → CSS
│   ├── scripts.mjs            # Сборка JS через esbuild
│   ├── assets.mjs             # Копирование шрифтов, картинок, видео
│   ├── html.mjs               # Сборка HTML (@@include)
│   ├── sprite-svg.mjs         # Сборка SVG-спрайта
│   ├── img-opt.mjs            # Оптимизация + конвертация картинок
│   └── logger.mjs             # Цветной вывод в консоль
│
├── projectConfig.json         # Главный конфиг проекта
├── customPostcss.js           # Пользовательские PostCSS-плагины
├── createBlock.mjs            # Утилита создания блоков
└── package.json
```

## projectConfig.json

Центральный файл конфигурации. Управляет тем, какие блоки, стили и скрипты
включаются в сборку.

```json
{
  "dirs": {
    "srcPath": "src/",
    "buildPath": "build/",
    "blocksDirName": "blocks"
  },

  "blocks": {
    "page": [],
    "header": [],
    "footer": []
  },

  "addCssBefore": [
    "src/scss/variables.scss",
    "src/scss/mixins.scss"
  ],
  "addCssAfter": [
    "src/scss/print.scss"
  ],

  "addJsBefore": [],
  "addJsAfter": [],

  "copiedJs": [
    "src/js/libs/bootstrap.bundle.min.js"
  ],
  "copiedCss": [
    "src/css/bootstrap.min.css"
  ],

  "singleCompiled": [],

  "allowedImageExtensions": [
    "jpg", "jpeg", "png", "gif", "svg", "ico", "webp", "avif"
  ],
  "allowedVideoExtensions": [
    "mp4", "webm", "ogv"
  ]
}
```

### Описание полей

| Поле                     | Описание                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| `blocks`                 | Объект: ключ — имя блока, значение — `[]`. Порядок ключей = порядок в CSS |
| `addCssBefore`           | SCSS-файлы, подключаемые ДО блоков в `style.scss`                         |
| `addCssAfter`            | SCSS-файлы, подключаемые ПОСЛЕ блоков                                     |
| `addJsBefore`            | JS-файлы, подключаемые ДО блоков в бандле                                 |
| `addJsAfter`             | JS-файлы, подключаемые ПОСЛЕ блоков                                       |
| `copiedJs`               | JS-файлы, копируемые в `build/js/` без сборки                             |
| `copiedCss`              | CSS-файлы, копируемые в `build/css/` без сборки                           |
| `singleCompiled`         | SCSS-файлы, компилируемые в отдельные CSS (не в общий бандл)              |
| `allowedImageExtensions` | Белый список расширений картинок при копировании                          |
| `allowedVideoExtensions` | Белый список расширений видео при копировании                             |

## БЭМ-нейминг

Проект использует БЭМ-методологию:

- **Блок:** `block-name`
- **Элемент:** `block-name__element`
- **Модификатор:** `block-name block-name--modifier`

### Создание блока

```bash
npm run create-block
# Введите имя блока: my-block
```

Создаёт:

```
src/blocks/my-block/
├── my-block.html
├── my-block.scss
├── my-block.js
├── bg-img/
└── img/
```

И автоматически добавляет блок в `projectConfig.json`.

## Подключение сторонних библиотек

### JavaScript

**Способ 1 — через import в коде (рекомендуется):**

```bash
npm i swiper
```

```js
// src/blocks/slider/slider.js
import Swiper from 'swiper';

var slider = new Swiper('.slider', { slidesPerView: 1 });
```

esbuild автоматически подтянет пакет из `node_modules` и включит в бандл.
Работает с ESM, CommonJS и UMD — формат не имеет значения.

**Способ 2 — через projectConfig.json (классический):**

```json
"addJsBefore": [
  "./node_modules/swiper/swiper-bundle.min.js"
]
```

Файл будет включён в общий бандл `script.min.js`.
Поддерживаются файлы любого формата (ESM, CJS, UMD).

**Способ 3 — копирование без сборки:**

```json
"copiedJs": [
  "src/js/libs/bootstrap.bundle.min.js"
]
```

Файл копируется в `build/js/` как есть. Подключается в HTML отдельным `<script>`.

### CSS / SCSS

**Способ 1 — через @use в SCSS (рекомендуется):**

```scss
// src/scss/variables.scss
@use 'bootstrap/scss/functions' as *;
@use 'bootstrap/scss/variables' as bs-vars;

$primary: #FF6600;
```

```scss
// src/blocks/modal/modal.scss
@use '../../scss/variables' as *;
@use 'bootstrap/scss/mixins' as bs;

.modal {
  @include bs.media-breakpoint-up(md) {
    padding: 32px;
  }
}
```

Dart Sass сам находит пакеты в `node_modules`.

**Способ 2 — через projectConfig.json (классический):**

```json
"addCssBefore": [
  "node_modules/bootstrap/scss/_functions.scss",
  "node_modules/bootstrap/scss/_variables.scss",
  "src/scss/variables.scss",
  "src/scss/mixins.scss"
]
```

Файлы подключаются через `@use` в сгенерированном `style.scss`.

**Способ 3 — копирование готового CSS:**

```json
"copiedCss": [
  "src/css/bootstrap.min.css"
]
```

Файл копируется в `build/css/` как есть.

> **Оба подхода (1 и 2) можно комбинировать** в одном проекте. Переходить
> на `import`/`@use` можно постепенно.

## Оптимизация изображений

Отдельная утилита для оптимизации и конвертации в современные форматы:

```bash
# Из папки design в папку design (конвертация без затрагивания src)
npm run img:opt -- design/originals design/optimized

# Из design напрямую в src
npm run img:opt -- design/photos src/img

# Картинки конкретного блока
npm run img:opt -- design/hero src/blocks/hero/img
```

**Что делает для каждого JPG/PNG:**

- Создаёт оптимизированный оригинал (mozjpeg / PNG effort:8)
- Создаёт `.webp` версию
- Создаёт `.avif` версию
- SVG, ICO, GIF — копирует без изменений

Структура вложенных папок сохраняется.

## Сборка стилей

### Порядок подключения в style.scss

```
addCssBefore → блоки (в порядке ключей blocks) → addCssAfter
```

Файл `src/scss/style.scss` **генерируется автоматически** — не редактируйте
его вручную.

### singleCompiled

Файлы из `singleCompiled` компилируются отдельно, каждый в свой
`build/css/<имя>.min.css`. Не попадают в основной `style.min.css`.

```json
"singleCompiled": [
  "src/scss/admin.scss",
  "src/scss/landing.scss"
]
```

## Сборка JS

### Порядок в бандле

```
src/js/index.js → addJsBefore → блоки (в порядке ключей blocks) → addJsAfter
```

`index.js` всегда выполняется первым — он содержит глобальную инициализацию
(замена `no-js` на `js`, исправление vh на мобильных, lazy-load и т.д.).

JS-файлы блоков **опциональны** — если у блока нет `.js` файла, он
пропускается без ошибок.

### copiedJs

Файлы из `copiedJs` **не проходят** через esbuild — копируются в `build/js/`
как есть и подключаются отдельным `<script>` в HTML.

## HTML

Используется система `@@include` для подключения фрагментов:

```html
<!-- src/index.html -->
@@include('blocks/header/header.html')
@@include('blocks/main/main.html')
@@include('blocks/footer/footer.html')
```

Поддерживаются переменные:

```html
@@include('blocks/button/button.html', { "text": "Отправить", "mod": "primary" })
```

Комментарии `<!--DEV ... -->` автоматически удаляются при сборке.

## Инкрементальная сборка

При работе в dev-режиме ассеты (картинки, шрифты, видео) копируются
**только если изменились** (проверка по mtime файла). Это значительно
ускоряет пересборку на проектах с большим количеством медиафайлов.

## Режимы сборки

|                        | Development (`npm run dev`)  | Production (`npm run build`) |
| ---------------------- | ---------------------------- | ---------------------------- |
| CSS                    | expanded + sourcemaps        | compressed, без sourcemaps   |
| JS                     | без минификации + sourcemaps | минификация, без sourcemaps  |
| `process.env.NODE_ENV` | `'development'`              | `'production'`               |

## Пользовательские PostCSS-плагины

Файл `customPostcss.js` в корне проекта позволяет добавить свои
PostCSS-плагины. Они применяются ко всем SCSS-компиляциям (основной бандл
и singleCompiled):

```js
// customPostcss.js
// import myPlugin from 'postcss-my-plugin';
// export default [myPlugin()];
export default [];
```

## Требования

- Node.js ≥ 20 (22)+
- npm ≥ 9

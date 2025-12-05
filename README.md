# node-esbuilder

Многофункциональный сборщик проектов на Node.js + esbuild + БЭМ

## Описание

Современный сборщик фронтенд-проектов без использования Gulp или других таск-раннеров. Использует нативные возможности Node.js 20+ и современные инструменты:

- **esbuild** — быстрая сборка JavaScript
- **Dart Sass** — компиляция SCSS
- **PostCSS** — постобработка CSS (autoprefixer, inline-svg, сортировка медиа-запросов)
- **browser-sync** — dev-сервер с live reload
- **chokidar** — отслеживание изменений файлов

## Установка

```bash
npm install
```

## Использование

### Основные команды

```bash
# Production сборка
npm run build

# Development сборка и запуск dev-сервера
npm run dev
# или
npm start

# Генерация style.scss из блоков
npm run gen:style

# Создание нового блока
npm run create-block <имя-блока>

# Линтинг
npm run lint:css
npm run lint:js
```

### Переменные окружения

- `NODE_ENV=production` — режим production (минификация, без sourcemaps)
- `NODE_ENV=development` — режим development (sourcemaps, без минификации, по умолчанию)

## Архитектура сборщика

### Структура scripts/

Все модули сборки находятся в директории `scripts/` в формате ES-модулей (`.mjs`):

- **config.mjs** — централизованное чтение `projectConfig.json` и функция `getFilesList()`
- **clean.mjs** — очистка директории `build/`
- **generateStyle.mjs** — генерация `src/scss/style.scss` с импортами блоков
- **sprite-svg.mjs** — сборка SVG-спрайта (TODO)
- **styles.mjs** — компиляция SCSS → CSS + PostCSS
- **scripts.mjs** — сборка JavaScript через esbuild
- **assets.mjs** — копирование статических ресурсов
- **html.mjs** — сборка HTML с поддержкой инклюдов (TODO)
- **build.mjs** — оркестратор полной сборки
- **dev-server.mjs** — dev-сервер с вотчерами

### Последовательность сборки

1. **clean** — очистка `build/`
2. **generateStyle** — генерация `src/scss/style.scss`
3. **sprite-svg** — сборка SVG-спрайта
4. **styles** — SCSS → CSS
5. **scripts** — JS → bundle
6. **assets** — копирование шрифтов, изображений
7. **html** — обработка HTML

## Конфигурация проекта

Основная конфигурация находится в файле `projectConfig.json`:

```json
{
  "dirs": {
    "srcPath": "src/",
    "buildPath": "build/",
    "blocksDirName": "blocks"
  },
  "blocks": {
    "имя-блока": []
  },
  "addCssBefore": ["src/scss/variables.scss"],
  "addCssAfter": [],
  "addJsBefore": [],
  "addJsAfter": []
}
```

## БЭМ-методология

Проект использует БЭМ (Блок-Элемент-Модификатор):

- **Блок**: `block-name`
- **Элемент**: `block-name__element`
- **Модификатор**: `block-name--modifier`

### Структура блока

```
src/blocks/block-name/
  ├── block-name.scss       # Стили блока
  ├── block-name.js         # Логика блока
  ├── block-name.html       # Шаблон для инклюда
  ├── img/                  # Изображения блока
  └── readme.md             # Описание блока
```

## Статус разработки (Этап 1)

✅ **Реализовано:**
- Базовая структура модулей сборщика
- Компиляция SCSS → CSS с PostCSS
- Сборка JavaScript через esbuild
- Копирование статических ресурсов
- Dev-сервер с live reload
- Вотчеры для автоматической пересборки

⏳ **TODO (следующие этапы):**
- Полная реализация обработки HTML-инклюдов (аналог gulp-file-include)
- Удаление `<!--DEV ... -->` комментариев в production
- Генерация SVG-спрайта
- Копирование изображений из блоков
- Оптимизация изображений
- Генерация WebP/AVIF версий
- Обработка `singleCompiled`, `copiedCss`, `copiedJs` из конфигурации
- Поддержка извлечения медиа-запросов в отдельные файлы

## Требования

- Node.js >= 20
- npm >= 9

## Лицензия

См. файл LICENSE


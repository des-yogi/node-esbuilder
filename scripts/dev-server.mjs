/**
 * dev-server.mjs
 * 
 * Dev-сервер с автоматической пересборкой при изменении файлов.
 * 
 * Функционал:
 * 1. Выполняет начальную сборку проекта (через build.mjs)
 * 2. Запускает browser-sync для раздачи файлов из build/
 * 3. Настраивает вотчеры на изменения файлов:
 *    - src/**\/*.scss → пересборка стилей (styles.mjs)
 *    - src/**\/*.js → пересборка скриптов (scripts.mjs)
 *    - src/**\/*.html → пересборка HTML (html.mjs)
 *    - src/img/** → копирование ассетов (assets.mjs)
 *    - src/fonts/** → копирование ассетов (assets.mjs)
 *    - projectConfig.json → полная пересборка
 * 4. Перезагружает браузер при изменениях
 * 
 * Использует:
 * - browser-sync для dev-сервера и live reload
 * - chokidar для отслеживания изменений файлов
 * 
 * TODO: Настроить оптимальные паттерны для вотчеров
 * TODO: Добавить debounce для множественных изменений
 * TODO: Добавить поддержку HTTPS (опционально)
 * TODO: Настроить proxy при необходимости
 */

import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import browserSync from 'browser-sync';
import { build } from './build.mjs';
import { generateStyleFile } from './generateStyle.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { buildHtml } from './html.mjs';
import { buildAssets } from './assets.mjs';
import { buildSvgSprite } from './sprite-svg.mjs';
import { projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bs = browserSync.create();
const mode = 'development';

/**
 * Запускает dev-сервер с вотчерами
 */
async function startDevServer() {
  console.log('='.repeat(60));
  console.log('[NTH] Запуск dev-сервера...');
  console.log('='.repeat(60));

  try {
    // Шаг 1: Начальная сборка проекта
    console.log('[NTH] Выполняется начальная сборка...\n');
    await build({ mode });

    // Шаг 2: Запуск browser-sync
    console.log('\n[NTH] Запуск browser-sync...');
    const buildPath = path.join(__dirname, '..', projectConfig.dirs.buildPath);

    bs.init({
      server: {
        baseDir: buildPath
      },
      port: 3000,
      open: true, // автоматически открывать браузер
      notify: false, // отключить уведомления browser-sync
      ui: false, // отключить UI browser-sync
      // TODO: Настроить HTTPS при необходимости
      // https: true,
      ghostMode: {
        clicks: false,
        forms: false,
        scroll: false
      }
    });

    console.log('[NTH] ✓ Browser-sync запущен на http://localhost:3000');

    // Шаг 3: Настройка вотчеров
    setupWatchers();

    console.log('[NTH] ✓ Вотчеры настроены');
    console.log('='.repeat(60));
    console.log('[NTH] Dev-сервер работает. Ожидание изменений...');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при запуске dev-сервера:', error);
    process.exit(1);
  }
}

/**
 * Настраивает вотчеры для отслеживания изменений
 */
function setupWatchers() {
  const srcPath = path.join(__dirname, '..', projectConfig.dirs.srcPath);

  // Вотчер для SCSS файлов
  const scssWatcher = chokidar.watch([
    path.join(srcPath, '**/*.scss')
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  scssWatcher.on('all', async (event, filePath) => {
    console.log(`\n[NTH] SCSS изменен: ${path.basename(filePath)} (${event})`);
    try {
      // Регенерируем style.scss если изменился файл блока
      if (filePath.includes('/blocks/')) {
        generateStyleFile();
      }
      await buildStyles({ mode });
      bs.reload('*.css');
    } catch (error) {
      console.error('[NTH] ✗ Ошибка при пересборке стилей:', error);
    }
  });

  // Вотчер для JS файлов
  const jsWatcher = chokidar.watch([
    path.join(srcPath, '**/*.js')
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  jsWatcher.on('all', async (event, filePath) => {
    console.log(`\n[NTH] JS изменен: ${path.basename(filePath)} (${event})`);
    try {
      await buildScripts({ mode });
      bs.reload();
    } catch (error) {
      console.error('[NTH] ✗ Ошибка при пересборке скриптов:', error);
    }
  });

  // Вотчер для HTML файлов
  const htmlWatcher = chokidar.watch([
    path.join(srcPath, '**/*.html')
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  htmlWatcher.on('all', async (event, filePath) => {
    console.log(`\n[NTH] HTML изменен: ${path.basename(filePath)} (${event})`);
    try {
      await buildHtml({ mode });
      bs.reload();
    } catch (error) {
      console.error('[NTH] ✗ Ошибка при пересборке HTML:', error);
    }
  });

  // Вотчер для изображений и других ассетов
  const assetsWatcher = chokidar.watch([
    path.join(srcPath, 'img/**/*'),
    path.join(srcPath, 'fonts/**/*'),
    path.join(srcPath, 'blocks/**/img/**/*')
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  assetsWatcher.on('all', async (event, filePath) => {
    console.log(`\n[NTH] Ассет изменен: ${path.basename(filePath)} (${event})`);
    try {
      await buildAssets({ mode });
      bs.reload();
    } catch (error) {
      console.error('[NTH] ✗ Ошибка при копировании ассетов:', error);
    }
  });

  // Вотчер для SVG спрайта
  const spriteWatcher = chokidar.watch([
    path.join(srcPath, 'blocks/sprite-svg/svg/**/*.svg')
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  spriteWatcher.on('all', async (event, filePath) => {
    console.log(`\n[NTH] SVG спрайт изменен: ${path.basename(filePath)} (${event})`);
    try {
      await buildSvgSprite({ mode });
      bs.reload();
    } catch (error) {
      console.error('[NTH] ✗ Ошибка при сборке SVG-спрайта:', error);
    }
  });

  // Вотчер для projectConfig.json (требует полной пересборки)
  const configWatcher = chokidar.watch([
    path.join(__dirname, '..', 'projectConfig.json')
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  configWatcher.on('all', async (event) => {
    console.log(`\n[NTH] projectConfig.json изменен (${event}), выполняется полная пересборка...`);
    try {
      await build({ mode });
      bs.reload();
    } catch (error) {
      console.error('[NTH] ✗ Ошибка при полной пересборке:', error);
    }
  });

  // TODO: Добавить debounce для множественных изменений
  // TODO: Добавить более умную логику пересборки (инкрементальная сборка)
}

// Запуск dev-сервера
if (import.meta.url === `file://${process.argv[1]}`) {
  startDevServer().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { startDevServer };

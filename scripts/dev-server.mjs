import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import chokidar from 'chokidar';
import browserSync from 'browser-sync';
import { build } from './build.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { buildHtml } from './html.mjs';
import { copyAssets } from './assets.mjs';
import { buildSvgSprite } from './sprite-svg.mjs';
import { generateStyleEntry } from './generateStyle.mjs';
import { lintHtml } from './lintHtml.mjs';
import { logInfo, logError } from './logger.mjs';

/**
 * Dev-сервер:
 * - выполняет полную сборку в dev-режиме;
 * - поднимает browser-sync на папку build/;
 * - вешает вотчеры на все файлы в src/ и дергает соответствующие задачи.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');
const projectConfigPath = path.join(rootDir, 'projectConfig.json');

// Общие опции для вотчеров: снижают частоту ложных EBUSY на Windows,
// дожидаясь, пока файл перестанет меняться, прежде чем эмитить событие.
const watchOptions = {
  ignoreInitial: true,
  ignored: '**/scss/style.scss',
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 50,
  },
};

export async function devServer() {
  logInfo('[dev-server] Старт dev-сервера');

  // 1. начальная сборка
  await build({ mode: 'development' });

  // 2. старт browser-sync
  const bs = browserSync.create();
  bs.init({
    server: {
      baseDir: buildDir,
      middleware: [
        (req, res, next) => {
          const hasExt = path.extname(req.url.split('?')[0]) !== '';
          if (hasExt || req.url === '/') {
            return next();
          }

          const htmlPath = path.join(buildDir, req.url.split('?')[0] + '.html');
          if (existsSync(htmlPath)) {
            req.url = req.url.split('?')[0] + '.html';
          }

          next();
        },
      ],
    },
    files: [`${buildDir}/**/*`],
    ignore: ['**/*.map'],
    open: true,
    notify: false,
  });

  // 3. вотчеры

  // Нормализуем путь к файлу для кроссплатформенного сравнения (Windows backslash → slash)
  const normPath = (p) => p.replace(/\\/g, '/');

  // Защита от параллельных запусков
  let isRebuilding = false;
  let pendingRebuild = false;

  const rebuildAllDev = async () => {
    await generateStyleEntry();
    await buildStyles({ mode: 'development' });
    await buildScripts({ mode: 'development' });
    await copyAssets();
    await buildHtml();
    // lintHtml();
    // await lintHtml();
  };

  // Вотчер для projectConfig.json
  const configWatcher = chokidar.watch(projectConfigPath, watchOptions);

  // Без этого обработчика ошибка EBUSY (и любая другая ошибка FSWatcher)
  // валит весь Node-процесс, так как Node кидает необработанное исключение
  // при 'error' событии без слушателя.
  configWatcher.on('error', (err) => {
    logError('[dev-server] Ошибка configWatcher: ' + err.message);
  });

  /*configWatcher.on('change', async () => {
    if (isRebuilding) return;
    isRebuilding = true;
    logInfo('[dev-server] projectConfig.json изменён — пересборка (без clean)');
    try {
      await rebuildAllDev();
    } catch (err) {
      logError('[dev-server] Ошибка пересборки: ' + err.message);
    } finally {
      isRebuilding = false;
    }
  });*/

  configWatcher.on('change', async () => {
    if (isRebuilding) return;
    isRebuilding = true;
    logInfo('[dev-server] projectConfig.json изменён — пересборка (без clean)');
    try {
      await rebuildAllDev();
    } catch (err) {
      logError('[dev-server] Ошибка пересборки: ' + err.message);
    } finally {
      isRebuilding = false;

      if (pendingRebuild) {
        pendingRebuild = false;
        logInfo('[dev-server] Во время пересборки конфига были пропущены изменения — пересобираем всё');
        try {
          await rebuildAllDev();
        } catch (err) {
          logError('[dev-server] Ошибка отложенной пересборки: ' + err.message);
        }
      }
    }
  });

  // Вотчер для src/
  const watcher = chokidar.watch(srcDir, watchOptions);

  // Та же защита: ловим EBUSY и прочие ошибки вотчера, не давая им
  // уронить весь dev-сервер.
  watcher.on('error', (err) => {
    logError('[dev-server] Ошибка watcher (src): ' + err.message);
  });

  watcher.on('all', async (event, filePath) => {
    if (isRebuilding) {
      // Сборка уже идёт — не теряем событие, а откладываем полную пересборку на потом
      pendingRebuild = true;
      return;
    }
    await runRebuildCycle(event, filePath);
  });

  async function runRebuildCycle(event, filePath) {
    isRebuilding = true;

    const rel = normPath(path.relative(srcDir, filePath));
    logInfo(`[dev-server] Изменение: ${event} ${rel}`);

    try {
      if (/^blocks\/sprite-svg\/svg\/[^/]+\.svg$/i.test(rel)) {
        await buildSvgSprite();
      } else if (rel.endsWith('.scss')) {
        // if (rel !== 'scss/style.scss') {
        //   await generateStyleEntry();
        // }
        // The include list in style.scss depends only on projectConfig.json (see config.mjs),
        // which has its own watcher (configWatcher) that regenerates style.scss when needed.
        // No need to regenerate it here on every block-scss edit.
        await buildStyles({ mode: 'development' });
      } else if (rel.endsWith('.js')) {
        await buildScripts({ mode: 'development' });
      } else if (rel.endsWith('.html')) {
        await buildHtml();
        // lintHtml();
        // await lintHtml();
      } else if (
        rel.startsWith('img/') ||
        rel.startsWith('fonts/') ||
        /^blocks\/[^/]+\/img\//.test(rel) ||
        /^blocks\/[^/]+\/video\//.test(rel)
      ) {
        await copyAssets();
      } else {
        await rebuildAllDev();
      }
    } catch (err) {
      logError('[dev-server] Ошибка: ' + err.message);
    } finally {
      isRebuilding = false;

      if (pendingRebuild) {
        pendingRebuild = false;
        logInfo('[dev-server] Во время сборки были пропущены изменения — пересобираем всё');
        try {
          await rebuildAllDev();
        } catch (err) {
          logError('[dev-server] Ошибка отложенной пересборки: ' + err.message);
        }
      }
    }
  }
}

// --- Автозапуск при прямом запуске файла ---
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  devServer().catch((err) => {
    logError('[dev-server] Ошибка dev-сервера: ' + err.message);
    process.exitCode = 1;
  });
}

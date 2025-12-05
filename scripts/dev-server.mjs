import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';
import browserSync from 'browser-sync';
import { build } from './build.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { buildHtml } from './html.mjs';
import { copyAssets } from './assets.mjs';

/**
 * Dev-сервер:
 * - выполняет полную сборку в dev-режиме;
 * - поднимает browser-sync на папку build/;
 * - вешает вотчеры на src/**/* и дергает соответствующие задачи.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');

export async function devServer() {
  // 1. начальная сборка
  await build({ mode: 'development' });

  // 2. старт browser-sync
  const bs = browserSync.create();
  bs.init({
    server: buildDir,
    files: [`${buildDir}/**/*`],
    open: true,
    notify: false,
  });

  // 3. вотчеры
  const watcher = chokidar.watch(srcDir, {
    ignoreInitial: true,
  });

  watcher.on('all', async (event, filePath) => {
    const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');
    console.log(`[dev-server] Изменение: ${event} ${rel}`);

    try {
      if (rel.endsWith('.scss')) {
        await buildStyles({ mode: 'development' });
      } else if (rel.endsWith('.js')) {
        await buildScripts({ mode: 'development' });
      } else if (rel.endsWith('.html')) {
        await buildHtml();
      } else if (rel.startsWith('img/') || rel.startsWith('fonts/')) {
        await copyAssets();
      } else {
        // TODO: при необходимости добавить более точную маршрутизацию
        await build({ mode: 'development' });
      }
    } catch (err) {
      console.error('[dev-server] Ошибка при обработке изменения:', err);
    }
  });
}

if (import.meta.url === `file://${import.meta.url}`) {
  devServer().catch((err) => {
    console.error('[dev-server] Ошибка dev-сервера:', err);
    process.exitCode = 1;
  });
}
import { cleanBuild } from './clean.mjs';
import { generateStyleEntry } from './generateStyle.mjs';
import { buildSvgSprite } from './sprite-svg.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { copyAssets } from './assets.mjs';
import { buildHtml } from './html.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Оркестратор сборки.
 * Последовательность (пока без параллелизма, для простоты отладки):
 * 1) clean
 * 2) generateStyle
 * 3) sprite-svg
 * 4) styles
 * 5) scripts
 * 6) assets
 * 7) html
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function build({ mode = 'development' } = {}) {
  console.log('[build] ВХОД в функцию build (debug)');
  console.log(`[build] Старт полной сборки в режиме "${mode}"`);

  await cleanBuild();
  await generateStyleEntry();
  await buildSvgSprite();
  await buildStyles({ mode });
  await buildScripts({ mode });
  await copyAssets();
  await buildHtml();

  console.log('[build] ВЫХОД из функции build (debug)');
  console.log('[build] Сборка завершена');
}

// Позволяем запускать модуль напрямую: `node scripts/build.mjs`
// Используем надёжную проверку, совместимую с Windows и POSIX
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  const mode = process.env.NODE_ENV || 'development';
  build({ mode }).catch((err) => {
    console.error('[build] Ошибка сборки:', err);
    process.exitCode = 1;
  });
}
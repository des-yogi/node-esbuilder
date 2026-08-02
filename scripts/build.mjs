import { cleanBuild } from './clean.mjs';
import { generateStyleEntry } from './generateStyle.mjs';
import { buildSvgSprite } from './sprite-svg.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { copyAssets } from './assets.mjs';
import { buildHtml } from './html.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { logInfo, logError } from './logger.mjs';

/**
 * Оркестратор сборки.
 * Последовательность:
 * 1) clean
 * 2) generateStyle
 * 3) styles
 * 4) scripts
 * 5) assets
 * 6) sprite-svg — после assets, чтобы не перезаписать свежий спрайт
 * 7) html
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function build({ mode = 'development' } = {}) {
  logInfo(`[build] Старт полной сборки в режиме "${mode}"`);

  await cleanBuild();
  await generateStyleEntry();
  await buildStyles({ mode });
  await buildScripts({ mode });
  await copyAssets();
  await buildSvgSprite();  // после copyAssets, чтобы не перезаписать свежий спрайт
  await buildHtml({ mode });

  logInfo('[build] Сборка завершена');
}

// Позволяем запускать модуль напрямую: `node scripts/build.mjs`
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  const mode = process.env.NODE_ENV || 'development';
  build({ mode }).catch((err) => {
    logError('[build] Ошибка сборки: ' + err.message);
    process.exitCode = 1;
  });
}

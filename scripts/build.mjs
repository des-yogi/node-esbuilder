import { cleanBuild } from './clean.mjs';
import { generateStyleEntry } from './generateStyle.mjs';
import { buildSvgSprite } from './sprite-svg.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { copyAssets } from './assets.mjs';
import { buildHtml } from './html.mjs';

/**
 * Оркестратор сборки.
 * Последовательность (пока без параллелизма, для простоты отладки):
 * 1) clean
 * 2) generateStyle (после реализации getFilesList)
 * 3) sprite-svg
 * 4) styles
 * 5) scripts
 * 6) assets
 * 7) html
 */

export async function build({ mode = 'development' } = {}) {
  console.log(`[build] Старт полной сборки в режиме "${mode}"`);

  await cleanBuild();
  await generateStyleEntry();
  await buildSvgSprite();
  await buildStyles({ mode });
  await buildScripts({ mode });
  await copyAssets();
  await buildHtml();

  console.log('[build] Сборка завершена');
}

if (import.meta.url === `file://${import.meta.url}`) {
  const mode = process.env.NODE_ENV || 'development';
  build({ mode }).catch((err) => {
    console.error('[build] Ошибка сборки:', err);
    process.exitCode = 1;
  });
}
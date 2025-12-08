import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import esbuild from 'esbuild';
import { getFilesList } from './config.mjs';

/**
 * Модуль для сборки JavaScript через esbuild.
 *
 * Задачи:
 * - собрать список файлов на основе projectConfig.json и getFilesList();
 * - гарантировать порядок: js.before → js.blocks → js.after;
 * - передать их в esbuild и получить единый бандл build/js/script.js.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'build', 'js');
const outFile = path.join(outDir, 'script.js');

export async function buildScripts({ mode = 'development' } = {}) {
  console.log(`[scripts] Запуск сборки скриптов в режиме "${mode}"`);

  const { js } = await getFilesList();

  const before = Array.isArray(js?.before) ? js.before : [];
  const blocks = Array.isArray(js?.blocks) ? js.blocks : [];
  const after = Array.isArray(js?.after) ? js.after : [];

  // Итоговый список в нужном порядке (относительно корня src/)
  const orderedJs = [...before, ...blocks, ...after];

  // Если списки пусты — fallback на src/js/index.js
  const entryPoints = orderedJs.length ? orderedJs.map((rel) => path.join(rootDir, rel)) : [path.join(rootDir, 'src/js/index.js')];

  // Убедимся, что выходная директория существует
  await mkdir(outDir, { recursive: true });

  try {
    await esbuild.build({
      entryPoints,
      bundle: true,
      outfile: outFile,               // один общий бандл
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      target: ['es2019'],
      format: 'iife',
    });

    console.log(`[scripts] Скрипты собраны: ${path.relative(rootDir, outFile)}`);
  } catch (err) {
    console.error('[scripts] Ошибка сборки скриптов:', err);
    throw err;
  }
}

// Позволяем запускать модуль напрямую
if (import.meta.url === `file://${__filename}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildScripts({ mode }).catch((err) => {
    console.error('[scripts] Ошибка сборки скриптов:', err);
    process.exitCode = 1;
  });
}
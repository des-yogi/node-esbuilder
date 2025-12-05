import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { getFilesList } from './config.mjs';

/**
 * Модуль для сборки JavaScript через esbuild.
 *
 * Задачи:
 * - собрать список файлов на основе lists.js + addJsBefore/addJsAfter (см. projectConfig.json и getFilesList);
 * - передать их в esbuild как entryPoints или через виртуальный entry-файл;
 * - получить build/js/script.min.js.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'build', 'js');
const outFile = path.join(outDir, 'script.js');

export async function buildScripts({ mode = 'development' } = {}) {
  console.log(`[scripts] Запуск сборки скриптов в режиме "${mode}"`);

  const { js } = await getFilesList();

  // TODO: вместо этого — реальная логика формирования entryPoints,
  // учитывая addJsBefore/addJsAfter и блоки.
  const entryPoints = js.length ? js.map((p) => path.join(rootDir, 'src', p)) : [];

  await esbuild.build({
    entryPoints: entryPoints.length ? entryPoints : ['src/js/index.js'], // TODO: убрать захардкоженный путь
    bundle: true,
    outfile: outFile,
    format: 'iife', // можно потом сделать configurable
    sourcemap: mode !== 'production',
    minify: mode === 'production',
    target: ['es2019'],
  });

  console.log(`[scripts] Скрипты собраны: ${path.relative(rootDir, outFile)}`);
}

if (import.meta.url === `file://${__filename}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildScripts({ mode }).catch((err) => {
    console.error('[scripts] Ошибка сборки скриптов:', err);
    process.exitCode = 1;
  });
}
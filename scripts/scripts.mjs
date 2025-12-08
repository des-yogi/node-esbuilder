import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile } from 'node:fs/promises';
import { getFilesList } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const buildJsDir = path.join(buildDir, 'js');

/**
 * Сборка JS:
 * - собирает единый бандл build/js/script.js из before + blocks + after;
 * - копирует "сырые" JS-файлы из js.copied в build/js (плоско, по имени файла);
 * - режимы development / production задают sourcemap, minify и process.env.NODE_ENV.
 */

export async function buildScripts({ mode = 'development' } = {}) {
  console.log(`[scripts] Запуск сборки скриптов в режиме "${mode}"`);

  const isProd = mode === 'production';

  const { js } = await getFilesList();
  const { before, blocks, after, copied } = js;

  // 1. Собираем список для бандла
  const entryPoints = [...before, ...blocks, ...after];

  if (entryPoints.length === 0) {
    // Fallback: если ничего не нашли, попробуем src/js/index.js
    const fallback = path.join(rootDir, 'src', 'js', 'index.js');
    entryPoints.push(fallback);
  }

  // Убедимся, что каталог для JS существует
  await mkdir(buildJsDir, { recursive: true });

  // 2. Сборка бандла через esbuild
  await esbuild.build({
    entryPoints,
    bundle: true,
    outfile: path.join(buildJsDir, 'script.js'),
    format: 'iife',
    target: ['es2019'],
    sourcemap: !isProd,
    minify: isProd,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  });

  console.log('[scripts] Скрипты собраны: build/js/script.js');

  // 3. Копирование "сырых" JS-файлов (copiedJs)
  if (copied && copied.length > 0) {
    console.log('[scripts] Копирование JS-файлов без сборки (copiedJs)');
    for (const srcPath of copied) {
      // Берём только имя файла (плоская схема)
      const fileName = path.basename(srcPath);
      const destPath = path.join(buildJsDir, fileName);

      try {
        await copyFile(srcPath, destPath);
        console.log('[scripts] Копирован JS:', path.relative(rootDir, destPath));
      } catch (err) {
        console.error(
          `[scripts] Не удалось скопировать JS "${srcPath}" → "${destPath}":`,
          err,
        );
      }
    }
  }
}

// Позволяем запускать модуль напрямую: `node scripts/scripts.mjs`
if (import.meta.url === `file://${__filename}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildScripts({ mode }).catch((err) => {
    console.error('[scripts] Ошибка сборки скриптов:', err);
    process.exitCode = 1;
  });
}
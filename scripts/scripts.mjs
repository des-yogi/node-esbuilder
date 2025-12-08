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
 * - собирает единый бандл build/js/script.min.js (в dev — не минифицированный + карта, в prod — минифицированный без карты)
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

  // Всегда гарантируем, что наша точка входа src/js/index.js включена первой,
  // чтобы глобальные скрипты (applyJsClass, vh fix и т.д.) выполнялись.
  const fallback = path.join(rootDir, 'src', 'js', 'index.js');
  if (!entryPoints.includes(fallback)) {
    entryPoints.unshift(fallback);
  }

  // Убедимся, что каталог для JS существует
  await mkdir(buildJsDir, { recursive: true });

  // 2. Сборка бандла через esbuild
  const outFile = path.join(buildJsDir, 'script.min.js'); // canonical output name

  await esbuild.build({
    entryPoints,
    bundle: true,
    outfile: outFile,
    format: 'iife',
    target: ['es2019'],
    sourcemap: !isProd, // dev: true (external .map), prod: false
    minify: isProd, // dev: false, prod: true
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  });

  console.log('[scripts] Скрипты собраны:', path.relative(rootDir, outFile));
  if (!isProd) {
    const mapPath = `${outFile}.map`;
    console.log('[scripts] Sourcemap (dev) ожидаем здесь:', path.relative(rootDir, mapPath));
  }

  // 3. Копирование "сырых" JS-файлов (copiedJs)
  if (copied && copied.length > 0) {
    console.log('[scripts] Копирование JS-файлов без сборки (copiedJs)');
    for (let srcPath of copied) {
      // если путь относительный — считаем от корня проекта
      if (!path.isAbsolute(srcPath)) {
        srcPath = path.join(rootDir, srcPath);
      }

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
// Используем надёжную проверку, совместимую с Windows и POSIX
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  const mode = process.env.NODE_ENV || 'development';
  buildScripts({ mode }).catch((err) => {
    console.error('[scripts] Ошибка сборки скриптов:', err);
    process.exitCode = 1;
  });
}
import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile, access } from 'node:fs/promises';
import { getFilesList } from './config.mjs';
import { logInfo, logError } from './logger.mjs';

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
  logInfo(`[scripts] Запуск сборки скриптов в режиме "${mode}"`);

  const isProd = mode === 'production';

  const { js } = await getFilesList();
  const { before, blocks, after, copied } = js;

  // 1. Фильтруем блоковые JS-файлы: включаем только существующие
  const existingBlocks = (
    await Promise.all(
      blocks.map(async (filePath) => {
        const absPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(rootDir, filePath);
        try {
          await access(absPath);
          return absPath;
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean);

  // Собираем полный список файлов (before/after — пути из конфига, уже относительные)
  const resolveList = (list) =>
    list.map((p) => (path.isAbsolute(p) ? p : path.join(rootDir, p)));

  const allFiles = [
    ...resolveList(before),
    ...existingBlocks,
    ...resolveList(after),
  ];

  // Всегда гарантируем, что наша точка входа src/js/index.js включена первой,
  // чтобы глобальные скрипты (applyJsClass, vh fix и т.д.) выполнялись.
  const fallback = path.join(rootDir, 'src', 'js', 'index.js');
  if (!allFiles.includes(fallback)) {
    allFiles.unshift(fallback);
  }

  // Убедимся, что каталог для JS существует
  await mkdir(buildJsDir, { recursive: true });

  // 2. Сборка бандла через esbuild.
  // Используем виртуальный stdin, чтобы объединить несколько файлов в один IIFE-бандл.
  const outFile = path.join(buildJsDir, 'script.min.js');
  const stdinContent = allFiles.map((f) => `import ${JSON.stringify(f)};`).join('\n');

  await esbuild.build({
    stdin: {
      contents: stdinContent,
      resolveDir: rootDir,
    },
    bundle: true,
    outfile: outFile,
    format: 'iife',
    target: ['es2020'],
    sourcemap: !isProd,
    minify: isProd,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  });

  logInfo('[scripts] Скрипты собраны: ' + path.relative(rootDir, outFile));

  // 3. Копирование "сырых" JS-файлов (copiedJs)
  if (copied && copied.length > 0) {
    logInfo('[scripts] Копирование JS-файлов без сборки (copiedJs)');
    for (let srcPath of copied) {
      if (!path.isAbsolute(srcPath)) {
        srcPath = path.join(rootDir, srcPath);
      }

      const fileName = path.basename(srcPath);
      const destPath = path.join(buildJsDir, fileName);

      try {
        await copyFile(srcPath, destPath);
        logInfo('[scripts] Копирован JS: ' + path.relative(rootDir, destPath));
      } catch (err) {
        logError(
          `[scripts] Не удалось скопировать JS "${srcPath}" → "${destPath}": ${err.message}`,
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
    logError('[scripts] Ошибка сборки скриптов: ' + err.message);
    process.exitCode = 1;
  });
}

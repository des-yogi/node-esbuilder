import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile } from 'node:fs/promises';
import { getFilesList } from './config.mjs';

/**
 * Копирование ассетов:
 * - картинки (img) → build/img/<имя_файла>  (плоская структура)
 * - видео (video) → build/video/<имя_файла> (плоская структура)
 * - при необходимости сюда же можно добавить шрифты и прочие файлы.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const buildDir = path.join(rootDir, 'build');
const buildImgDir = path.join(buildDir, 'img');
const buildVideoDir = path.join(buildDir, 'video');

async function copyFlat(files, destDir, label) {
  if (!files || files.length === 0) {
    console.log(`[assets] Нет файлов для копирования (${label}), пропускаем`);
    return;
  }

  await mkdir(destDir, { recursive: true });

  for (const srcPath of files) {
    const fileName = path.basename(srcPath);
    const destPath = path.join(destDir, fileName);

    try {
      await copyFile(srcPath, destPath);
      console.log(
        `[assets] Копирован ${label}:`,
        path.relative(rootDir, destPath),
      );
    } catch (err) {
      console.error(
        `[assets] Не удалось скопировать ${label} "${srcPath}" → "${destPath}":`,
        err,
      );
    }
  }
}

export async function copyAssets() {
  console.log('[assets] Копирование ассетов (без оптимизации)');

  const { img, video } = await getFilesList();

  // Картинки → build/img
  await copyFlat(img, buildImgDir, 'изображение');

  // Видео → build/video
  await copyFlat(video, buildVideoDir, 'видео');

  console.log('[assets] Копирование ассетов завершено');
}

// Позволяем запускать модуль напрямую: `node scripts/assets.mjs`
if (import.meta.url === `file://${__filename}`) {
  copyAssets().catch((err) => {
    console.error('[assets] Ошибка копирования ассетов:', err);
    process.exitCode = 1;
  });
}
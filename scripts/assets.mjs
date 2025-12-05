/**
 * assets.mjs
 * 
 * Задача копирования статических ресурсов (ассетов) в папку build.
 * 
 * Копируемые ресурсы:
 * 1. Шрифты: src/fonts/** → build/fonts/
 * 2. Изображения:
 *    - src/img/** → build/img/
 *    - src/blocks/*\/img/** → build/img/ (с сохранением имен файлов)
 * 3. Видео (опционально): src/video/** → build/video/
 * 4. Дополнительные ресурсы из projectConfig.addImages
 * 
 * TODO: На следующих этапах добавить:
 * - Оптимизацию изображений (jpeg, png, gif, svg)
 * - Генерацию WebP и AVIF версий
 * - Обработку SVG (минификация, sprite)
 * - Использовать fast-glob/globby для эффективного поиска файлов
 * 
 * Пока используем fs/promises и рекурсивное копирование.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Рекурсивно копирует директорию
 * 
 * @param {string} src - исходная директория
 * @param {string} dest - целевая директория
 */
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Проверяет существование директории
 * 
 * @param {string} dirPath - путь к директории
 * @returns {Promise<boolean>}
 */
async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Копирует статические ресурсы в build
 * 
 * @param {Object} options - опции копирования
 * @param {string} options.mode - режим сборки: 'development' | 'production'
 */
export async function buildAssets({ mode = 'development' } = {}) {
  console.log(`[NTH] Копирование ассетов (режим: ${mode})...`);

  const dirs = projectConfig.dirs;
  const srcDir = path.join(__dirname, '..', dirs.srcPath);
  const buildDir = path.join(__dirname, '..', dirs.buildPath);

  try {
    // 1. Копируем шрифты
    const fontsDir = path.join(srcDir, 'fonts');
    if (await dirExists(fontsDir)) {
      console.log('[NTH] Копирование шрифтов...');
      const destFonts = path.join(buildDir, 'fonts');
      await copyDir(fontsDir, destFonts);
      console.log('[NTH] ✓ Шрифты скопированы');
    }

    // 2. Копируем изображения из src/img
    const imgDir = path.join(srcDir, 'img');
    if (await dirExists(imgDir)) {
      console.log('[NTH] Копирование изображений из src/img...');
      const destImg = path.join(buildDir, 'img');
      await copyDir(imgDir, destImg);
      console.log('[NTH] ✓ Изображения из src/img скопированы');
    }

    // 3. Копируем изображения из блоков
    // TODO: Использовать fast-glob для поиска всех img директорий в блоках
    // const blockImgDirs = await glob('src/blocks/**/img');
    // Пока используем простой подход через getFilesList
    console.log('[NTH] TODO: Копирование изображений из блоков');
    // const lists = getFilesList();
    // for (const imgPath of lists.img) {
    //   // Копируем содержимое каждой img директории в build/img
    // }

    // 4. Копируем видео (если есть)
    const videoDir = path.join(srcDir, 'video');
    if (await dirExists(videoDir)) {
      console.log('[NTH] Копирование видео...');
      const destVideo = path.join(buildDir, 'video');
      await copyDir(videoDir, destVideo);
      console.log('[NTH] ✓ Видео скопировано');
    }

    // TODO: Обработать projectConfig.addImages
    // TODO: Добавить оптимизацию изображений для production
    // TODO: Добавить генерацию WebP/AVIF версий
    // TODO: Добавить обработку SVG (минификация)

    console.log('[NTH] ✓ Ассеты скопированы');

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при копировании ассетов:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildAssets({ mode }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

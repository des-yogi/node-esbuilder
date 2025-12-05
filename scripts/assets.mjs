/**
 * Модуль для копирования ассетов (без оптимизации):
 * - шрифты: src/fonts/* → build/fonts/;
 * - изображения: src/img/... и src/blocks/.../img/... → build/img/;
 *   (имеется в виду рекурсивное копирование всех файлов в этих каталогах)
 * - опционально: видео.
 *
 * На первом этапе можно сделать простой рекурсивный cp для основных папок,
 * а потом заменить/расширить через glob-паттерны.
 */
import { mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');

export async function copyAssets() {
  console.log('[assets] Копирование ассетов (без оптимизации)');

  // Шрифты
  const srcFonts = path.join(srcDir, 'fonts');
  const destFonts = path.join(buildDir, 'fonts');
  await mkdir(destFonts, { recursive: true });
  await safeCopy(srcFonts, destFonts);

  // Картинки (общая папка)
  const srcImg = path.join(srcDir, 'img');
  const destImg = path.join(buildDir, 'img');
  await mkdir(destImg, { recursive: true });
  await safeCopy(srcImg, destImg);

  // TODO: добавить копирование изображений из src/blocks/<block>/img/*
  // Можно будет использовать fast-glob, когда будем готовы добавить зависимость.

  console.log('[assets] Копирование ассетов завершено');
}

async function safeCopy(from, to) {
  // cp в Node 16+ поддерживает рекурсивное копирование
  await cp(from, to, { recursive: true, force: true });
}

if (import.meta.url === `file://${import.meta.url}`) {
  copyAssets().catch((err) => {
    console.error('[assets] Ошибка копирования ассетов:', err);
    process.exitCode = 1;
  });
}
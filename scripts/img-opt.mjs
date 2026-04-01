/**
 * Оптимизация и конвертация изображений.
 *
 * Использование:
 *   node scripts/img-opt.mjs <входная папка> <выходная папка>
 *
 * Примеры:
 * # Из папки design (рядом с src/) → в src/img (готовое для сборки)
 * npm run img:opt -- design/raw-photos src/img
 *
 * # Из design в design (просто сконвертировать, не трогая src)
 * npm run img:opt -- design/originals design/optimized
 *
 * # Конкретная подпапка
 * npm run img:opt -- design/hero-section src/blocks/hero/img
 *
 * # Абсолютные пути тоже работают
 * npm run img:opt -- D:/projects/assets/photos src/img
 *
 * Что делает:
 *   1) Копирует оптимизированный оригинал (jpg→jpg, png→png) в выходную папку
 *   2) Создаёт .webp-версию
 *   3) Создаёт .avif-версию
 *   4) SVG, ICO, GIF — копирует без изменений
 *
 * Структура выходной папки повторяет входную!
 */

import path from 'node:path';
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import sharp from 'sharp';
import { logInfo, logSuccess, logWarn, logError } from './logger.mjs';

// ─── Настройки качества ──────────────────────────────────────────────────────
const QUALITY = {
  jpeg: 75,
  png: 75,
  webp: 75,
  avif: 60,
};

// Расширения, которые можно оптимизировать и конвертировать
const CONVERTIBLE = ['jpg', 'jpeg', 'png'];

// Расширения, которые просто копируются без обработки
const COPY_ONLY = ['svg', 'ico', 'gif'];

// ─── Обработка одного файла ──────────────────────────────────────────────────

async function processFile(srcPath, destDir, fileName) {
  var ext = path.extname(fileName).slice(1).toLowerCase();
  var baseName = path.basename(fileName, path.extname(fileName));

  // SVG, ICO, GIF — просто копируем
  if (COPY_ONLY.indexOf(ext) !== -1) {
    await copyFile(srcPath, path.join(destDir, fileName));
    logInfo('[img-opt] Скопирован без изменений: ' + fileName);
    return { optimized: 0, webp: 0, avif: 0, copied: 1, skipped: 0 };
  }

  // Не конвертируемый формат — пропускаем
  if (CONVERTIBLE.indexOf(ext) === -1) {
    logWarn('[img-opt] Пропущен (неизвестный формат): ' + fileName);
    return { optimized: 0, webp: 0, avif: 0, copied: 0, skipped: 1 };
  }

  var result = { optimized: 0, webp: 0, avif: 0, copied: 0, skipped: 0 };
  var pipeline = sharp(srcPath);

  // 1. Оптимизированный оригинал
  try {
    var destOriginal = path.join(destDir, fileName);
    if (ext === 'jpg' || ext === 'jpeg') {
      await pipeline.clone().jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toFile(destOriginal);
    } else if (ext === 'png') {
      await pipeline.clone().png({ quality: QUALITY.png, effort: 8 }).toFile(destOriginal);
    }
    logInfo('[img-opt] Оптимизирован: ' + fileName);
    result.optimized = 1;
  } catch (err) {
    logError('[img-opt] Ошибка оптимизации ' + fileName + ': ' + err.message);
  }

  // 2. WebP
  try {
    var destWebp = path.join(destDir, baseName + '.webp');
    await pipeline.clone().webp({ quality: QUALITY.webp }).toFile(destWebp);
    logInfo('[img-opt] Создан WebP: ' + baseName + '.webp');
    result.webp = 1;
  } catch (err) {
    logError('[img-opt] Ошибка WebP для ' + fileName + ': ' + err.message);
  }

  // 3. AVIF
  try {
    var destAvif = path.join(destDir, baseName + '.avif');
    await pipeline.clone().avif({ quality: QUALITY.avif }).toFile(destAvif);
    logInfo('[img-opt] Создан AVIF: ' + baseName + '.avif');
    result.avif = 1;
  } catch (err) {
    logError('[img-opt] Ошибка AVIF для ' + fileName + ': ' + err.message);
  }

  return result;
}

// ─── Рекурсивный обход папки ─────────────────────────────────────────────────

async function processDir(srcDir, destDir) {
  var totals = { optimized: 0, webp: 0, avif: 0, copied: 0, skipped: 0 };

  var entries;
  try {
    entries = await readdir(srcDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') {
      logError('[img-opt] Папка не найдена: ' + srcDir);
      return totals;
    }
    throw err;
  }

  await mkdir(destDir, { recursive: true });

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var srcPath = path.join(srcDir, entry.name);
    var destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      var sub = await processDir(srcPath, destPath);
      totals.optimized += sub.optimized;
      totals.webp += sub.webp;
      totals.avif += sub.avif;
      totals.copied += sub.copied;
      totals.skipped += sub.skipped;
    } else if (entry.isFile()) {
      var res = await processFile(srcPath, destDir, entry.name);
      totals.optimized += res.optimized;
      totals.webp += res.webp;
      totals.avif += res.avif;
      totals.copied += res.copied;
      totals.skipped += res.skipped;
    }
  }

  return totals;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

var inputDir = process.argv[2];
var outputDir = process.argv[3];

if (!inputDir || !outputDir) {
  logError('[img-opt] Использование: node scripts/img-opt.mjs <входная папка> <выходная папка>');
  logError('[img-opt] Пример: npm run img:opt -- src/img src/img-optimized');
  process.exit(1);
}

var absInput = path.resolve(inputDir);
var absOutput = path.resolve(outputDir);

if (absInput === absOutput) {
  logError('[img-opt] Входная и выходная папки не должны совпадать!');
  process.exit(1);
}

logInfo('[img-opt] Вход:  ' + absInput);
logInfo('[img-opt] Выход: ' + absOutput);
logInfo('[img-opt] Качество: JPEG=' + QUALITY.jpeg + '  PNG=' + QUALITY.png + '  WebP=' + QUALITY.webp + '  AVIF=' + QUALITY.avif);
logInfo('[img-opt] ─────────────────────────────────────');

processDir(absInput, absOutput)
  .then(function (totals) {
    logInfo('[img-opt] ─────────────────────────────────────');
    logSuccess('[img-opt] Готово!');
    logSuccess(
      '[img-opt] Оптимизировано: ' + totals.optimized +
      '  WebP: ' + totals.webp +
      '  AVIF: ' + totals.avif +
      '  Скопировано: ' + totals.copied +
      '  Пропущено: ' + totals.skipped
    );
  })
  .catch(function (err) {
    logError('[img-opt] Фатальная ошибка: ' + err.message);
    process.exitCode = 1;
  });

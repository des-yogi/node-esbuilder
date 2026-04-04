import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, copyFile, access, stat } from 'node:fs/promises';
import { getFilesList } from './config.mjs';
import { logInfo, logWarn, logError } from './logger.mjs';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var rootDir = path.resolve(__dirname, '..');

var srcDir = path.join(rootDir, 'src');
var buildDir = path.join(rootDir, 'build');

/**
 * Проверяет, разрешено ли расширение файла.
 * Если allowedExts = null или пустой массив — разрешено всё.
 */
function isExtAllowed(fileName, allowedExts) {
  if (!allowedExts || allowedExts.length === 0) return true;
  var ext = path.extname(fileName).slice(1).toLowerCase();
  return allowedExts.indexOf(ext) !== -1;
}

/**
 * Проверяет, новее ли исходный файл, чем целевой.
 * Если dest не существует — возвращает true (нужно копировать).
 */
async function isNewer(srcPath, destPath) {
  try {
    var srcStat = await stat(srcPath);
    var destStat = await stat(destPath);
    return srcStat.mtimeMs > destStat.mtimeMs;
  } catch (err) {
    if (err.code === 'ENOENT') return true;
    throw err;
  }
}

/**
 * Рекурсивно копирует srcRoot → destRoot.
 * - allowedExts — белый список расширений или null (всё)
 * - Копирует только изменённые файлы (isNewer)
 */
async function copyDirRecursive(srcRoot, destRoot, label, allowedExts) {
  try {
    var entries = await readdir(srcRoot, { withFileTypes: true });

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var srcPath = path.join(srcRoot, entry.name);
      var destPath = path.join(destRoot, entry.name);

      if (entry.isDirectory()) {
        await mkdir(destPath, { recursive: true });
        await copyDirRecursive(srcPath, destPath, label, allowedExts);
      } else if (entry.isFile()) {
        if (!isExtAllowed(entry.name, allowedExts)) {
          logInfo('[assets] Пропущен ' + label + ' (расширение не в списке): ' + entry.name);
          continue;
        }
        if (!(await isNewer(srcPath, destPath))) {
          continue; // файл не изменился — пропускаем
        }
        await mkdir(path.dirname(destPath), { recursive: true });
        await copyFile(srcPath, destPath);
        logInfo('[assets] Копирован ' + label + ': ' + path.relative(rootDir, destPath));
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logWarn(
        '[assets] Папка для ' + label + ' не найдена (' + path.relative(rootDir, srcRoot) + '), пропускаем'
      );
      return;
    }
    logError(
      '[assets] Ошибка при копировании ' + label + ' из "' + path.relative(rootDir, srcRoot) +
      '" в "' + path.relative(rootDir, destRoot) + '": ' + err.message
    );
  }
}

// Генерирует уникальный путь в каталоге destDir: если fileName занят,
// то name.ext → name-1.ext, name-2.ext и т.д.
async function getUniqueDestPath(destDir, fileName) {
  var base = path.basename(fileName, path.extname(fileName));
  var ext = path.extname(fileName);

  var candidate = path.join(destDir, fileName);
  var index = 1;

  while (true) {
    try {
      await access(candidate);
      candidate = path.join(destDir, base + '-' + index + ext);
      index += 1;
    } catch (err) {
      if (err.code === 'ENOENT') {
        return candidate;
      }
      throw err;
    }
  }
}


// Копирует файлы из src/blocks/*/img/ в build/img по плоской схеме.
// Фильтрует по allowedExts. Пропускает неизменённые.

async function copyBlockImagesFlat(allowedExts) {
  var blocksRoot = path.join(srcDir, 'blocks');
  var buildImgDir = path.join(buildDir, 'img');

  try {
    var blockDirs = await readdir(blocksRoot, { withFileTypes: true });
    await mkdir(buildImgDir, { recursive: true });

    for (var d = 0; d < blockDirs.length; d++) {
      var dirent = blockDirs[d];
      if (!dirent.isDirectory()) continue;

      var blockName = dirent.name;
      var blockImgDir = path.join(blocksRoot, blockName, 'img');

      try {
        var entries = await readdir(blockImgDir, { withFileTypes: true });

        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (!entry.isFile()) continue;

          if (!isExtAllowed(entry.name, allowedExts)) {
            logInfo('[assets] Пропущен изображение блока (расширение не в списке): ' + blockName + '/img/' + entry.name);
            continue;
          }

          var srcPath = path.join(blockImgDir, entry.name);
          var destPath = path.join(buildImgDir, entry.name);

          if (!(await isNewer(srcPath, destPath))) {
            continue;
          }

          await copyFile(srcPath, destPath);
          logInfo(
            '[assets] Скопировано изображение блока: ' + blockName + '/img/' + entry.name +
            ' → ' + path.relative(rootDir, destPath)
          );
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          continue;
        }
        logError(
          '[assets] Ошибка при копировании изображений блока "' + blockName + '": ' + err.message
        );
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logWarn(
        '[assets] Каталог блоков не найден (' + path.relative(rootDir, blocksRoot) + '), изображения блоков пропускаем'
      );
      return;
    }
    logError('[assets] Ошибка при обходе блоков для img: ' + err.message);
  }
}


// Копирует файлы из src/blocks/*/video/ в build/video по плоской схеме
// с уникализацией имён. Фильтрует по allowedExts. Пропускает неизменённые.

async function copyBlockVideosFlat(allowedExts) {
  var blocksRoot = path.join(srcDir, 'blocks');
  var buildVideoDir = path.join(buildDir, 'video');

  try {
    var blockDirs = await readdir(blocksRoot, { withFileTypes: true });
    await mkdir(buildVideoDir, { recursive: true });

    for (var d = 0; d < blockDirs.length; d++) {
      var dirent = blockDirs[d];
      if (!dirent.isDirectory()) continue;

      var blockName = dirent.name;
      var blockVideoDir = path.join(blocksRoot, blockName, 'video');

      try {
        var entries = await readdir(blockVideoDir, { withFileTypes: true });

        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (!entry.isFile()) continue;

          if (!isExtAllowed(entry.name, allowedExts)) {
            logInfo('[assets] Пропущено видео блока (расширение не в списке): ' + blockName + '/video/' + entry.name);
            continue;
          }

          var srcPath = path.join(blockVideoDir, entry.name);
          var uniqueDestPath = await getUniqueDestPath(buildVideoDir, entry.name);

          // Для видео блоков isNewer проверяем по оригинальному имени
          var directDest = path.join(buildVideoDir, entry.name);
          if (!(await isNewer(srcPath, directDest))) {
            continue;
          }

          await mkdir(path.dirname(uniqueDestPath), { recursive: true });
          await copyFile(srcPath, uniqueDestPath);

          logInfo(
            '[assets] Скопирован видеофайл блока: ' + blockName + '/video/' + entry.name +
            ' → ' + path.relative(rootDir, uniqueDestPath)
          );
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          continue;
        }
        logError(
          '[assets] Ошибка при копировании видео блока "' + blockName + '": ' + err.message
        );
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logWarn(
        '[assets] Каталог блоков не найден (' + path.relative(rootDir, blocksRoot) + '), видео блоков пропускаем'
      );
      return;
    }
    logError('[assets] Ошибка при обходе блоков для видео: ' + err.message);
  }
}

export async function copyAssets() {
  logInfo('[assets] Копирование ассетов (без оптимизации)');

  // Читаем белые списки расширений из projectConfig
  var filesList = await getFilesList();
  var projectConfig = filesList.projectConfig;
  var imgExts = Array.isArray(projectConfig.allowedImageExtensions)
    ? projectConfig.allowedImageExtensions
    : null;
  var videoExts = Array.isArray(projectConfig.allowedVideoExtensions)
    ? projectConfig.allowedVideoExtensions
    : null;

  var srcFonts = path.join(srcDir, 'fonts');
  var destFonts = path.join(buildDir, 'fonts');

  var srcImg = path.join(srcDir, 'img');
  var destImg = path.join(buildDir, 'img');

  var srcVideo = path.join(srcDir, 'video');
  var destVideo = path.join(buildDir, 'video');

  // Шрифты: src/fonts/** → build/fonts/** (без фильтра расширений)
  await copyDirRecursive(srcFonts, destFonts, 'шрифт', null);

  // Глобальные картинки: src/img/** → build/img/** (с фильтром)
  await copyDirRecursive(srcImg, destImg, 'изображение', imgExts);

  // Картинки блоков: src/blocks/*/img/* → build/img/<имя файла> (с фильтром)
  await copyBlockImagesFlat(imgExts);

  // Глобальное видео: src/video/** → build/video/** (с фильтром)
  await copyDirRecursive(srcVideo, destVideo, 'видео', videoExts);

  // Видео блоков: src/blocks/*/video/* → build/video/<имя файла> (с фильтром + уникализация)
  await copyBlockVideosFlat(videoExts);

  logInfo('[assets] Копирование ассетов завершено');
}

// Автозапуск при прямом запуске файла
var isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  copyAssets().catch(function (err) {
    logError('[assets] Ошибка копирования ассетов: ' + err.message);
    process.exitCode = 1;
  });
}

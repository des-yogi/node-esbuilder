import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, copyFile, access } from 'node:fs/promises';
import { logInfo, logWarn, logError } from './logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');

// Рекурсивно копирует srcRoot → destRoot (fonts, глобальные img/video)
async function copyDirRecursive(srcRoot, destRoot, label) {
  try {
    const entries = await readdir(srcRoot, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcRoot, entry.name);
      const destPath = path.join(destRoot, entry.name);

      if (entry.isDirectory()) {
        await mkdir(destPath, { recursive: true });
        await copyDirRecursive(srcPath, destPath, label);
      } else if (entry.isFile()) {
        await mkdir(path.dirname(destPath), { recursive: true });
        await copyFile(srcPath, destPath);
        logInfo(`[assets] Копирован ${label}: ` + path.relative(rootDir, destPath));
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logWarn(
        `[assets] Папка для ${label} не найдена (${path.relative(rootDir, srcRoot)}), пропускаем`,
      );
      return;
    }
    logError(
      `[assets] Ошибка при копировании ${label} из "${path.relative(rootDir, srcRoot)}" в "${path.relative(rootDir, destRoot)}": ${err.message}`,
    );
  }
}

// Генерирует уникальный путь в каталоге destDir: если fileName занят,
// то name.ext → name-1.ext, name-2.ext и т.д.
async function getUniqueDestPath(destDir, fileName) {
  const base = path.basename(fileName, path.extname(fileName));
  const ext = path.extname(fileName);

  let candidate = path.join(destDir, fileName);
  let index = 1;

  // Проверяем, существует ли файл; если да — подбираем следующий индекс
  while (true) {
    try {
      await access(candidate);
      // файл существует — формируем следующий вариант
      candidate = path.join(destDir, `${base}-${index}${ext}`);
      index += 1;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // такого файла нет — можно использовать
        return candidate;
      }
      throw err;
    }
  }
}

// Копирует файлы из src/blocks/*/img/ в build/img по плоской схеме
async function copyBlockImagesFlat() {
  const blocksRoot = path.join(srcDir, 'blocks');
  const buildImgDir = path.join(buildDir, 'img');

  try {
    const blockDirs = await readdir(blocksRoot, { withFileTypes: true });
    await mkdir(buildImgDir, { recursive: true });

    for (const dirent of blockDirs) {
      if (!dirent.isDirectory()) continue;

      const blockName = dirent.name;
      const blockImgDir = path.join(blocksRoot, blockName, 'img');

      try {
        const entries = await readdir(blockImgDir, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isFile()) continue;

          const srcPath = path.join(blockImgDir, entry.name);
          const destPath = path.join(buildImgDir, entry.name); // плоско по имени файла

          await copyFile(srcPath, destPath);
          logInfo(
            `[assets] Копирован изображение блока: ${blockName}/img/${entry.name} → ${path.relative(rootDir, destPath)}`,
          );
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          // У блока нет папки img — нормально, пропускаем
          continue;
        }
        logError(
          `[assets] Ошибка при копировании изображений блока "${blockName}": ${err.message}`,
        );
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logWarn(
        `[assets] Каталог блоков не найден (${path.relative(rootDir, blocksRoot)}), изображения блоков пропускаем`,
      );
      return;
    }
    logError('[assets] Ошибка при обходе блоков для img: ' + err.message);
  }
}

// Копирует файлы из src/blocks/*/video/ в build/video по плоской схеме с уникализацией имён
async function copyBlockVideosFlat() {
  const blocksRoot = path.join(srcDir, 'blocks');
  const buildVideoDir = path.join(buildDir, 'video');

  try {
    const blockDirs = await readdir(blocksRoot, { withFileTypes: true });
    await mkdir(buildVideoDir, { recursive: true });

    for (const dirent of blockDirs) {
      if (!dirent.isDirectory()) continue;

      const blockName = dirent.name;
      const blockVideoDir = path.join(blocksRoot, blockName, 'video');

      try {
        const entries = await readdir(blockVideoDir, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isFile()) continue;

          const srcPath = path.join(blockVideoDir, entry.name);
          const uniqueDestPath = await getUniqueDestPath(
            buildVideoDir,
            entry.name,
          );

          await mkdir(path.dirname(uniqueDestPath), { recursive: true });
          await copyFile(srcPath, uniqueDestPath);

          logInfo(
            `[assets] Копирован видеофайл блока: ${blockName}/video/${entry.name} → ${path.relative(rootDir, uniqueDestPath)}`,
          );
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          // У блока нет папки video — нормально, пропускаем
          continue;
        }
        logError(
          `[assets] Ошибка при копировании видео блока "${blockName}": ${err.message}`,
        );
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logWarn(
        `[assets] Каталог блоков не найден (${path.relative(rootDir, blocksRoot)}), видео блоков пропускаем`,
      );
      return;
    }
    logError('[assets] Ошибка при обходе блоков для видео: ' + err.message);
  }
}

export async function copyAssets() {
  logInfo('[assets] Копирование ассетов (без оптимизации)');

  const srcFonts = path.join(srcDir, 'fonts');
  const destFonts = path.join(buildDir, 'fonts');

  const srcImg = path.join(srcDir, 'img');
  const destImg = path.join(buildDir, 'img');

  const srcVideo = path.join(srcDir, 'video');
  const destVideo = path.join(buildDir, 'video');

  // Шрифты: src/fonts/** → build/fonts/**
  await copyDirRecursive(srcFonts, destFonts, 'шрифт');

  // Глобальные картинки: src/img/** → build/img/**
  await copyDirRecursive(srcImg, destImg, 'изображение');

  // Картинки блоков: src/blocks/*/img/* → build/img/<имя файла>
  await copyBlockImagesFlat();

  // Глобальное видео: src/video/** → build/video/**
  await copyDirRecursive(srcVideo, destVideo, 'видео');

  // Видео блоков: src/blocks/*/video/* → build/video/<имя файла> (с уникальными именами)
  await copyBlockVideosFlat();

  logInfo('[assets] Копирование ассетов завершено');
}

// Автозапуск при прямом запуске файла
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  copyAssets().catch((err) => {
    logError('[assets] Ошибка копирования ассетов: ' + err.message);
    process.exitCode = 1;
  });
}
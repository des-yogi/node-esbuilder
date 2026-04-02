import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import sortMediaQueries from 'postcss-sort-media-queries';
import postcssInlineSvg from 'postcss-inline-svg';
import { getFilesList } from './config.mjs';
import customPostcssPlugins from '../customPostcss.js';
import { logInfo, logError } from './logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');
const buildCssDir = path.join(buildDir, 'css');

/**
 * Компилирует один SCSS-файл через Sass + PostCSS и записывает результат в destPath.
 */
async function compileSingleScss(srcScss, destCss, isProd) {
  let sassResult;
  try {
    sassResult = sass.compile(srcScss, {
      style: isProd ? 'compressed' : 'expanded',
      sourceMap: !isProd,
      loadPaths: [path.join(rootDir, 'node_modules')],
    });
  } catch (err) {
    logError('[styles] Ошибка компиляции Sass (' + path.relative(rootDir, srcScss) + '): ' + err.message);
    throw err;
  }

  const plugins = [
    autoprefixer(),
    sortMediaQueries(),
    postcssInlineSvg(),
    ...(Array.isArray(customPostcssPlugins) ? customPostcssPlugins : []),
  ];

  try {
    const result = await postcss(plugins).process(sassResult.css, {
      from: srcScss,
      to: destCss,
      map: !isProd && sassResult.sourceMap
        ? { inline: false, annotation: false, prev: sassResult.sourceMap }
        : false,
    });

    await writeFile(destCss, result.css, 'utf8');
    logInfo('[styles] Сформирован: ' + path.relative(rootDir, destCss));

    if (result.map) {
      const mapPath = `${destCss}.map`;
      await writeFile(mapPath, result.map.toString(), 'utf8');
      logInfo('[styles] Sourcemap записан: ' + path.relative(rootDir, mapPath));
    }
  } catch (err) {
    logError('[styles] Ошибка PostCSS (' + path.relative(rootDir, srcScss) + '): ' + err.message);
    throw err;
  }
}

export async function buildStyles({ mode = 'development' } = {}) {
  logInfo(`[styles] Запуск сборки стилей в режиме "${mode}"`);

  const isProd = mode === 'production';

  await mkdir(buildCssDir, { recursive: true });

  // 1. Компиляция основного style.scss
  const entryScss = path.join(srcDir, 'scss', 'style.scss');
  const outMinCss = path.join(buildCssDir, 'style.min.css');
  await compileSingleScss(entryScss, outMinCss, isProd);

  // 2. Компиляция singleCompiled — отдельных SCSS-файлов из конфига
  const { projectConfig } = await getFilesList();
  const singleCompiled = Array.isArray(projectConfig?.singleCompiled)
    ? projectConfig.singleCompiled
    : [];

  if (singleCompiled.length) {
    logInfo('[styles] Компиляция singleCompiled файлов');
    for (const srcRelOrAbs of singleCompiled) {
      const srcScss = path.isAbsolute(srcRelOrAbs)
        ? srcRelOrAbs
        : path.join(rootDir, srcRelOrAbs);
      const baseName = path.basename(srcScss, '.scss');
      const destCss = path.join(buildCssDir, `${baseName}.min.css`);

      try {
        await compileSingleScss(srcScss, destCss, isProd);
      } catch (err) {
        logError(`[styles] Ошибка при компиляции "${srcRelOrAbs}": ${err.message}`);
      }
    }
  }

  // 3. Копирование "сырых" CSS-файлов (copiedCss) → build/css
  const copiedCss = Array.isArray(projectConfig?.copiedCss) ? projectConfig.copiedCss : [];

  if (copiedCss.length) {
    logInfo('[styles] Копирование CSS-файлов без сборки (copiedCss)');
    for (const srcRelOrAbs of copiedCss) {
      const srcCssPath = path.isAbsolute(srcRelOrAbs)
        ? srcRelOrAbs
        : path.join(rootDir, srcRelOrAbs);
      const fileName = path.basename(srcCssPath);
      const destPath = path.join(buildCssDir, fileName);

      try {
        await copyFile(srcCssPath, destPath);
        logInfo('[styles] Копирован CSS: ' + path.relative(rootDir, destPath));
      } catch (err) {
        logError(`[styles] Не удалось скопировать CSS "${srcCssPath}" → "${destPath}": ${err.message}`);
      }
    }
  }
}

// Автозапуск при прямом запуске файла: node scripts/styles.mjs
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  const mode = process.env.NODE_ENV || 'development';
  buildStyles({ mode }).catch((err) => {
    logError('[styles] Ошибка сборки стилей: ' + err.message);
    process.exitCode = 1;
  });
}

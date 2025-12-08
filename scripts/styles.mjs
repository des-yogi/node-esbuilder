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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');
const buildCssDir = path.join(buildDir, 'css');

export async function buildStyles({ mode = 'development' } = {}) {
  console.log(`[styles] Запуск сборки стилей в режиме "${mode}"`);

  const isProd = mode === 'production';

  const entryScss = path.join(srcDir, 'scss', 'style.scss');
  const outMinCss = path.join(buildCssDir, 'style.min.css'); // единственный файл, как ты просил

  await mkdir(buildCssDir, { recursive: true });

  // Компиляция Sass: expanded в dev, compressed в prod.
  let sassResult;
  try {
    sassResult = sass.compile(entryScss, {
      style: isProd ? 'compressed' : 'expanded',
      sourceMap: !isProd,
    });
  } catch (err) {
    console.error('[styles] Ошибка компиляции Sass:', err);
    throw err;
  }

  // Пост‑CSS плагины
  const plugins = [
    autoprefixer(),
    sortMediaQueries(),
    postcssInlineSvg(),
    ...(Array.isArray(customPostcssPlugins) ? customPostcssPlugins : []),
  ];

  // Обрабатываем через PostCSS.
  try {
    const result = await postcss(plugins).process(sassResult.css, {
      from: entryScss,
      to: outMinCss,
      map: !isProd && sassResult.sourceMap ? { inline: false, annotation: false, prev: sassResult.sourceMap } : false,
    });

    // Записываем итоговый файл (style.min.css) — в dev он будет не минифицированный, в prod — минифицированный.
    await writeFile(outMinCss, result.css, 'utf8');
    console.log('[styles] Сформирован:', path.relative(rootDir, outMinCss));

    // Если есть карта — записываем рядом
    if (result.map) {
      const mapPath = `${outMinCss}.map`;
      await writeFile(mapPath, result.map.toString(), 'utf8');
      console.log('[styles] Sourcemap записан:', path.relative(rootDir, mapPath));
    }
  } catch (err) {
    console.error('[styles] Ошибка PostCSS:', err);
    throw err;
  }

  // Копирование "сырых" CSS-файлов (copiedCss) → build/css
  const { projectConfig } = await getFilesList();
  const copiedCss = Array.isArray(projectConfig?.copiedCss) ? projectConfig.copiedCss : [];

  if (copiedCss.length) {
    console.log('[styles] Копирование CSS-файлов без сборки (copiedCss)');
    for (const srcRelOrAbs of copiedCss) {
      const srcPath = path.isAbsolute(srcRelOrAbs) ? srcRelOrAbs : path.join(rootDir, srcRelOrAbs);
      const fileName = path.basename(srcPath);
      const destPath = path.join(buildCssDir, fileName);

      try {
        await copyFile(srcPath, destPath);
        console.log('[styles] Копирован CSS:', path.relative(rootDir, destPath));
      } catch (err) {
        console.error(`[styles] Не удалось скопировать CSS "${srcPath}" → "${destPath}":`, err);
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
    console.error('[styles] Ошибка сборки стилей:', err);
    process.exitCode = 1;
  });
}
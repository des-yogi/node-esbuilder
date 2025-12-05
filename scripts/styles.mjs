import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import sortMediaQueries from 'postcss-sort-media-queries';
import inlineSvg from 'postcss-inline-svg';
// кастомные плагины пользователя
import customPlugins from '../customPostcss.js';

/**
 * Задача этого модуля:
 * - взять сгенерированный src/scss/style.scss;
 * - скомпилировать его через Dart Sass;
 * - прогнать результат через PostCSS (autoprefixer, sort-media-queries, postcss-inline-svg и т.д.);
 * - записать итоговый файл build/css/style.min.css (или style.css в dev-режиме).
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcStylePath = path.join(rootDir, 'src', 'scss', 'style.scss');
const buildCssDir = path.join(rootDir, 'build', 'css');
const buildCssPath = path.join(buildCssDir, 'style.css'); // минификацию добавим позже

export async function buildStyles({ mode = 'development' } = {}) {
  console.log(`[styles] Запуск сборки стилей в режиме "${mode}"`);

  // 1. Компиляция SCSS → CSS через sass
  // TODO: настроить sourceMap при необходимости.
  const sassResult = sass.compile(srcStylePath, {
    style: mode === 'production' ? 'compressed' : 'expanded',
    sourceMap: mode !== 'production',
  });

  const postcssPlugins = [
    autoprefixer(),
    sortMediaQueries(),
    inlineSvg(),
    // сюда можно добавить минификатор CSS для production, если не использовать встроенный сжатый вывод Sass
    ...customPlugins,
  ];

  // 2. Прогон через PostCSS
  const postcssResult = await postcss(postcssPlugins).process(sassResult.css, {
    from: srcStylePath,
    to: buildCssPath,
    map: mode !== 'production' ? { inline: true } : false,
  });

  // 3. Запись результата в build/css/style.css
  await mkdir(buildCssDir, { recursive: true });
  await writeFile(buildCssPath, postcssResult.css, 'utf8');

  console.log(`[styles] Стиль собран: ${path.relative(rootDir, buildCssPath)}`);
}

// Позволяем запускать модуль напрямую: `node scripts/styles.mjs`
if (import.meta.url === `file://${__filename}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildStyles({ mode }).catch((err) => {
    console.error('[styles] Ошибка сборки стилей:', err);
    process.exitCode = 1;
  });
}
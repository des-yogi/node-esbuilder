/**
 * styles.mjs
 * 
 * Задача компиляции SCSS → CSS и постобработки через PostCSS.
 * 
 * Этапы работы:
 * 1. Компиляция src/scss/style.scss → CSS через Dart Sass
 * 2. Постобработка CSS через PostCSS:
 *    - autoprefixer (добавление вендорных префиксов)
 *    - postcss-sort-media-queries (сортировка медиа-запросов)
 *    - postcss-inline-svg (инлайн SVG в CSS)
 *    - кастомные плагины из customPostcss.js
 *    - cssnano (минификация) для production
 * 3. Запись результата в build/css/style.min.css
 * 4. Генерация sourcemaps для development
 * 
 * Режимы работы:
 * - development: с sourcemaps, без минификации
 * - production: минификация, без sourcemaps
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import sortMediaQueries from 'postcss-sort-media-queries';
import inlineSvg from 'postcss-inline-svg';
import cssnano from 'cssnano';
import customPostcssPlugins from '../customPostcss.js';
import { projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Компилирует SCSS в CSS и выполняет постобработку
 * 
 * @param {Object} options - опции сборки
 * @param {string} options.mode - режим сборки: 'development' | 'production'
 */
export async function buildStyles({ mode = 'development' } = {}) {
  console.log(`[NTH] Сборка стилей (режим: ${mode})...`);

  const dirs = projectConfig.dirs;
  const inputFile = path.join(__dirname, '..', dirs.srcPath, 'scss/style.scss');
  const outputDir = path.join(__dirname, '..', dirs.buildPath, 'css');
  const outputFile = path.join(outputDir, 'style.min.css');

  try {
    // TODO: Проверить существование входного файла
    // TODO: Если файла нет, вызвать generateStyle.mjs

    // Шаг 1: Компиляция SCSS → CSS через Dart Sass
    console.log('[NTH] Компиляция SCSS...');
    const sassResult = sass.compile(inputFile, {
      style: mode === 'production' ? 'compressed' : 'expanded',
      sourceMap: mode === 'development',
      loadPaths: [path.join(__dirname, '..', dirs.srcPath)]
    });

    let css = sassResult.css;

    // TODO: Обработать sassResult.sourceMap для development режима

    // Шаг 2: Постобработка через PostCSS
    console.log('[NTH] Постобработка через PostCSS...');

    // Формируем список плагинов PostCSS
    const postcssPlugins = [
      autoprefixer(),
      sortMediaQueries({
        sort: 'mobile-first' // или 'desktop-first'
      }),
      inlineSvg({
        paths: [
          path.join(__dirname, '..', dirs.srcPath, 'img'),
          path.join(__dirname, '..', dirs.srcPath, dirs.blocksDirName)
        ]
      }),
      ...customPostcssPlugins
    ];

    // Добавляем минификацию для production
    if (mode === 'production') {
      postcssPlugins.push(cssnano({
        preset: ['default', {
          discardComments: {
            removeAll: true
          }
        }]
      }));
    }

    const postcssResult = await postcss(postcssPlugins).process(css, {
      from: inputFile,
      to: outputFile,
      map: mode === 'development' ? { inline: false } : false
    });

    // Шаг 3: Создание директории и запись результата
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputFile, postcssResult.css);

    // TODO: Записать sourcemap в отдельный файл для development
    if (mode === 'development' && postcssResult.map) {
      await fs.writeFile(`${outputFile}.map`, postcssResult.map.toString());
    }

    console.log(`[NTH] ✓ Стили скомпилированы: ${outputFile}`);

    // TODO: Добавить обработку postcss-extract-media-query для разделения медиа-запросов
    // TODO: Добавить обработку singleCompiled файлов из projectConfig
    // TODO: Добавить копирование copiedCss файлов

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при сборке стилей:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildStyles({ mode }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

/**
 * scripts.mjs
 * 
 * Задача сборки JavaScript через esbuild.
 * 
 * Этапы работы:
 * 1. Получить списки JS-файлов через getFilesList() из config.mjs
 * 2. Сформировать entry-файл с импортами всех блоков (аналог generateEntryJs.js)
 * 3. Выполнить сборку через esbuild.build():
 *    - Объединение всех модулей
 *    - Минификация для production
 *    - Генерация sourcemaps для development
 *    - Поддержка ES Modules и CommonJS
 * 4. Записать результат в build/js/script.min.js
 * 
 * Особенности:
 * - Поддержка как ES Modules (import/export), так и CommonJS (require/module.exports)
 * - Учет addJsBefore и addJsAfter из projectConfig
 * - Возможность указать alias для путей (если потребуется)
 * 
 * Режимы работы:
 * - development: sourcemaps, без минификации, быстрая сборка
 * - production: минификация, tree-shaking, оптимизация
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';
import { getFilesList, projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Собирает JavaScript через esbuild
 * 
 * @param {Object} options - опции сборки
 * @param {string} options.mode - режим сборки: 'development' | 'production'
 */
export async function buildScripts({ mode = 'development' } = {}) {
  console.log(`[NTH] Сборка скриптов (режим: ${mode})...`);

  const dirs = projectConfig.dirs;
  const lists = getFilesList();

  // TODO: Генерировать временный entry-файл с импортами всех JS-модулей блоков
  // Пример содержимого entry-файла:
  // ```js
  // // Файлы из addJsBefore
  // import '../js/polyfills.js';
  // 
  // // Файлы блоков
  // import '../blocks/header/header.js';
  // import '../blocks/menu/menu.js';
  // 
  // // Файлы из addJsAfter
  // import '../js/init.js';
  // ```

  const entryFile = path.join(__dirname, '..', dirs.srcPath, 'js/entry.js');
  const outputDir = path.join(__dirname, '..', dirs.buildPath, 'js');
  const outputFile = path.join(outputDir, 'script.min.js');

  try {
    // Генерируем временный entry-файл с импортами
    console.log('[NTH] Генерация entry-файла...');
    let entryContent = '// NOTE: This file is generated automatically. Do not edit manually.\n\n';

    // TODO: Добавить импорты из addJsBefore

    // Добавляем импорты блоков
    lists.js.forEach((jsPath) => {
      const relativePath = jsPath.replace(/\\/g, '/').replace(/^\.?\/?src\//, '../');
      entryContent += `import '${relativePath}';\n`;
    });

    // TODO: Добавить импорты из addJsAfter

    // Создаем директорию для entry-файла
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, entryContent);

    console.log('[NTH] Entry-файл создан:', entryFile);

    // Шаг 2: Сборка через esbuild
    console.log('[NTH] Запуск esbuild...');

    await fs.mkdir(outputDir, { recursive: true });

    await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outputFile,
      format: 'iife', // для браузера (можно использовать 'esm' если нужны ES modules)
      platform: 'browser',
      target: ['es2020'], // поддержка современного JS
      minify: mode === 'production',
      sourcemap: mode === 'development',
      treeShaking: true,
      // TODO: Добавить alias при необходимости
      // alias: {
      //   '@': path.join(__dirname, '..', dirs.srcPath)
      // },
      logLevel: 'info'
    });

    console.log(`[NTH] ✓ Скрипты собраны: ${outputFile}`);

    // TODO: Добавить копирование copiedJs файлов из projectConfig
    // TODO: Обработать случай, когда нет JS-файлов (создать пустой файл)

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при сборке скриптов:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildScripts({ mode }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

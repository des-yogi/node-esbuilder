/**
 * html.mjs
 * 
 * Задача сборки HTML-файлов с поддержкой инклюдов и обработкой комментариев.
 * 
 * Функционал (аналог gulp-file-include):
 * 1. Поиск HTML-файлов:
 *    - src/*.html (страницы верхнего уровня)
 *    - src/_include/*.html (шаблоны для инклюдов)
 *    - src/blocks/**\/*.html (шаблоны блоков)
 * 
 * 2. Обработка инклюдов в HTML:
 *    Синтаксис: @@include('path/to/file.html', { "param": "value" })
 *    Пример:
 *      @@include('_include/page_head.html', { "title": "Главная страница" })
 *      @@include('blocks/header/header.html')
 * 
 * 3. Обработка DEV-комментариев:
 *    В production-режиме удаляются блоки вида:
 *    <!--DEV
 *      Этот контент виден только в dev-режиме
 *    -->
 * 
 * 4. Сохранение результатов:
 *    - Только файлы из src/*.html копируются в build/
 *    - Структура вложенности сохраняется
 * 
 * TODO: Этап 1 - реализовать базовую заглушку
 * TODO: Этап 2 - добавить парсинг и обработку @@include
 * TODO: Этап 3 - добавить удаление <!--DEV блоков для production
 * TODO: Этап 4 - добавить поддержку параметров в инклюдах
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Собирает HTML-файлы с инклюдами
 * 
 * @param {Object} options - опции сборки
 * @param {string} options.mode - режим сборки: 'development' | 'production'
 */
export async function buildHtml({ mode = 'development' } = {}) {
  console.log(`[NTH] Сборка HTML (режим: ${mode})...`);

  const dirs = projectConfig.dirs;
  const srcDir = path.join(__dirname, '..', dirs.srcPath);
  const buildDir = path.join(__dirname, '..', dirs.buildPath);

  try {
    // TODO: Найти все HTML-файлы в src/*.html
    // Можно использовать fs.readdir или fast-glob/globby
    // const htmlFiles = await glob('src/*.html');

    // TODO: Для каждого HTML-файла:
    // 1. Прочитать содержимое
    // 2. Обработать @@include директивы рекурсивно
    // 3. Если mode === 'production', удалить <!--DEV ... --> блоки
    // 4. Записать результат в build/

    // Временная заглушка: копируем HTML файлы как есть
    console.log('[NTH] TODO: Реализовать обработку инклюдов и DEV-комментариев');
    console.log('[NTH] Пока HTML-файлы будут копироваться без изменений');

    // Пример простого копирования (без инклюдов):
    const files = await fs.readdir(srcDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    for (const file of htmlFiles) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(buildDir, file);

      const content = await fs.readFile(srcFile, 'utf8');

      // TODO: Здесь должна быть обработка @@include
      // TODO: Здесь должно быть удаление <!--DEV блоков для production

      await fs.mkdir(buildDir, { recursive: true });
      await fs.writeFile(destFile, content);

      console.log(`[NTH] ✓ HTML скопирован: ${file}`);
    }

    console.log(`[NTH] ✓ Обработано HTML-файлов: ${htmlFiles.length}`);

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при сборке HTML:', error);
    throw error;
  }
}

/**
 * Обрабатывает @@include директивы в HTML
 * TODO: Реализовать на следующих этапах
 * 
 * @param {string} content - содержимое HTML
 * @param {string} basePath - базовый путь для резолва инклюдов
 * @returns {string} обработанный HTML
 */
function processIncludes(content, basePath) {
  // Регулярное выражение для поиска @@include('path/to/file.html', { params })
  // const includeRegex = /@@include\(['"]([^'"]+)['"](?:,\s*({[^}]*}))?\)/g;

  // TODO: Найти все вхождения @@include
  // TODO: Прочитать файлы для инклюда
  // TODO: Заменить параметры (если есть)
  // TODO: Рекурсивно обработать инклюды во вложенных файлах

  return content;
}

/**
 * Удаляет DEV-комментарии из HTML для production
 * TODO: Реализовать на следующих этапах
 * 
 * @param {string} content - содержимое HTML
 * @returns {string} HTML без DEV-комментариев
 */
function removeDevComments(content) {
  // Регулярное выражение для поиска <!--DEV ... -->
  // const devCommentRegex = /<!--DEV[\s\S]*?-->/g;

  // TODO: Удалить все блоки <!--DEV ... -->

  return content;
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildHtml({ mode }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

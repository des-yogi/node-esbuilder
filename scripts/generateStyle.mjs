/**
 * generateStyle.mjs
 * 
 * Генерирует файл src/scss/style.scss на основе списка CSS-файлов блоков.
 * 
 * Задача:
 * 1. Получить список CSS-файлов через getFilesList() из config.mjs
 * 2. Сформировать содержимое style.scss с @use/@import директивами
 * 3. Записать файл src/scss/style.scss
 * 
 * Формат lists.css:
 * Массив путей к SCSS-файлам блоков, например:
 * [
 *   'src/scss/variables.scss',           // из addCssBefore
 *   'src/blocks/example-block/example-block.scss',
 *   'src/blocks/header/header.scss',
 *   ...
 * ]
 * 
 * Пример итогового style.scss:
 * ```scss
 * /*!*
 *  * NOTE: This file is generated automatically.
 *  * Do not manually write anything here, all such edits will be lost.
 *  *\/
 * 
 * @use '../scss/variables.scss' as *;
 * @use '../blocks/example-block/example-block.scss' as *;
 * @use '../blocks/header/header.scss' as *;
 * ```
 * 
 * Использование @use вместо @import для современного Dart Sass.
 * Все пути делаем относительными от src/scss/style.scss.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFilesList, projectConfig } from './config.mjs';

// Получаем абсолютный путь к корню проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Генерирует файл style.scss с импортами всех стилей блоков
 */
export function generateStyleFile() {
  const lists = getFilesList();
  const dirs = projectConfig.dirs;

  // Формируем содержимое файла
  let styleImports = `/*!*
 * NOTE: This file is generated automatically.
 * Do not manually write anything here, all such edits will be lost.
 */

`;

  // Для каждого CSS-файла создаем @use директиву
  lists.css.forEach((blockPath) => {
    // Преобразуем путь в относительный от src/scss/
    // Например: src/blocks/header/header.scss -> ../blocks/header/header.scss
    let relativePath = blockPath
      .replace(/\\/g, '/')
      .replace(/^\.?\/?src\//, '../');

    styleImports += `@use '${relativePath}' as *;\n`;
  });

  // Записываем файл
  const outputPath = path.join(__dirname, '..', dirs.srcPath, 'scss/style.scss');
  fs.writeFileSync(outputPath, styleImports);

  console.log('[NTH] style.scss сгенерирован успешно.');
  console.log(`[NTH] Подключено файлов: ${lists.css.length}`);
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStyleFile();
}

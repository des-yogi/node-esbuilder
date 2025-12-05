/**
 * config.mjs
 * 
 * Модуль для централизованного чтения конфигурации проекта (projectConfig.json)
 * и формирования списков файлов для сборки.
 * 
 * Экспортирует:
 * - projectConfig: объект конфигурации проекта
 * - getFilesList(): функция для получения списков файлов (css, js, img, blocksDirs)
 * 
 * Аналог функции getFilesList из ugspot/gulpfile.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем абсолютный путь к корню проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем projectConfig.json
export const projectConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../projectConfig.json'), 'utf8')
);

/**
 * Формирует списки файлов блоков на основе конфигурации проекта.
 * 
 * Возвращает объект с полями:
 * - css: массив путей к SCSS-файлам блоков (с учетом addCssBefore/After)
 * - js: массив путей к JS-файлам блоков (с учетом addJsBefore/After)
 * - img: массив путей к папкам с изображениями блоков
 * - video: массив путей к видео-файлам (если есть)
 * - blocksDirs: массив путей к директориям блоков
 * 
 * Логика аналогична getFilesList из ugspot/gulpfile.js:
 * 1. Для каждого блока из projectConfig.blocks проверяем наличие файлов:
 *    - ${blockName}.scss и ${blockName}${modifier}.scss для стилей
 *    - ${blockName}.js и ${blockName}${modifier}.js для скриптов
 * 2. Добавляем файлы из addCssBefore в начало списка CSS
 * 3. Добавляем файлы из addCssAfter в конец списка CSS
 * 4. Аналогично для JS (addJsBefore/After)
 * 5. Собираем пути к папкам img внутри блоков
 * 
 * TODO: Реализовать полную логику сканирования блоков и модификаторов
 * TODO: Добавить поддержку video файлов
 * TODO: Добавить обработку singleCompiled
 * TODO: Добавить обработку copiedCss/copiedJs
 * 
 * @param {Object} config - объект конфигурации (по умолчанию projectConfig)
 * @returns {Object} списки файлов { css, js, img, video, blocksDirs }
 */
export function getFilesList(config = projectConfig) {
  const res = {
    css: [],
    js: [],
    img: [],
    video: [],
    blocksDirs: []
  };

  // Проходим по всем блокам в конфигурации
  for (const blockName in config.blocks) {
    const blockPath = path.join(
      config.dirs.srcPath,
      config.dirs.blocksDirName,
      blockName,
      '/'
    );

    if (fs.existsSync(blockPath)) {
      res.blocksDirs.push(blockPath);

      // Собираем SCSS-файлы
      const scssFile = path.join(blockPath, `${blockName}.scss`);
      if (fs.existsSync(scssFile)) {
        res.css.push(scssFile);

        // Если есть модификаторы/элементы блока
        if (config.blocks[blockName].length) {
          config.blocks[blockName].forEach((elementName) => {
            const modifierFile = path.join(blockPath, `${blockName}${elementName}.scss`);
            if (fs.existsSync(modifierFile)) {
              res.css.push(modifierFile);
            }
          });
        }
      }

      // Собираем JS-файлы
      const jsFile = path.join(blockPath, `${blockName}.js`);
      if (fs.existsSync(jsFile)) {
        res.js.push(jsFile);

        // Если есть модификаторы/элементы блока
        if (config.blocks[blockName].length) {
          config.blocks[blockName].forEach((elementName) => {
            const modifierFile = path.join(blockPath, `${blockName}${elementName}.js`);
            if (fs.existsSync(modifierFile)) {
              res.js.push(modifierFile);
            }
          });
        }
      }

      // Собираем пути к папкам с изображениями
      const imgDir = path.join(blockPath, 'img');
      if (fs.existsSync(imgDir)) {
        res.img.push(imgDir);
      }

      // TODO: Добавить сканирование видео-файлов
      // TODO: Добавить сканирование bg-img директорий
    }
  }

  // Добавляем файлы из addCssBefore в начало
  res.css = (config.addCssBefore || []).concat(res.css);

  // Добавляем файлы из addCssAfter в конец
  res.css = res.css.concat(config.addCssAfter || []);

  // Добавляем файлы из addJsBefore в начало
  res.js = (config.addJsBefore || []).concat(res.js);

  // Добавляем файлы из addJsAfter в конец
  res.js = res.js.concat(config.addJsAfter || []);

  // TODO: Добавить обработку copiedCss
  // TODO: Добавить обработку copiedJs
  // TODO: Добавить обработку addImages
  // TODO: Добавить обработку singleCompiled

  return res;
}

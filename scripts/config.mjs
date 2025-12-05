import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Этот модуль отвечает за:
 * - чтение projectConfig.json;
 * - подготовку списков файлов (css/js/img/video/blocksDirs),
 *   аналогично функции getFilesList из gulpfile.js проекта ugspot.
 *
 * На данном этапе здесь только:
 * - чтение projectConfig.json;
 * - заглушка getFilesList() с описанием ожидаемого результата.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const projectConfigPath = path.join(rootDir, 'projectConfig.json');

/**
 * Чтение projectConfig.json из корня проекта.
 */
export async function readProjectConfig() {
  const json = await readFile(projectConfigPath, 'utf8');
  return JSON.parse(json);
}

/**
 * Заглушка для функции, аналогичной getFilesList из ugspot/gulpfile.js.
 *
 * В будущем должна возвращать объект вида:
 * {
 *   css: string[];        // SCSS/CSS файлы для подключения в style.scss
 *   js: string[];         // JS файлы блоков + addJsBefore/addJsAfter
 *   img: string[];        // дополнительные изображения (addImages)
 *   video: string[];      // дополнительные видео (addVideo)
 *   blocksDirs: string[]; // директории подключённых блоков
 * }
 *
 * Логика будет основана на:
 * - projectConfig.blocks;
 * - addCssBefore/addCssAfter;
 * - addJsBefore/addJsAfter;
 * - copiedCss/copiedJs;
 * - addImages/addVideo.
 */
export async function getFilesList() {
  const projectConfig = await readProjectConfig();

  // TODO: реализовать построение списков файлов аналогично getFilesList из ugspot.
  // Пока возвращаем пустые списки, чтобы не ломать импорт.
  return {
    css: [],
    js: [],
    img: [],
    video: [],
    blocksDirs: [],
    projectConfig,
  };
}
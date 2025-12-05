import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Этот модуль отвечает за:
 * - чтение projectConfig.json;
 * - подготовку списков файлов (css/js/img/video/blocksDirs),
 *   аналогично функции getFilesList из gulpfile.js проекта ugspot,
 *   но уже под новую архитектуру (Dart Sass v3, @use).
 *
 * На первом этапе реализуем только CSS-часть: список SCSS-файлов,
 * которые должны подключаться в style.scss.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const projectConfigPath = path.join(rootDir, 'projectConfig.json');

export async function readProjectConfig() {
  const json = await readFile(projectConfigPath, 'utf8');
  return JSON.parse(json);
}

/**
 * Возвращает объект со списками файлов.
 *
 * Формат (пока основное — css):
 * {
 *   css: {
 *     before: string[]; // пути файлов из addCssBefore
 *     blocks: string[]; // scss-файлы блоков src/blocks/<block>/<block>.scss
 *     after: string[];  // пути файлов из addCssAfter
 *     all: string[];    // before + blocks + after
 *   },
 *   js: { ... },        // заглушка под будущее
 *   img: string[],
 *   video: string[],
 *   blocksDirs: string[],
 *   projectConfig: object,
 * }
 */
export async function getFilesList() {
  const projectConfig = await readProjectConfig();

  const srcPath = projectConfig.dirs?.srcPath ?? 'src/';
  const blocksDirName = projectConfig.dirs?.blocksDirName ?? 'blocks';

  const normalizedSrc = srcPath.replace(/[/\\]+$/, ''); // "src"
  const blocksRoot = `${normalizedSrc}/${blocksDirName}`; // "src/blocks"

  const addCssBefore = Array.isArray(projectConfig.addCssBefore)
    ? projectConfig.addCssBefore.map(String)
    : [];

  const addCssAfter = Array.isArray(projectConfig.addCssAfter)
    ? projectConfig.addCssAfter.map(String)
    : [];

  const blocksConfig = projectConfig.blocks ?? {};
  const blockNames = Object.keys(blocksConfig);

  const blockScssFiles = blockNames.map(
    (blockName) => `${blocksRoot}/${blockName}/${blockName}.scss`,
  );

  const cssAll = [...addCssBefore, ...blockScssFiles, ...addCssAfter];

  return {
    css: {
      before: addCssBefore,
      blocks: blockScssFiles,
      after: addCssAfter,
      all: cssAll,
    },
    js: {
      before: projectConfig.addJsBefore ?? [],
      blocks: [],
      after: projectConfig.addJsAfter ?? [],
      copied: projectConfig.copiedJs ?? [],
      all: [],
    },
    img: projectConfig.addImages ?? [],
    video: projectConfig.addVideo ?? [],
    blocksDirs: blockNames.map((name) => `${blocksRoot}/${name}`),
    projectConfig,
  };
}
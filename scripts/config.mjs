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
 * {
 *   css: {
 *     before: string[];
 *     blocks: string[];
 *     after: string[];
 *     all: string[];
 *   },
 *   js: {
 *     before: string[];
 *     blocks: string[];
 *     after: string[];
 *     copied: string[];
 *     all: string[];
 *   },
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

  const addJsBefore = Array.isArray(projectConfig.addJsBefore)
    ? projectConfig.addJsBefore.map(String)
    : [];

  const addJsAfter = Array.isArray(projectConfig.addJsAfter)
    ? projectConfig.addJsAfter.map(String)
    : [];

  const blockJsFiles = blockNames.map(
    (blockName) => `${blocksRoot}/${blockName}/${blockName}.js`,
  );

  const jsAll = [...addJsBefore, ...blockJsFiles, ...addJsAfter];

  return {
    css: {
      before: addCssBefore,
      blocks: blockScssFiles,
      after: addCssAfter,
      all: cssAll,
    },
    js: {
      before: addJsBefore,
      blocks: blockJsFiles,
      after: addJsAfter,
      copied: projectConfig.copiedJs ?? [],
      all: jsAll,
    },
    blocksDirs: blockNames.map((name) => `${blocksRoot}/${name}`),
    projectConfig,
  };
}

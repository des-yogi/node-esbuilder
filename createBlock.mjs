// Генератор файлов блока
// Использование: node createBlock.mjs [имя блока] [доп. расширения через пробел]

import fs from 'node:fs';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logSuccess, logInfo, logWarn, logError } from './scripts/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'projectConfig.json'), 'utf8'),
);

const dirs = projectConfig.dirs;

const blockName = process.argv[2]; // получим имя блока
const defaultExtensions = ['scss', 'html', 'img', 'bg-img']; // расширения по умолчанию
const extensions = uniqueArray(
  defaultExtensions.concat(process.argv.slice(3)),
); // добавим введённые при вызове расширения (если есть)

// Проверка существования файла/папки
async function fileExist(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

// Оставить в массиве только уникальные значения
function uniqueArray(arr) {
  return [...new Set(arr)];
}

if (blockName) {
  const dirPath = path.join(
    __dirname,
    dirs.srcPath,
    dirs.blocksDirName,
    blockName,
  );

  await mkdir(dirPath, { recursive: true });
  logSuccess(`[createBlock] Папка блока: ${dirPath}`);

  for (const extension of extensions) {
    const filePath = path.join(dirPath, `${blockName}.${extension}`);
    let fileContent = '';
    let fileCreateMsg = '';

    if (extension === 'scss') {
      fileContent =
        `// В этом файле должны быть стили для БЭМ-блока ${blockName}, его элементов,\n` +
        `// модификаторов, псевдоселекторов, псевдоэлементов, @media-условий...\n` +
        `// Очерёдность:\n` +
        `// 1. Стилевые правила для этого селектора. 2. @media этого контекста.\n` +
        `// 3. Псевдоселекторы и псевдоэлементы. 4. Вложенные сторонние селекторы.\n` +
        `// 5. БЭМ-элементы. 6. БЭМ-модификаторы.\n\n` +
        `// Раскомментируйте нужные подключения:\n` +
        `// @use 'sass:math' as *;    // math.div(), math.round(), math.ceil(), math.floor(), math.percentage(), math.max(), math.min(), math.random()\n` +
        `// @use 'sass:list' as *;    // list.append(), list.join(), list.nth(), list.length(), list.index(), list.separator()\n` +
        `// @use 'sass:map' as *;     // map.get(), map.set(), map.merge(), map.keys(), map.values(), map.has-key(), map.remove()\n` +
        `// @use 'sass:color' as *;   // color.adjust(), color.scale(), color.mix(), color.change(), color.complement(), color.invert()\n` +
        `// @use 'sass:string' as *;  // string.index(), string.slice(), string.to-upper-case(), string.to-lower-case(), string.length(), string.insert()\n\n` +
        `@use '../../scss/variables' as *;\n` +
        `@use '../../scss/mixins' as *;\n\n` +
        `.${blockName} {\n  $block-name: &; // #{$block-name}__element\n\n}\n`;

      // Добавляем блок в projectConfig, если его ещё нет
      if (!(blockName in projectConfig.blocks)) {
        projectConfig.blocks[blockName] = [];
        const newConfig = JSON.stringify(projectConfig, null, 2);
        await writeFile(
          path.join(__dirname, 'projectConfig.json'),
          newConfig,
          'utf8',
        );
        fileCreateMsg =
          '[createBlock] Блок добавлен в projectConfig.json';
      }
    } else if (extension === 'html') {
      fileContent =
        `<!--DEV\n` +
        `Для использования этого файла как шаблона:\n` +
        `@@include('blocks/${blockName}/${blockName}.html')\n` +
        `-->\n\n` +
        `<div class="${blockName}">content</div>\n`;
    } else if (extension === 'js') {
      fileContent =
        `// document.addEventListener('DOMContentLoaded', function () {});\n` +
        `// (function () {\n` +
        `//   // код\n` +
        `// })();\n`;
    } else if (extension === 'img') {
      const imgFolder = path.join(dirPath, 'img');
      if (!(await fileExist(imgFolder))) {
        await mkdir(imgFolder, { recursive: true });
        logSuccess(`[createBlock] Папка создана: ${imgFolder}`);
      } else {
        logInfo(`[createBlock] Папка уже существует: ${imgFolder}`);
      }
      continue;
    } else if (extension === 'bg-img') {
      const bgImgFolder = path.join(dirPath, 'bg-img');
      if (!(await fileExist(bgImgFolder))) {
        await mkdir(bgImgFolder, { recursive: true });
        logSuccess(`[createBlock] Папка создана: ${bgImgFolder}`);
      } else {
        logInfo(`[createBlock] Папка уже существует: ${bgImgFolder}`);
      }
      continue;
    }

    if (!(await fileExist(filePath))) {
      await writeFile(filePath, fileContent, 'utf8');
      logSuccess(`[createBlock] Файл создан: ${filePath}`);
      if (fileCreateMsg) {
        logWarn(fileCreateMsg);
      }
    } else {
      logInfo(`[createBlock] Файл уже существует: ${filePath}`);
    }
  }
} else {
  logError('[createBlock] Отмена операции: не указано имя блока');
  process.exitCode = 1;
}

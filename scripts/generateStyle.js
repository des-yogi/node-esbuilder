import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем абсолютный путь к корню проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем projectConfig.json
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../projectConfig.json'), 'utf8')
);

const dirs = projectConfig.dirs;
const lists = getFilesList(projectConfig);

// Генерируем imports для style.scss
let styleImports = `/*!*
 * NOTE: This file is generated automatically.
 * Do not manually write anything here, all such edits will be lost.
 */\n\n`;

lists.css.forEach((blockPath) => {
  let relativePath = blockPath.replace(/\\/g, '/').replace(/^\.?\/?src\//, '../');
  styleImports += `@use '${relativePath}' as *;\n`;
});

fs.writeFileSync(path.join(dirs.srcPath, 'scss/style.scss'), styleImports);

console.log('[NTH] style.scss сгенерирован успешно.');

// --- Вспомогательные функции ---
function getFilesList(config) {
  let res = {
    css: [],
    js: [],
    img: [],
    blocksDirs: [],
  };

  for (let blockName in config.blocks) {
    let blockPath = path.join(config.dirs.srcPath, config.dirs.blocksDirName, blockName, '/');
    if (fs.existsSync(blockPath)) {
      // Стили
      if (fs.existsSync(path.join(blockPath, `${blockName}.scss`))) {
        res.css.push(path.join(blockPath, `${blockName}.scss`));
        if (config.blocks[blockName].length) {
          config.blocks[blockName].forEach((elementName) => {
            if (fs.existsSync(path.join(blockPath, `${blockName}${elementName}.scss`))) {
              res.css.push(path.join(blockPath, `${blockName}${elementName}.scss`));
            }
          });
        }
      }
    }
  }

  res.css = res.css.concat(config.addCssAfter);
  res.css = config.addCssBefore.concat(res.css);

  return res;
}

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

// Пример: генерируем entry.js с импортами всех JS-блоков
let jsImports = `// NOTE: This file is generated automatically. Do not edit manually.\n\n`;

lists.js.forEach((jsPath) => {
  let relativePath = jsPath.replace(/\\/g, '/').replace(/^\.?\/?src\//, '../');
  jsImports += `import '${relativePath}';\n`;
});

fs.writeFileSync(path.join(dirs.srcPath, 'js/entry.js'), jsImports);

console.log('[NTH] entry.js сгенерирован успешно.');

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
      // Скрипты
      if (fs.existsSync(path.join(blockPath, `${blockName}.js`))) {
        res.js.push(path.join(blockPath, `${blockName}.js`));
        if (config.blocks[blockName].length) {
          config.blocks[blockName].forEach((elementName) => {
            if (fs.existsSync(path.join(blockPath, `${blockName}${elementName}.js`))) {
              res.js.push(path.join(blockPath, `${blockName}${elementName}.js`));
            }
          });
        }
      }
    }
  }

  res.js = res.js.concat(config.addJsAfter);
  res.js = config.addJsBefore.concat(res.js);

  return res;
}

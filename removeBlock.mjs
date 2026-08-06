// Удаление блока: очищает projectConfig.json и удаляет папку блока
// Использование: node removeBlock.mjs [имя блока]

import fs from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logSuccess, logInfo, logWarn, logError } from './scripts/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectConfigPath = path.join(__dirname, 'projectConfig.json');
const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));

const dirs = projectConfig.dirs;
const blockName = process.argv[2];

if (!blockName) {
  logError('[removeBlock] Отмена операции: не указано имя блока');
  process.exitCode = 1;
} else {
  const dirPath = path.join(
    __dirname,
    dirs.srcPath,
    dirs.blocksDirName,
    blockName,
  );

  const inConfig = blockName in projectConfig.blocks;
  const dirExists = fs.existsSync(dirPath);

  if (!inConfig && !dirExists) {
    logWarn(`[removeBlock] Блок "${blockName}" не найден ни в projectConfig.json, ни на диске — нечего удалять`);
  } else {
    if (inConfig) {
      delete projectConfig.blocks[blockName];
      const newConfig = JSON.stringify(projectConfig, null, 2);
      fs.writeFileSync(projectConfigPath, newConfig, 'utf8');
      logSuccess(`[removeBlock] Блок "${blockName}" удалён из projectConfig.json`);
    } else {
      logInfo(`[removeBlock] Блок "${blockName}" не найден в projectConfig.json — пропускаем`);
    }

    if (dirExists) {
      await rm(dirPath, { recursive: true, force: true });
      logSuccess(`[removeBlock] Папка удалена: ${dirPath}`);
    } else {
      logInfo(`[removeBlock] Папка блока не найдена на диске: ${dirPath} — пропускаем`);
    }
  }
}

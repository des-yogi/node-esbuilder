// Находит папки блоков в src/blocks, которые НЕ подключены в projectConfig.json,
// и (опционально) удаляет их. Полезно перед архивацией проекта — чистит
// библиотечные/неиспользуемые блоки шаблона.
//
// Использование:
//   node purgeUnused.mjs           — dry-run, только показать список
//   node purgeUnused.mjs --apply   — реально удалить найденные папки

import fs from 'node:fs';
import { rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logSuccess, logInfo, logWarn } from './scripts/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectConfigPath = path.join(__dirname, 'projectConfig.json');
const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));

const dirs = projectConfig.dirs;
const blocksRoot = path.join(__dirname, dirs.srcPath, dirs.blocksDirName);
const apply = process.argv.includes('--apply');

const registeredBlocks = new Set(Object.keys(projectConfig.blocks));

const entries = await readdir(blocksRoot, { withFileTypes: true });
const dirNames = entries
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .map((e) => e.name);

const unusedBlocks = dirNames.filter((name) => !registeredBlocks.has(name));

if (!unusedBlocks.length) {
  logSuccess('[purgeUnused] Неиспользуемых блоков не найдено — всё подключено');
} else {
  logWarn(`[purgeUnused] Найдено неиспользуемых блоков: ${unusedBlocks.length}`);
  unusedBlocks.forEach((name) => logInfo(`[purgeUnused]   - ${name}`));

  if (!apply) {
    logInfo('[purgeUnused] Это тестовый прогон (dry-run). Для реального удаления запустите с флагом --apply');
  } else {
    for (const name of unusedBlocks) {
      const dirPath = path.join(blocksRoot, name);
      await rm(dirPath, { recursive: true, force: true });
      logSuccess(`[purgeUnused] Удалена папка: ${dirPath}`);
    }
  }
}

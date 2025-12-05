/**
 * clean.mjs
 * 
 * Задача очистки директории build перед сборкой.
 * 
 * Удаляет все содержимое директории build/, чтобы избежать
 * устаревших файлов от предыдущих сборок.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Очищает директорию build
 */
export async function clean() {
  console.log('[NTH] Очистка директории build...');

  const dirs = projectConfig.dirs;
  const buildDir = path.join(__dirname, '..', dirs.buildPath);

  try {
    // Удаляем директорию build со всем содержимым
    await fs.rm(buildDir, { recursive: true, force: true });
    console.log('[NTH] ✓ Директория build очищена');

    // Создаем пустую директорию build
    await fs.mkdir(buildDir, { recursive: true });
    console.log('[NTH] ✓ Директория build создана');

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при очистке build:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  clean().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

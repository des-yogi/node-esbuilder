/**
 * sprite-svg.mjs
 * 
 * Задача сборки SVG-спрайта для использования в HTML.
 * 
 * Функционал (аналог таска sprite:svg в ugspot):
 * 1. Поиск SVG-файлов для спрайта:
 *    - Обычно берутся из специальной директории, например src/blocks/sprite-svg/svg/
 *    - Или из любой директории, указанной в projectConfig
 * 
 * 2. Обработка SVG-файлов:
 *    - Оптимизация SVG (удаление лишних атрибутов, комментариев)
 *    - Формирование <symbol> элементов с id по имени файла
 *    - Объединение в единый спрайт
 * 
 * 3. Генерация спрайта:
 *    - Создание файла sprite.svg с набором <symbol>
 *    - Сохранение в build/img/sprite.svg или отдельную папку
 * 
 * 4. Использование в HTML:
 *    <svg class="icon icon-name">
 *      <use xlink:href="img/sprite.svg#icon-name"></use>
 *    </svg>
 * 
 * TODO: Этап 1 - создать заглушку с комментариями
 * TODO: Этап 2 - реализовать чтение SVG-файлов
 * TODO: Этап 3 - добавить оптимизацию через SVGO
 * TODO: Этап 4 - реализовать генерацию спрайта
 * TODO: Этап 5 - добавить генерацию preview HTML для разработчика
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Собирает SVG-спрайт
 * 
 * @param {Object} options - опции сборки
 * @param {string} options.mode - режим сборки: 'development' | 'production'
 */
export async function buildSvgSprite({ mode = 'development' } = {}) {
  console.log(`[NTH] Сборка SVG-спрайта (режим: ${mode})...`);

  const dirs = projectConfig.dirs;

  // Путь к директории с SVG-файлами для спрайта
  // Обычно это src/blocks/sprite-svg/svg/
  const svgSourceDir = path.join(
    __dirname,
    '..',
    dirs.srcPath,
    dirs.blocksDirName,
    'sprite-svg',
    'svg'
  );

  const outputDir = path.join(__dirname, '..', dirs.buildPath, 'img');
  const outputFile = path.join(outputDir, 'sprite.svg');

  try {
    // TODO: Проверить существование директории с SVG
    // if (!(await dirExists(svgSourceDir))) {
    //   console.log('[NTH] Директория для SVG-спрайта не найдена, пропускаем...');
    //   return;
    // }

    // TODO: Прочитать все SVG-файлы из директории
    // const svgFiles = await fs.readdir(svgSourceDir);
    // const svgData = [];

    // TODO: Для каждого SVG-файла:
    // 1. Прочитать содержимое
    // 2. Оптимизировать через SVGO (опционально)
    // 3. Извлечь содержимое <svg> и обернуть в <symbol>
    // 4. Установить id символа по имени файла

    // TODO: Сформировать итоговый спрайт:
    // <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
    //   <symbol id="icon-arrow" viewBox="0 0 24 24">...</symbol>
    //   <symbol id="icon-search" viewBox="0 0 24 24">...</symbol>
    // </svg>

    // TODO: Записать спрайт в build/img/sprite.svg
    // await fs.mkdir(outputDir, { recursive: true });
    // await fs.writeFile(outputFile, spriteContent);

    console.log('[NTH] TODO: Реализовать генерацию SVG-спрайта');
    console.log(`[NTH] Ожидаемый путь к SVG: ${svgSourceDir}`);
    console.log(`[NTH] Ожидаемый путь к спрайту: ${outputFile}`);

    // Временная заглушка
    console.log('[NTH] ⚠ SVG-спрайт пока не создается (заглушка)');

  } catch (error) {
    console.error('[NTH] ✗ Ошибка при сборке SVG-спрайта:', error);
    // Не пробрасываем ошибку, чтобы не блокировать весь build
    console.warn('[NTH] ⚠ Сборка продолжается без SVG-спрайта');
  }
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.env.NODE_ENV || 'development';
  buildSvgSprite({ mode }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

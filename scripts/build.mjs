/**
 * build.mjs
 * 
 * Оркестратор полной сборки проекта.
 * 
 * Последовательность задач:
 * 1. clean - очистка директории build
 * 2. generateStyle - генерация src/scss/style.scss из списков блоков
 * 3. sprite-svg - сборка SVG-спрайта (если есть)
 * 4. styles - компиляция SCSS → CSS
 * 5. scripts - сборка JavaScript через esbuild
 * 6. assets - копирование статических ресурсов
 * 7. html - сборка HTML-файлов с инклюдами
 * 
 * Режимы работы:
 * - development (по умолчанию): быстрая сборка с sourcemaps
 * - production: оптимизация, минификация, без sourcemaps
 * 
 * Использование:
 *   npm run build
 *   NODE_ENV=production npm run build
 */

import { clean } from './clean.mjs';
import { generateStyleFile } from './generateStyle.mjs';
import { buildSvgSprite } from './sprite-svg.mjs';
import { buildStyles } from './styles.mjs';
import { buildScripts } from './scripts.mjs';
import { buildAssets } from './assets.mjs';
import { buildHtml } from './html.mjs';

/**
 * Выполняет полную сборку проекта
 * 
 * @param {Object} options - опции сборки
 * @param {string} options.mode - режим сборки: 'development' | 'production'
 */
export async function build({ mode = 'development' } = {}) {
  console.log('='.repeat(60));
  console.log(`[NTH] Начало сборки проекта (режим: ${mode})`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Шаг 1: Очистка build
    await clean();

    // Шаг 2: Генерация style.scss
    console.log('\n' + '-'.repeat(60));
    generateStyleFile();

    // Шаг 3: Сборка SVG-спрайта
    console.log('\n' + '-'.repeat(60));
    await buildSvgSprite({ mode });

    // Шаг 4: Сборка стилей
    console.log('\n' + '-'.repeat(60));
    await buildStyles({ mode });

    // Шаг 5: Сборка скриптов
    console.log('\n' + '-'.repeat(60));
    await buildScripts({ mode });

    // Шаг 6: Копирование ассетов
    console.log('\n' + '-'.repeat(60));
    await buildAssets({ mode });

    // Шаг 7: Сборка HTML
    console.log('\n' + '-'.repeat(60));
    await buildHtml({ mode });

    // Итоги
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log(`[NTH] ✓ Сборка завершена успешно за ${duration}s`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('[NTH] ✗ Ошибка при сборке проекта:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Если скрипт запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.env.NODE_ENV || 'development';
  build({ mode }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

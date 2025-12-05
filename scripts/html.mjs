import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Заглушка для модуля сборки HTML.
 *
 * Должно уметь:
 * - находить исходные HTML-файлы в src/*.html;
 * - подключать куски из src/_include/*.html (аналог gulp-file-include);
 * - при необходимости подключать/инклудить HTML из блоков (src/blocks/**.html);
 * - удалять DEV-комментарии вида <!--DEV ... --> в финальной сборке;
 * - записывать собранные HTML в build/.
 *
 * На этом этапе можно реализовать простую копию файлов или оставить TODO.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export async function buildHtml() {
  console.log('[html] TODO: реализовать сборку HTML с инклюдами и удалением DEV-комментариев');
  // TODO:
  // 1) Пройтись по src/*.html (кроме _include).
  // 2) Обработать директивы инклюдов (по синтаксису, который решим использовать).
  // 3) Удалить DEV-комментарии с помощью регулярного выражения.
  // 4) Сохранить результат в build/.
}

if (import.meta.url === `file://${__filename}`) {
  buildHtml().catch((err) => {
    console.error('[html] Ошибка сборки HTML:', err);
    process.exitCode = 1;
  });
}
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFilesList } from './config.mjs';

/**
 * Генерация файла src/scss/style.scss на основе списков файлов из getFilesList().
 *
 * В gulp-версии (ugspot):
 * - формируется список SCSS-файлов блоков и глобальных стилей;
 * - для каждого добавляется строка вида:
 *   @import "../blocks/block-name/block-name";
 *
 * В новой версии можно использовать:
 * - либо @use, либо @import (пока можно оставить @import для совместимости).
 *
 * Ожидается, что getFilesList() будет возвращать массив css-путей,
 * относительно корня проекта или относительно src/scss.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcScssDir = path.join(rootDir, 'src', 'scss');
const styleEntryPath = path.join(srcScssDir, 'style.scss');

export async function generateStyleEntry() {
  const { css } = await getFilesList();

  // Пока на этапе каркаса можно использовать простой пример списка.
  const cssFiles = css.length
    ? css
    : [
        // TODO: удалить пример, когда будет реальная логика getFilesList
        // Пример: 'blocks/demo-block/demo-block.scss',
      ];

  const headerComment = [
    '// ВНИМАНИЕ!',
    '// Этот файл сгенерирован автоматически на основе projectConfig.json и данных от getFilesList().',
    '// Не редактируйте его вручную — изменения будут перезаписаны при следующей генерации.',
    '',
  ].join('\n');

  const imports = cssFiles
    .map((relativePath) => {
      // Здесь предполагаем, что пути указаны относительно src/.
      const normalized = relativePath.replace(/\\/g, '/');
      return `@import "../${normalized}";`;
    })
    .join('\n');

  const content = `${headerComment}${imports}\n`;

  await mkdir(srcScssDir, { recursive: true });
  await writeFile(styleEntryPath, content, 'utf8');

  console.log(`[generateStyle] Файл ${path.relative(rootDir, styleEntryPath)} сгенерирован.`);
}

// Позволяем запускать скрипт напрямую: `node scripts/generateStyle.mjs`
if (import.meta.url === `file://${__filename}`) {
  generateStyleEntry().catch((err) => {
    console.error('[generateStyle] Ошибка генерации style.scss:', err);
    process.exitCode = 1;
  });
}
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFilesList } from './config.mjs';
import { logInfo, logError } from './logger.mjs';

/**
 * Генерация файла src/scss/style.scss на основе списков файлов из getFilesList().
 *
 * Модель:
 * - Каждый блоковый/страничный SCSS (например, src/blocks/page/page.scss)
 *   сам делает @use '../../scss/variables.scss' as *; и т.п.
 * - Этот скрипт НЕ лезет внутрь этих файлов, он только формирует список
 *   @use в style.scss.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcScssDir = path.join(rootDir, 'src', 'scss');
const styleEntryPath = path.join(srcScssDir, 'style.scss');

/**
 * "src/blocks/page/page.scss" -> "../blocks/page/page"
 * "src/scss/variables.scss"   -> "./variables.scss"
 */
function toUsePath(absLikePathFromRoot) {
  const normalized = absLikePathFromRoot.replace(/\\/g, '/');
  const srcRoot = 'src/';

  if (!normalized.startsWith(srcRoot)) {
    return normalized;
  }

  const relativeFromSrc = normalized.slice(srcRoot.length); // "scss/variables.scss" или "blocks/page/page.scss"
  const fromScssDir = path.posix.relative('scss', relativeFromSrc); // "../blocks/page/page.scss" или "variables.scss"

  if (fromScssDir.endsWith('.scss')) {
    const withoutExt = fromScssDir.slice(0, -5); // убираем ".scss"
    return withoutExt.startsWith('.') || withoutExt.startsWith('..')
      ? withoutExt
      : `./${withoutExt}`;
  }

  return fromScssDir.startsWith('.') || fromScssDir.startsWith('..')
    ? fromScssDir
    : `./${fromScssDir}`;
}

export async function generateStyleEntry() {
  const { css } = await getFilesList();
  logInfo('[generateStyle] Генерация style.scss');

  const headerComment = [
    '// ВНИМАНИЕ!',
    '// Этот файл сгенерирован автоматически на основе projectConfig.json и getFilesList().',
    '// Не редактируйте его вручную — изменения будут перезаписаны при следующей генерации.',
    '',
  ].join('\n');

  const lines = [];

  // 1) addCssBefore
  if (css.before.length) {
    lines.push('// Подключения из addCssBefore:');
    for (const p of css.before) {
      const usePath = toUsePath(p);
      lines.push(`@use '${usePath}' as *;`);
    }
    lines.push('');
  }

  // 2) Блоки
  if (css.blocks.length) {
    lines.push('// SCSS-файлы блоков из projectConfig.blocks:');
    for (const p of css.blocks) {
      const usePath = toUsePath(p);
      lines.push(`@use '${usePath}';`);
    }
    lines.push('');
  }

  // 3) addCssAfter
  if (css.after.length) {
    lines.push('// Подключения из addCssAfter:');
    for (const p of css.after) {
      const usePath = toUsePath(p);
      lines.push(`@use '${usePath}' as *;`);
    }
    lines.push('');
  }

  const content = `${headerComment}${lines.join('\n')}\n`;

  await mkdir(srcScssDir, { recursive: true });
  await writeFile(styleEntryPath, content, 'utf8');

  logInfo('[generateStyle] style.scss сгенерирован: ' + path.relative(rootDir, styleEntryPath));
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  generateStyleEntry().catch((err) => {
    logError('[generateStyle] Ошибка генерации style.scss: ' + err.message);
    process.exitCode = 1;
  });
}

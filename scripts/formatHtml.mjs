import { readFile, writeFile } from 'node:fs/promises';
import prettier from 'prettier';
import { logInfo, logWarn, logError } from './logger.mjs';

/*export async function formatHtmlFile(filePath) {
  try {
    const source = await readFile(filePath, 'utf8');

    const formatted = await prettier.format(source, {
      parser: 'html',
      printWidth: 100,
      htmlWhitespaceSensitivity: 'css',
      bracketSameLine: true,
      singleAttributePerLine: false,
      useTabs: false,
      tabWidth: 2,
    });

    await writeFile(filePath, formatted, 'utf8');
    logInfo(`[prettier] Отформатирован HTML: ${filePath}`);
  } catch (err) {
    logError(`[prettier] Не удалось отформатировать ${filePath}: ${err.message}`);
    throw err;
  }
}*/
// HTML void elements — self-closing slash on them is meaningless in HTML5
// and flagged by the W3C validator. Prettier has no option to disable
// adding it, so we strip it in a post-processing pass.
const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
];
const voidSlashRe = new RegExp(
  `(<(?:${VOID_ELEMENTS.join('|')})\\b[^>]*?)\\s*/>`,
  'gi',
);

export async function formatHtmlFile(filePath) {
  try {
    const source = await readFile(filePath, 'utf8');

    let formatted = await prettier.format(source, {
      parser: 'html',
      printWidth: 100,
      htmlWhitespaceSensitivity: 'css',
      bracketSameLine: true,
      singleAttributePerLine: false,
      useTabs: false,
      tabWidth: 2,
    });

    // Remove the trailing slash Prettier adds to void elements (<meta ... />)
    formatted = formatted.replace(voidSlashRe, '$1>');

    await writeFile(filePath, formatted, 'utf8');
    logInfo(`[prettier] Отформатирован HTML: ${filePath}`);
  } catch (err) {
    logError(`[prettier] Не удалось отформатировать ${filePath}: ${err.message}`);
    throw err;
  }
}

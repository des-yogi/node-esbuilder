import { readFile, writeFile } from 'node:fs/promises';
import prettier from 'prettier';
import { logInfo, logWarn, logError } from './logger.mjs';

export async function formatHtmlFile(filePath) {
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
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';
import { HtmlValidate } from 'html-validate';
import { logWarn, logError } from './logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    'attr-quotes': 'off',        // одинарные/двойные кавычки — не важно, стиль
    'no-trailing-whitespace': 'off', // пробелы в конце строк — не влияет на валидность
    'no-inline-style': 'off',    // инлайн-стили — осознанное решение проекта, не ошибка
    'unique-landmark': 'off',
    'prefer-native-element': 'off',
    'wcag/h32': 'off',
    'tel-non-breaking': 'off',
    'prefer-tbody': 'off',
    'no-raw-characters': 'off',
    'form-dup-name': 'off',
    'no-dup-class': 'off',
  },
});

/**
 * Валидирует все build/*.html через html-validate и выводит найденные
 * проблемы как предупреждения (жёлтым, через logWarn).
 *
 * ВАЖНО: никогда не бросает исключение — ошибки валидации разметки
 * (или сбой самого валидатора) не должны прерывать dev-сервер.
 */
export async function lintHtml() {
  let entries;
  try {
    entries = await readdir(buildDir, { withFileTypes: true });
  } catch (err) {
    // build/ ещё не существует — нечего проверять
    return;
  }

  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.join(buildDir, entry.name));

  if (htmlFiles.length === 0) {
    return;
  }

  try {
    const report = await htmlvalidate.validateMultipleFiles(htmlFiles);

    if (report.valid) {
      return;
    }

    for (const result of report.results) {
      if (result.messages.length === 0) continue;

      const relPath = path.relative(rootDir, result.filePath);
      for (const msg of result.messages) {
        logWarn(`[html-validate] ${relPath}:${msg.line}:${msg.column} — ${msg.message} (${msg.ruleId})`);
      }
    }
  } catch (err) {
    logError('[html-validate] Ошибка валидации: ' + err.message);
  }
}

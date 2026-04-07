import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { logInfo, logWarn, logError } from './logger.mjs';
import { formatHtmlFile } from './formatHtml.mjs';

/**
 * Сборка HTML:
 * - находит файлы src/*.html;
 * - разворачивает @@include('...', { ...context... }) относительно src/;
 * - обрабатывает условные конструкции @@if(flag)/@@else/@@endif;
 * - подставляет переменные @@var и @@obj.prop из контекста;
 * - удаляет DEV-комментарии <!--DEV ... -->;
 * - сохраняет результат в build/*.html.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');

// @@include('path.html') или @@include("path.html", { ... })
const INCLUDE_RE =
  /@@include\(\s*(['"])(.+?)\1\s*(?:,\s*({[\s\S]*?}))?\s*\)/g;

// @@var или @@user.name или @@socials.fb
const VAR_RE = /@@([a-zA-Z_$][\w$.]*)/g;

// DEV-блоки: <!--DEV ... -->
const DEV_COMMENT_RE = /<!--DEV[\s\S]*?-->/g;

// @@if(flag) ... @@endif  или  @@if(flag) ... @@else ... @@endif
// Используем более точный паттерн: ifBlock не может содержать @@else/@@endif
// (это предотвращает захват нескольких последовательных блоков как одного)
const IF_RE = /@@if\(\s*(!?\s*[\w$.]+)\s*\)([\s\S]*?)@@(?:else([\s\S]*?)@@)?endif/g;

/**
 * Достаёт значение по пути вида "user.name.first" из объекта context.
 */
function resolveVar(pathExpr, context) {
  const parts = pathExpr.split('.');
  let value = context;

  for (const key of parts) {
    if (value && Object.prototype.hasOwnProperty.call(value, key)) {
      value = value[key];
    } else {
      return ''; // если нет такого ключа — возвращаем пустую строку
    }
  }

  return value ?? '';
}

/**
 * NEW: Вычисляет условие для @@if.
 * Поддерживает простые ф��аги (isPicture) и отрицание (!isPicture).
 * Вложенные свойства тоже работают (user.isAdmin).
 */
function evaluateCondition(expr, context) {
  var trimmed = expr.trim();
  var negated = trimmed.charAt(0) === '!';
  var varName = negated ? trimmed.slice(1).trim() : trimmed;

  var value = resolveVar(varName, context);

  // Считаем truthy всё, кроме: '', false, null, undefined, 0
  var truthy = value !== '' && value !== false && value !== null
    && value !== undefined && value !== 0;

  return negated ? !truthy : truthy;
}

/**
 * NEW: Обрабатывает @@if(flag)...@@else...@@endif в содержимом.
 * Вложенные @@if НЕ поддерживаются — при обнаружении бросает ошибку.
 */
function applyConditionals(content, context) {
  if (!context || typeof context !== 'object') {
    return content;
  }

  // Сначала убираем HTML-комментарии, содержащие @@if,
  // чтобы закомментированные условия не обрабатывались
  var cleaned = content.replace(/<!--[\s\S]*?-->/g, function (comment) {
    // Если внутри комментария есть @@if — удаляем весь комментарий
    if (/@@if\(/.test(comment)) {
      return '';
    }
    return comment;
  });

  var result = cleaned.replace(IF_RE, function (match, condition, ifBlock, elseBlock) {
    if (evaluateCondition(condition, context)) {
      return ifBlock;
    }
    return elseBlock || '';
  });

  return result;
}

/**
 * Применяет переменные @@var / @@obj.prop к строке content.
 */
function applyVariables(content, context) {
  if (!context || typeof context !== 'object') {
    return content;
  }

  return content.replace(VAR_RE, (match, pathExpr) => {
    // Сначала пробуем полный путь (для случаев вида @@user.name)
    const fullValue = resolveVar(pathExpr, context);
    if (fullValue !== '') {
      return String(fullValue);
    }

    // Если полный путь не найден — пробуем укороченные варианты
    // (для случаев вида @@img.jpg, где .jpg — расширение файла, а не свойство)
    const parts = pathExpr.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {
      const shortPath = parts.slice(0, i).join('.');
      const shortValue = resolveVar(shortPath, context);
      if (shortValue !== '') {
        const remainder = '.' + parts.slice(i).join('.');
        return String(shortValue) + remainder;
      }
    }

    return '';
  });
}

/**
 * Рекурсивно читает HTML-файл из srcDir и разворачивает include'ы,
 * применяя контекст переменных.
 *
 * @param {string} relPath - путь относительно srcDir, напр. "index.html" или "_include/page_head.html"
 * @param {object} context - текущий контекст переменных
 * @param {Set<string>} [stack] - защита от циклических include'ов
 */
async function processHtmlFile(relPath, context = {}, stack = new Set()) {
  const normalized = relPath.replace(/\\/g, '/');

  if (stack.has(normalized)) {
    throw new Error(
      `[html] Обнаружен циклический include: ${Array.from(stack).join(
        ' -> ',
      )} -> ${normalized}`,
    );
  }

  stack.add(normalized);

  const absPath = path.join(srcDir, normalized);
  let content;
  try {
    content = await readFile(absPath, 'utf8');
  } catch (err) {
    throw new Error(
      `[html] Не удалось прочитать ${path.relative(
        rootDir,
        absPath,
      )}: ${err.message}`,
    );
  }

  // Сначала удаляем DEV-комментарии, чтобы не обрабатывать @@include внутри них
  const withoutDev = content.replace(DEV_COMMENT_RE, '');

  const withIncludes = await expandIncludes(
    withoutDev,
    path.dirname(normalized),
    context,
    stack,
  );

  // NEW: обработка @@if/@@else/@@endif (между инклудами и переменными)
  const withConditions = applyConditionals(withIncludes, context);

  const withVars = applyVariables(withConditions, context);

  stack.delete(normalized);
  return withVars;
}

/**
 * Обрабатывает @@include(...) в содержимом.
 *
 * @param {string} content - HTML содержимое
 * @param {string} baseRelDir - базовая относительная директория (относительно srcDir)
 * @param {object} context - текущий контекст переменных
 * @param {Set<string>} stack - стек путей для защиты от циклов
 */
async function expandIncludes(content, baseRelDir, context, stack) {
  const matches = [];
  content.replace(
    INCLUDE_RE,
    (match, quote, includePath, jsonContext, offset) => {
      matches.push({ match, includePath, jsonContext, offset });
      return match;
    },
  );

  if (matches.length === 0) {
    return content;
  }

  const resolvedPieces = await Promise.all(
    matches.map(async (m) => {
      const includeRel = path
        .join(baseRelDir, m.includePath)
        .replace(/\\/g, '/');

      // Локальный контекст из JSON (если есть)
      let localCtx = {};
      if (m.jsonContext) {
        try {
          localCtx = JSON.parse(m.jsonContext);
        } catch (err) {
          throw new Error(
            `[html] Не удалось распарсить JSON-контекст в include для "${includeRel}": ${err.message}\nJSON: ${m.jsonContext}`,
          );
        }
      }

      // Контекст дочернего include: родительский + локальный
      const childContext = {
        ...context,
        ...localCtx,
      };

      // Рекурсивно обрабатываем подключаемый файл с новым контекстом
      const included = await processHtmlFile(
        includeRel,
        childContext,
        stack,
      );
      return included;
    }),
  );

  // Заменяем include'ы с конца, чтобы не сбивать индексы
  let result = content;
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const m = matches[i];
    const piece = resolvedPieces[i];
    result =
      result.slice(0, m.offset) +
      piece +
      result.slice(m.offset + m.match.length);
  }

  return result;
}

export async function buildHtml({ mode = 'development' } = {}) {
  logInfo('[html] Старт сборки HTML с инклюдами и переменными');

  await mkdir(buildDir, { recursive: true });

  let entries;
  try {
    entries = await readdir(srcDir, { withFileTypes: true });
  } catch (err) {
    logError('[html] Не удалось прочитать каталог src: ' + err.message);
    throw err;
  }

  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => entry.name)
    .sort();

  if (htmlFiles.length === 0) {
    logWarn('[html] В src/ нет HTML-файлов, пропускаем HTML-сборку');
    return;
  }

  for (const fileName of htmlFiles) {
    const relPath = fileName;
    let processed = await processHtmlFile(relPath, {});

    // Удаляем DEV-комментарии <!--DEV ... -->
    processed = processed.replace(DEV_COMMENT_RE, '');

    const destPath = path.join(buildDir, fileName);
    await writeFile(destPath, processed, 'utf8');
    if (mode === 'production') {
      await formatHtmlFile(destPath);
    }

    logInfo('[html] Собран HTML: ' + path.relative(rootDir, destPath));
  }

  logInfo('[html] Сборка HTML завершена');
}

// Позволяем запускать модуль напрямую: `node scripts/html.mjs`
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  buildHtml().catch((err) => {
    logError('[html] Ошибка сборки HTML: ' + err.message);
    process.exitCode = 1;
  });
}

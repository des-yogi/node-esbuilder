#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProjectConfig } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function extractBootstrapOrder() {
  const bootstrapScssPath = path.join(rootDir, 'node_modules', 'bootstrap', 'scss', 'bootstrap.scss');
  let content;
  try {
    content = await readFile(bootstrapScssPath, 'utf8');
  } catch (err) {
    console.warn('[generateBootstrapImports] Не удалось прочитать bootstrap.scss:', err.message);
    return [];
  }

  // Найдём блок между scss-docs-start import-stack и scss-docs-end import-stack
  const startMark = /\/\/\s*scss-docs-start import-stack/;
  const endMark = /\/\/\s*scss-docs-end import-stack/;
  const startIdx = content.search(startMark);
  const endIdx = content.search(endMark);

  const slice = (startIdx >= 0 && endIdx > startIdx) ? content.slice(startIdx, endIdx) : content;

  // Извлечём строки @import "name";
  const re = /@import\s+["']([^"']+)["'];/g;
  const parts = [];
  let m;
  while ((m = re.exec(slice)) !== null) {
    parts.push(m[1]); // например "functions", "variables", "dropdown"
  }
  // Вернём список с full path 'bootstrap/scss/<name>'
  return parts.map((name) => `bootstrap/scss/${name}`);
}

function normalizePathForCompare(p) {
  if (!p) return p;
  return p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\.scss$/, '').replace(/^node_modules\//, '');
}

export async function buildBootstrapImports() {
  const projectConfig = await readProjectConfig();
  const cssBefore = Array.isArray(projectConfig.addCssBefore) ? projectConfig.addCssBefore : [];
  const normalizedBefore = cssBefore.map(normalizePathForCompare);

  const order = await extractBootstrapOrder();
  if (!order.length) {
    console.warn('[generateBootstrapImports] Не найден порядок в bootstrap.scss, пропускаем.');
    return [];
  }

  const resultLines = [];
  for (const item of order) {
    const short = normalizePathForCompare(item); // 'bootstrap/scss/functions'
    // считаем, что совпадение есть, если в конфиге есть либо 'bootstrap/scss/functions' либо 'node_modules/bootstrap/scss/_functions' и т.п.
    const matches = normalizedBefore.some((b) => b.endsWith(short) || short.endsWith(b) || b.includes(short.replace('bootstrap/scss/','')));
    if (matches) {
      // используем @import для совместимости
      resultLines.push(`@import '${item}';`);
    }
  }
  return resultLines;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildBootstrapImports().then(lines => {
    console.log(lines.join('\n'));
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
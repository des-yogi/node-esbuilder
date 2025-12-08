import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Сборка SVG-спрайта блока sprite-svg.
 *
 * Схема:
 * - исходники: src/blocks/sprite-svg/svg/*.svg
 * - выходной файл: build/img/sprite-svg.svg
 * - id для <symbol> = имя файла без .svg (icon-name.svg -> icon-name)
 */

const srcIconsDir = path.join(rootDir, 'src', 'blocks', 'sprite-svg', 'svg');
const buildImgDir = path.join(rootDir, 'build', 'img');
const spriteOutputPath = path.join(buildImgDir, 'sprite-svg.svg');

export async function buildSvgSprite() {
  console.log('[sprite-svg] Старт сборки SVG-спрайта');

  let files;
  try {
    files = await readdir(srcIconsDir, { withFileTypes: true });
  } catch (err) {
    // Если директории нет — просто логируем и выходим без ошибки,
    // чтобы не ломать сборку на проектах без sprite-svg.
    console.log(
      '[sprite-svg] Каталог с иконками не найден, пропускаем сборку спрайта:',
      path.relative(rootDir, srcIconsDir),
    );
    return;
  }

  const svgFiles = files
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
    .map((entry) => entry.name)
    .sort(); // стабильный детерминированный порядок

  if (svgFiles.length === 0) {
    console.log('[sprite-svg] В каталоге нет SVG-файлов, спрайт собирать нечего');
    return;
  }

  const symbols = [];

  for (const fileName of svgFiles) {
    const filePath = path.join(srcIconsDir, fileName);
    const raw = await readFile(filePath, 'utf8');

    // Выдёргиваем содержимое <svg>...</svg> без обёртки; допускаем простые варианты.
    const svgContentMatch = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    const innerContent = svgContentMatch ? svgContentMatch[1].trim() : raw.trim();

    const id = fileName.replace(/\.svg$/i, '');

    const symbol = `<symbol id="${id}" xmlns="http://www.w3.org/2000/svg">${innerContent}</symbol>`;
    symbols.push(symbol);
  }

  const spriteContent = [
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
    ...symbols,
    '</svg>',
    '',
  ].join('\n');

  await mkdir(buildImgDir, { recursive: true });
  await writeFile(spriteOutputPath, spriteContent, 'utf8');

  console.log(
    '[sprite-svg] Спрайт собран:',
    path.relative(rootDir, spriteOutputPath),
  );
}

// Позволяем запускать модуль напрямую: `node scripts/sprite-svg.mjs`
if (import.meta.url === `file://${__filename}`) {
  buildSvgSprite().catch((err) => {
    console.error('[sprite-svg] Ошибка сборки SVG-спрайта:', err);
    process.exitCode = 1;
  });
}
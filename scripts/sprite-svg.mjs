import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';
import svgoConfig from '../svgo.config.mjs';
import { logInfo, logWarn, logError } from './logger.mjs';

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

function getAttr(attrsStr, attrName) {
  const escapedName = attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escapedName}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = attrsStr.match(re);
  return m ? m[1] : null;
}

export async function buildSvgSprite() {
  logInfo('[sprite-svg] Старт сборки SVG-спрайта');

  let files;
  try {
    files = await readdir(srcIconsDir, { withFileTypes: true });
  } catch (err) {
    // Если директории нет — просто логируем и выходим без ошибки,
    // чтобы не ломать сборку на проектах без sprite-svg.
    logWarn(
      '[sprite-svg] Каталог с иконками не найден, пропускаем сборку спрайта: ' +
        path.relative(rootDir, srcIconsDir),
    );
    return;
  }

  const svgFiles = files
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
    .map((entry) => entry.name)
    .sort(); // стабильный детерминированный порядок

  if (svgFiles.length === 0) {
    logWarn('[sprite-svg] В каталоге нет SVG-файлов, спрайт собирать нечего');
    return;
  }

  const symbols = [];

  for (const fileName of svgFiles) {
    const filePath = path.join(srcIconsDir, fileName);
    const raw = await readFile(filePath, 'utf8');

    // Оптимизируем SVG перед встраиванием в спрайт.
    const optimized = optimize(raw, svgoConfig);

    if (optimized.error) {
      throw new Error(
        `[sprite-svg] SVGO ошибка в файле ${path.relative(rootDir, filePath)}: ${optimized.error}`,
      );
    }

    const svgSource = optimized.data;

    // Извлекаем открывающий тег <svg ...>
    const svgOpenMatch = svgSource.match(/<svg([^>]*)>/i);
    const svgAttrsStr = svgOpenMatch ? svgOpenMatch[1] : '';

    // Переносим ключевые атрибуты из <svg> в <symbol>
    const viewBox = getAttr(svgAttrsStr, 'viewBox');
    const width = getAttr(svgAttrsStr, 'width');
    const height = getAttr(svgAttrsStr, 'height');
    const fill = getAttr(svgAttrsStr, 'fill');
    const xmlnsXlink = getAttr(svgAttrsStr, 'xmlns:xlink');

    const extraAttrs = [
      viewBox ? `viewBox="${viewBox}"` : '',
      width ? `width="${width}"` : '',
      height ? `height="${height}"` : '',
      fill ? `fill="${fill}"` : '',
      xmlnsXlink ? `xmlns:xlink="${xmlnsXlink}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    // Выдёргиваем содержимое <svg>...</svg> без обёртки
    const svgContentMatch = svgSource.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    const innerContent = svgContentMatch ? svgContentMatch[1].trim() : svgSource.trim();

    const id = fileName.replace(/\.svg$/i, '');

    const symbolAttrs = `id="${id}" xmlns="http://www.w3.org/2000/svg"${extraAttrs ? ` ${extraAttrs}` : ''}`;
    const symbol = `<symbol ${symbolAttrs}>${innerContent}</symbol>`;
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

  logInfo(
    '[sprite-svg] Спрайт собран: ' + path.relative(rootDir, spriteOutputPath),
  );
}

// Позволяем запускать модуль напрямую: `node scripts/sprite-svg.mjs`
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  buildSvgSprite().catch((err) => {
    logError('[sprite-svg] Ошибка сборки SVG-спрайта: ' + err.message);
    process.exitCode = 1;
  });
}
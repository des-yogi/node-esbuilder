/**
 * Заглушка для генерации SVG-спрайта.
 *
 * Идея:
 * - в projectConfig.blocks должен быть блок "sprite-svg";
 * - исходные иконки лежат, например, в src/blocks/sprite-svg/svg/*.svg;
 * - итоговый спрайт должен оказаться в src/blocks/sprite-svg/img/sprite-svg.svg
 *   (или сразу в build/img, в зависимости от того, как решим);
 * - вёрстка будет использовать <use xlink:href="img/sprite-svg.svg#icon-name">.
 *
 * Для реализации можно использовать одну из библиотек для svg-спрайтов
 * или собрать спрайт вручную, склеивая <symbol>...</symbol>.
 */

export async function buildSvgSprite() {
  console.log('[sprite-svg] TODO: реализовать сборку SVG-спрайта блока sprite-svg');
}

if (import.meta.url === import.meta.url) {
  // запуск напрямую: node scripts/sprite-svg.mjs
  buildSvgSprite().catch((err) => {
    console.error('[sprite-svg] Ошибка сборки SVG-спрайта:', err);
    process.exitCode = 1;
  });
}
import { rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Очистка каталога build/.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

export async function cleanBuild() {
  console.log('[clean] Очистка каталога build/');
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });
}

if (import.meta.url === `file://${__filename}`) {
  cleanBuild().catch((err) => {
    console.error('[clean] Ошибка очистки:', err);
    process.exitCode = 1;
  });
}
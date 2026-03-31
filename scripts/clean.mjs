import { rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logInfo, logError } from './logger.mjs';

/**
 * Очистка каталога build/.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

export async function cleanBuild() {
  logInfo('[clean] Очистка каталога build/');
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  cleanBuild().catch((err) => {
    logError('[clean] Ошибка очистки: ' + err.message);
    process.exitCode = 1;
  });
}
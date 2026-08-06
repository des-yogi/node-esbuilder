import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rm, cp } from 'node:fs/promises';
import { logInfo, logError, logSuccess, logWarn } from './logger.mjs';
import { build } from './build.mjs';

/**
 * Deploy содержимого build/ в папку docs/ ветки master (GitHub Pages).
 *
 * Алгоритм:
 * 1. Production-сборка (npm run build) — на текущей рабочей ветке
 * 2. Очистка старой docs/ и копирование build/ → docs/
 * 3. Переключение на master, git add docs/ + commit
 * 4. git push origin master
 * 5. Возврат на исходную рабочую ветку
 *
 * Не требует сторонних пакетов — только git и встроенный fs.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BUILD_DIR = 'build';
const DOCS_DIR = 'docs';
const DEPLOY_BRANCH = 'master';

function exec(cmd, opts) {
  return execSync(cmd, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    ...opts,
  });
}

/**
 * Проверяет, что рабочая директория — git-репозиторий
 * и есть настроенный remote origin.
 */
function checkGitSetup() {
  try {
    exec('git rev-parse --is-inside-work-tree');
  } catch (err) {
    throw new Error('Текущая директория не является git-репозиторием');
  }

  try {
    exec('git remote get-url origin');
  } catch (err) {
    throw new Error(
      'Remote "origin" не настроен. Добавьте remote:\n'
      + '  git remote add origin <url>'
    );
  }
}

/**
 * Возвращает имя текущей ветки.
 */
function getCurrentBranch() {
  return exec('git rev-parse --abbrev-ref HEAD').trim();
}

/**
 * Форматирует текущее локальное время системы как "YYYY-MM-DD HH:mm:ss".
 * В отличие от toISOString(), не конвертирует в UTC.
 */
function formatLocalTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  return now.getFullYear()
    + '-' + pad(now.getMonth() + 1)
    + '-' + pad(now.getDate())
    + ' ' + pad(now.getHours())
    + ':' + pad(now.getMinutes())
    + ':' + pad(now.getSeconds());
}

/**
 * Копирует build/ → docs/, предварительно очищая старое содержимое docs/,
 * чтобы там не оставались файлы от предыдущих сборок.
 */
async function copyBuildToDocs() {
  const buildPath = path.join(rootDir, BUILD_DIR);
  const docsPath = path.join(rootDir, DOCS_DIR);

  await rm(docsPath, { recursive: true, force: true });
  await cp(buildPath, docsPath, { recursive: true });
}

export async function deploy() {
  logInfo('[deploy] Старт деплоя в "' + DEPLOY_BRANCH + '/' + DOCS_DIR + '/"');

  // 1. Проверки
  checkGitSetup();
  const originalBranch = getCurrentBranch();

  // 2. Production-сборка — на текущей рабочей ветке
  logInfo('[deploy] Запуск production-сборки...');
  await build({ mode: 'production' });

  // 3. Копируем build/ → docs/ (файловая операция, от git-ветки не зависит)
  logInfo('[deploy] Копирование ' + BUILD_DIR + '/ → ' + DOCS_DIR + '/...');
  await copyBuildToDocs();

  // 4. Переключаемся на master (если ещё не на нём)
  const needSwitchBack = originalBranch !== DEPLOY_BRANCH;
  if (needSwitchBack) {
    logInfo('[deploy] Переключение с "' + originalBranch + '" на "' + DEPLOY_BRANCH + '"...');
    try {
      exec('git checkout ' + DEPLOY_BRANCH);
    } catch (err) {
      throw new Error(
        '[deploy] Не удалось переключиться на "' + DEPLOY_BRANCH + '": ' + err.message
        + '\nВозможно, есть незакоммиченные изменения в отслеживаемых файлах — закоммитьте или застэшьте их.'
      );
    }
  }

  try {
    // 5. Добавляем docs/ в индекс git
    logInfo('[deploy] Добавление ' + DOCS_DIR + '/ в git-индекс...');
    exec('git add --force ' + DOCS_DIR);

    // 6. Коммитим изменения в master
    // const commitMsg = 'deploy: ' + new Date().toISOString().slice(0, 19).replace('T', ' ');
    const commitMsg = 'deploy: ' + formatLocalTimestamp();
    try {
      exec('git commit -m "' + commitMsg + '"');
    } catch (err) {
      // Если нечего коммитить (docs/ не изменился) — это нормально,
      // всё равно пушим текущее состояние
      if (!/nothing to commit/.test(err.message + err.stdout + err.stderr)) {
        throw err;
      }
      logInfo('[deploy] ' + DOCS_DIR + '/ не изменился, коммит пропущен');
    }

    // 7. Пушим master
    logInfo('[deploy] Публикация в ветку "' + DEPLOY_BRANCH + '"...');
    exec('git push origin ' + DEPLOY_BRANCH);

    logSuccess('[deploy] ✅ Опубликовано в "' + DEPLOY_BRANCH + '/' + DOCS_DIR + '/"');
  } catch (err) {
    throw new Error('[deploy] Ошибка публикации: ' + err.message);
  } finally {
    // 8. Возвращаемся на исходную рабочую ветку в любом случае
    if (needSwitchBack) {
      logInfo('[deploy] Возврат на ветку "' + originalBranch + '"...');
      try {
        exec('git checkout ' + originalBranch);
      } catch (err) {
        logWarn(
          '[deploy] Не удалось вернуться на "' + originalBranch + '": ' + err.message
          + '\nПроверьте текущую ветку вручную (git branch).'
        );
      }
    }
  }

  // Подсказка
  let remoteUrl = '';
  try {
    remoteUrl = exec('git remote get-url origin').trim();
  } catch (e) { /* ignore */ }

  if (remoteUrl.indexOf('github.com') !== -1) {
    const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) {
      logInfo('[deploy] GitHub Pages: https://'
        + match[1].split('/')[0] + '.github.io/'
        + match[1].split('/')[1] + '/');
      logInfo('[deploy] Не забудь включить Pages в настройках репозитория:');
      logInfo('[deploy]   Settings → Pages → Branch: "' + DEPLOY_BRANCH + '" / ' + DOCS_DIR);
    }
  }
}

/**
 * Полностью удаляет docs/ из ветки master (откат публикации).
 *
 * Алгоритм:
 * 1. Переключение на master
 * 2. git rm -r docs/ + commit
 * 3. git push origin master
 * 4. Возврат на исходную рабочую ветку
 */
export async function undeploy() {
  logInfo('[deploy] Удаление "' + DOCS_DIR + '/" из ветки "' + DEPLOY_BRANCH + '"');

  checkGitSetup();
  const originalBranch = getCurrentBranch();
  const needSwitchBack = originalBranch !== DEPLOY_BRANCH;

  if (needSwitchBack) {
    logInfo('[deploy] Переключение с "' + originalBranch + '" на "' + DEPLOY_BRANCH + '"...');
    try {
      exec('git checkout ' + DEPLOY_BRANCH);
    } catch (err) {
      throw new Error(
        '[deploy] Не удалось переключиться на "' + DEPLOY_BRANCH + '": ' + err.message
        + '\nВозможно, есть незакоммиченные изменения в отслеживаемых файлах — закоммитьте или застэшьте их.'
      );
    }
  }

  try {
    logInfo('[deploy] Удаление ' + DOCS_DIR + '/ из git-индекса и диска...');
    exec('git rm -r --ignore-unmatch ' + DOCS_DIR);

    // На случай, если docs/ была в .gitignore и git rm её не затронула
    await rm(path.join(rootDir, DOCS_DIR), { recursive: true, force: true });

    // const commitMsg = 'undeploy: remove ' + DOCS_DIR + ' '
    //   + new Date().toISOString().slice(0, 19).replace('T', ' ');
    const commitMsg = 'undeploy: remove ' + DOCS_DIR + ' ' + formatLocalTimestamp();
    try {
      exec('git commit -m "' + commitMsg + '"');
    } catch (err) {
      if (!/nothing to commit/.test(err.message + err.stdout + err.stderr)) {
        throw err;
      }
      logInfo('[deploy] Нечего удалять, ' + DOCS_DIR + '/ уже отсутствует');
    }

    logInfo('[deploy] Публикация в ветку "' + DEPLOY_BRANCH + '"...');
    exec('git push origin ' + DEPLOY_BRANCH);

    logSuccess('[deploy] ✅ "' + DOCS_DIR + '/" удалена из "' + DEPLOY_BRANCH + '"');
  } catch (err) {
    throw new Error('[deploy] Ошибка удаления: ' + err.message);
  } finally {
    if (needSwitchBack) {
      logInfo('[deploy] Возврат на ветку "' + originalBranch + '"...');
      try {
        exec('git checkout ' + originalBranch);
      } catch (err) {
        logWarn(
          '[deploy] Не удалось вернуться на "' + originalBranch + '": ' + err.message
          + '\nПроверьте текущую ветку вручную (git branch).'
        );
      }
    }
  }
}

// --- Автозапуск при прямом вызове ---
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  const action = process.argv.includes('--remove') ? undeploy : deploy;
  action().catch(function (err) {
    logError('[deploy] ' + err.message);
    process.exitCode = 1;
  });
}

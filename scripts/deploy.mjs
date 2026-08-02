import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logInfo, logError, logSuccess } from './logger.mjs';
import { build } from './build.mjs';

/**
 * Deploy содержимого build/ в ветку docs (GitHub Pages).
 *
 * Алгоритм:
 * 1. Production-сборка (npm run build)
 * 2. git subtree split — выделяем build/ в отдельное дерево
 * 3. git push --force — пушим в ветку docs
 *
 * Не требует сторонних пакетов — только git.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEPLOY_BRANCH = 'docs';
const BUILD_DIR = 'build';

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
 * Проверяет, что в build/ есть файлы.
 */
function checkBuildExists() {
  try {
    var files = exec('git ls-files --others --cached ' + BUILD_DIR).trim();
    if (!files) {
      throw new Error('пусто');
    }
  } catch (err) {
    throw new Error(
      'Каталог ' + BUILD_DIR + '/ пуст или не существует. '
      + 'Сборка могла завершиться с ошибкой.'
    );
  }
}

export async function deploy() {
  logInfo('[deploy] Старт деплоя в ветку "' + DEPLOY_BRANCH + '"');

  // 1. Проверки
  checkGitSetup();

  // 2. Production-сборка
  logInfo('[deploy] Запуск production-сборки...');
  await build({ mode: 'production' });

  // 3. Добавляем build/ в индекс git (он может быть в .gitignore)
  //    --force позволяет добавить даже игнорируемые файлы
  logInfo('[deploy] Добавление build/ в git-индекс...');
  exec('git add --force ' + BUILD_DIR);

  // 4. Создаём временный коммит с содержимым build/
  //    (нужен для git subtree split)
  var commitMsg = 'deploy: ' + new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    exec('git commit -m "' + commitMsg + '"');
  } catch (err) {
    // Если нечего коммитить (build не изменился) — это нормально,
    // всё равно пушим текущее состояние
    if (!/nothing to commit/.test(err.message + err.stdout + err.stderr)) {
      throw err;
    }
    logInfo('[deploy] Build не изменился, пушим текущее состояние');
  }

  checkBuildExists();

  // 5. Выделяем build/ в отдельное дерево и пушим в docs
  logInfo('[deploy] Публикация в ветку "' + DEPLOY_BRANCH + '"...');
  try {
    var splitHash = exec('git subtree split --prefix ' + BUILD_DIR + ' HEAD').trim();
    exec('git push origin ' + splitHash + ':refs/heads/' + DEPLOY_BRANCH + ' --force');
  } catch (err) {
    // Откатываем временный коммит перед выбросом ошибки
    try { exec('git reset HEAD~1'); } catch (e) { /* ignore */ }
    throw new Error('[deploy] Ошибка публикации: ' + err.message);
  }

  // 6. Откатываем временный коммит из рабочей ветки
  //    (build/ не должен оставаться в истории master)
  logInfo('[deploy] Очистка временного коммита...');
  try {
    exec('git reset HEAD~1');
  } catch (err) {
    logError('[deploy] Не удалось откатить временный коммит: ' + err.message);
  }

  logSuccess('[deploy] ✅ Опубликовано в ветку "' + DEPLOY_BRANCH + '"');

  // Подсказка
  var remoteUrl = '';
  try {
    remoteUrl = exec('git remote get-url origin').trim();
  } catch (e) { /* ignore */ }

  if (remoteUrl.indexOf('github.com') !== -1) {
    var match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) {
      logInfo('[deploy] GitHub Pages: https://'
        + match[1].split('/')[0] + '.github.io/'
        + match[1].split('/')[1] + '/');
      logInfo('[deploy] Не забудь включить Pages в настройках репозитория:');
      logInfo('[deploy]   Settings → Pages → Branch: "' + DEPLOY_BRANCH + '" / root');
    }
  }
}

// --- Автозапуск при прямом вызове ---
var isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  deploy().catch(function (err) {
    logError('[deploy] ' + err.message);
    process.exitCode = 1;
  });
}
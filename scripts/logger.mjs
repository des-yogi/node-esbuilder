import chalk from 'chalk';

export function logSuccess(msg) {
  console.log(chalk.green(msg));
}

export function logInfo(msg) {
  console.log(chalk.cyan(msg));
}

export function logWarn(msg) {
  console.warn(chalk.yellow(msg));
}

export function logError(msg) {
  console.error(chalk.red(msg));
}

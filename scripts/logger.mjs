// --- Базовые цвета ---
//chalk.black()
//chalk.red()
//chalk.green()
//chalk.yellow()
//chalk.blue()
//chalk.magenta()
//chalk.cyan()
//chalk.white()
//chalk.gray()             // серый (он же grey)

// --- Яркие цвета ---
//chalk.redBright()
//chalk.greenBright()
//chalk.yellowBright()
//chalk.blueBright()
//chalk.magentaBright()
//chalk.cyanBright()
//chalk.whiteBright()

// --- Фон ---
//chalk.bgRed()
//chalk.bgGreen()
//chalk.bgYellow()
//chalk.bgBlue()
//chalk.bgMagenta()
//chalk.bgCyan()

// --- Стили ---
//chalk.bold()             // жирный
//chalk.dim()              // приглушённый
//chalk.italic()           // курсив
//chalk.underline()        // подчёркнутый
//chalk.inverse()          // инверсия фона/текста

// --- HEX и RGB ---
//chalk.hex('#FF8800')('текст')
//chalk.rgb(255, 136, 0)('текст')
//chalk.bgHex('#333')('текст')

// --- Комбинации ---
//chalk.bold.green('жирный зелёный')
//chalk.bgRed.white.bold('белый жирный на красном фоне')
//chalk.hex('#FF8800').bold('оранжевый жирный')

import chalk from 'chalk';

// Цвета для тегов — добавляй свои по вкусу
const tagColors = {
  '[build]':         chalk.bold.hex('#F8F8F2'),
  '[clean]':         chalk.hex('#F8F8F2'),
  '[generateStyle]': chalk.hex('#CCFF00'),
  '[styles]':        chalk.hex('#CCFF00'),
  '[scripts]':       chalk.hex('#00FFFF'),
  '[assets]':        chalk.hex('#F1FA8C'),
  '[sprite-svg]':    chalk.hex('#50FA7B'),
  '[html]':          chalk.hex('#0000FF'),
  '[dev-server]':    chalk.hex('#F8F8F2'),
  '[createBlock]':   chalk.hex('#9457EB'),
  '[img-opt]':       chalk.magentaBright,
};

const defaultTagStyle = chalk.bold.hex('#FFFFFF');

function formatMsg(msg, textStyle) {
  const match = msg.match(/^(\[[^\]]+\])\s*(.*)/s);
  if (match) {
    const tagStyle = tagColors[match[1]] || defaultTagStyle;
    return tagStyle(match[1]) + ' ' + textStyle(match[2]);
  }
  return textStyle(msg);
}

export function logSuccess(msg) {
  console.log(formatMsg(msg, chalk.greenBright));
}

export function logInfo(msg) {
  console.log(formatMsg(msg, chalk.hex('#8C8C8C')));
}

export function logWarn(msg) {
  console.warn(formatMsg(msg, chalk.yellow));
}

export function logError(msg) {
  console.error(formatMsg(msg, chalk.redBright));
}

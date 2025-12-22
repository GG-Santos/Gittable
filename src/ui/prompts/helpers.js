/**
 * Helper functions for prompts (intro, outro, cancel, note, log)
 */

const chalk = require('chalk');
const process = require('node:process');
const { SYMBOLS } = require('./theme');
const { getTheme } = require('../../utils/ui');
const { isCancel } = require('./core');

/**
 * Strip ANSI codes from string
 */
function stripAnsi(str) {
  const ansiRegex = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
  return str.replace(ansiRegex, '');
}

/**
 * Intro message
 */
function intro(message = '') {
  const theme = getTheme();
  process.stdout.write(`${chalk.gray(SYMBOLS.BAR_START)}  ${theme.primary(message)}\n`);
}

/**
 * Outro message
 */
function outro(message = '') {
  const theme = getTheme();
  process.stdout.write(`${chalk.gray(SYMBOLS.BAR)}\n${chalk.gray(SYMBOLS.BAR_END)}  ${theme.success(message)}\n\n`);
}

/**
 * Cancel message
 */
function cancel(message = '') {
  process.stdout.write(`${chalk.gray(SYMBOLS.BAR_END)}  ${chalk.red(message)}\n\n`);
}

/**
 * Note message
 */
function note(message = '', title = '') {
  const theme = getTheme();
  const messageLines = `\n${message}\n`.split('\n');
  const titleLength = stripAnsi(title).length;
  const maxWidth = Math.max(
    messageLines.reduce((max, line) => {
      const len = stripAnsi(line).length;
      return len > max ? len : max;
    }, 0),
    titleLength
  ) + 2;

  const boxedMessage = messageLines
    .map((line) => `${chalk.gray(SYMBOLS.BAR)}  ${chalk.dim(line)}${' '.repeat(maxWidth - stripAnsi(line).length)}${chalk.gray(SYMBOLS.BAR)}`)
    .join('\n');

  process.stdout.write(
    `${chalk.gray(SYMBOLS.BAR)}\n${chalk.green(SYMBOLS.STEP_SUBMIT)}  ${chalk.reset(title)} ${chalk.gray(SYMBOLS.BAR_H.repeat(Math.max(maxWidth - titleLength - 1, 1)) + SYMBOLS.CORNER_TOP_RIGHT)}\n${boxedMessage}\n${chalk.gray(SYMBOLS.CONNECT_LEFT + SYMBOLS.BAR_H.repeat(maxWidth + 2) + SYMBOLS.CORNER_BOTTOM_RIGHT)}\n`
  );
}

/**
 * Log message
 */
const log = {
  message(text = '', { symbol = chalk.gray(SYMBOLS.BAR) } = {}) {
    const lines = [`${chalk.gray(SYMBOLS.BAR)}`];
    if (text) {
      const [first, ...rest] = text.split('\n');
      lines.push(`${symbol}  ${first}`);
      lines.push(...rest.map((line) => `${chalk.gray(SYMBOLS.BAR)}  ${line}`));
    }
    process.stdout.write(`${lines.join('\n')}\n`);
  },

  info(text) {
    log.message(text, { symbol: chalk.blue(SYMBOLS.INFO) });
  },

  success(text) {
    log.message(text, { symbol: chalk.green(SYMBOLS.SUCCESS) });
  },

  step(text) {
    log.message(text, { symbol: chalk.green(SYMBOLS.STEP_SUBMIT) });
  },

  warn(text) {
    log.message(text, { symbol: chalk.yellow(SYMBOLS.WARN) });
  },

  warning(text) {
    log.warn(text);
  },

  error(text) {
    log.message(text, { symbol: chalk.red(SYMBOLS.ERROR) });
  },
};

/**
 * Group prompts together
 */
async function group(prompts, options = {}) {
  const results = {};
  const keys = Object.keys(prompts);

  for (const key of keys) {
    const promptFn = prompts[key];
    try {
      const result = await promptFn({ results });
      if (isCancel(result)) {
        results[key] = 'canceled';
        if (typeof options.onCancel === 'function') {
          options.onCancel({ results });
        }
        continue;
      }
      results[key] = result;
    } catch (error) {
      throw error;
    }
  }

  return results;
}

module.exports = {
  intro,
  outro,
  cancel,
  note,
  log,
  group,
  isCancel,
};


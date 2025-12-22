/**
 * Spinner implementation
 */

const chalk = require('chalk');
const process = require('node:process');
const sisteransi = require('sisteransi');
const { block } = require('./block');
const { SYMBOLS } = require('./theme');
const { getTheme } = require('../../utils/color-theme');

/**
 * Check if unicode is supported
 */
function isUnicodeSupported() {
  if (process.platform !== 'win32') {
    return process.env.TERM !== 'linux';
  }
  return (
    Boolean(process.env.CI) ||
    Boolean(process.env.WT_SESSION) ||
    Boolean(process.env.TERMINUS_SUBLIME) ||
    process.env.ConEmuTask === '{cmd::Cmder}' ||
    process.env.TERM_PROGRAM === 'Terminus-Sublime' ||
    process.env.TERM_PROGRAM === 'vscode' ||
    process.env.TERM === 'xterm-256color' ||
    process.env.TERM === 'alacritty' ||
    process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}

const unicode = isUnicodeSupported();
const frames = unicode ? ['◐', '◓', '◑', '◒'] : ['•', 'o', 'O', '0'];
const interval = unicode ? 80 : 120;

/**
 * Create a spinner
 */
function spinner() {
  let cleanup = null;
  let intervalId = null;
  let isRunning = false;
  let message = '';

  const start = (msg = '') => {
    isRunning = true;
    cleanup = block();
    message = msg.replace(/\.+$/, '');
    process.stdout.write(`${chalk.gray(SYMBOLS.BAR)}\n`);

    let frameIndex = 0;
    let dotCount = 0;

    intervalId = setInterval(() => {
      const theme = getTheme();
      const frame = theme.primary(frames[frameIndex]);
      const dots = '.'.repeat(Math.floor(dotCount)).slice(0, 3);

      process.stdout.write(sisteransi.cursor.move(-999, 0));
      process.stdout.write(sisteransi.erase.down(1));
      process.stdout.write(`${frame}  ${message}${dots}`);

      frameIndex = (frameIndex + 1) % frames.length;
      dotCount = dotCount < frames.length ? dotCount + 0.125 : 0;
    }, interval);
  };

  const stop = (msg = '', status = 0) => {
    message = msg || message;
    isRunning = false;
    clearInterval(intervalId);

    const theme = getTheme();
    const symbol =
      status === 0
        ? chalk.green(SYMBOLS.STEP_SUBMIT)
        : status === 1
          ? chalk.red(SYMBOLS.STEP_CANCEL)
          : chalk.red(SYMBOLS.STEP_ERROR);

    process.stdout.write(sisteransi.cursor.move(-999, 0));
    process.stdout.write(sisteransi.erase.down(1));
    process.stdout.write(`${symbol}  ${message}\n`);

    if (cleanup) {
      cleanup();
    }
  };

  const updateMessage = (msg = '') => {
    message = msg || message;
  };

  const handleError = (status) => {
    const errorMsg = status > 1 ? 'Something went wrong' : 'Canceled';
    if (isRunning) {
      stop(errorMsg, status);
    }
  };

  // Set up error handlers
  process.on('uncaughtExceptionMonitor', () => handleError(2));
  process.on('unhandledRejection', () => handleError(2));
  process.on('SIGINT', () => handleError(1));
  process.on('SIGTERM', () => handleError(1));
  process.on('exit', handleError);

  return {
    start,
    stop,
    message: updateMessage,
  };
}

module.exports = spinner;


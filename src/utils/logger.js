const chalk = require('chalk');
const { info: prettyInfo, warn: prettyWarn, error: prettyError } = require('prettycli');

/**
 * Enhanced logger using prettycli for better formatting
 * Falls back to simple logging if prettycli fails
 */
const createLogger =
  (color, symbol) =>
  (...args) =>
    console.log(chalk[color](symbol), ...args);

const logger = {
  // Use prettycli for enhanced formatting
  info: (label, message) => {
    try {
      prettyInfo(label, message);
    } catch (_err) {
      createLogger('cyan', 'ℹ')(label, message);
    }
  },

  warn: (message) => {
    try {
      prettyWarn(message);
    } catch (_err) {
      createLogger('yellow', '⚠')(message);
    }
  },

  error: (message) => {
    try {
      prettyError(message);
    } catch (_err) {
      createLogger('red', '✖')(message);
    }
  },

  success: createLogger('green', '✔'),

  // Simple loggers (backward compatible)
  log: (...args) => console.log(...args),
  debug: (...args) => console.log(chalk.gray('DEBUG'), ...args),
};

module.exports = logger;

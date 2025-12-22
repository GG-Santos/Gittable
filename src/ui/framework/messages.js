/**
 * Standardized message system
 * Provides consistent error, warning, info, and note messages
 */

const chalk = require('chalk');
const { getTheme, getMessageColor } = require('./theme');
const { MESSAGE_TYPES, SPACING, ICONS } = require('./standards');
const prompts = require('../prompts');

/**
 * Display an error message
 */
function error(message, options = {}) {
  const theme = getTheme();
  const { suggestion, solution, exit = false, icon = MESSAGE_TYPES.error.icon } = options;
  const colorFn = getMessageColor('error');

  console.log();
  console.log(colorFn(`${icon} ${chalk.bold(message)}`));

  if (suggestion) {
    console.log(chalk.yellow(`💡 Suggestion:`), chalk.gray(suggestion));
  }

  if (solution) {
    console.log(theme.primary('→ Try:'), chalk.bold(theme.primary(solution)));
  }

  console.log();

  if (exit) {
    process.exit(1);
  }
}

/**
 * Display a warning message
 */
function warn(message, options = {}) {
  const theme = getTheme();
  const { icon = MESSAGE_TYPES.warning.icon, action } = options;
  const colorFn = getMessageColor('warning');

  console.log();
  console.log(colorFn(`${icon} ${message}`));

  if (action) {
    console.log(chalk.dim(`   ${action}`));
  }

  console.log();
}

/**
 * Display an info message
 */
function info(message, options = {}) {
  const theme = getTheme();
  const { icon = MESSAGE_TYPES.info.icon, dim = false } = options;
  const colorFn = getMessageColor('info');
  const messageFn = dim ? theme.dim : colorFn;

  console.log();
  console.log(messageFn(`${icon} ${message}`));
  console.log();
}

/**
 * Display a note message
 */
function note(message, options = {}) {
  const theme = getTheme();
  const { icon = MESSAGE_TYPES.note.icon, type = 'note' } = options;
  const colorFn = type === 'warning' ? getMessageColor('warning') : theme.dim;

  console.log();
  console.log(colorFn(`${icon} ${chalk.italic(message)}`));
  console.log();
}

/**
 * Display a success message
 */
function success(message, options = {}) {
  const theme = getTheme();
  const { icon = MESSAGE_TYPES.success.icon, details } = options;
  const colorFn = getMessageColor('success');

  console.log();
  console.log(colorFn(`${icon} ${chalk.bold(message)}`));

  if (details && Array.isArray(details)) {
    details.forEach((detail) => {
      console.log(chalk.dim(`   ${detail}`));
    });
  }

  console.log();
}

/**
 * Display a message with custom formatting
 */
function custom(message, options = {}) {
  const { color = 'dim', icon, bold = false, italic = false } = options;
  const theme = getTheme();
  const colorFn = theme[color] || theme.dim;

  let formattedMessage = message;
  if (bold) formattedMessage = chalk.bold(formattedMessage);
  if (italic) formattedMessage = chalk.italic(formattedMessage);

  const prefix = icon ? `${icon} ` : '';

  console.log();
  console.log(colorFn(`${prefix}${formattedMessage}`));
  console.log();
}

module.exports = {
  error,
  warn,
  info,
  note,
  success,
  custom,
};



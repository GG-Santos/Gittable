/**
 * Theme integration for prompts
 * Provides theme-aware symbols and colors
 */

const chalk = require('chalk');
const process = require('node:process');
const { getTheme } = require('../../utils/ui');

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
const s = (unicode, fallback) => (unicode ? unicode : fallback);

// Symbols
const SYMBOLS = {
  STEP_ACTIVE: s('◆', '*'),
  STEP_CANCEL: s('■', 'x'),
  STEP_ERROR: s('▲', 'x'),
  STEP_SUBMIT: s('◇', 'o'),
  BAR_START: s('┌', 'T'),
  BAR: s('│', '|'),
  BAR_END: s('└', '—'),
  RADIO_ACTIVE: s('●', '>'),
  RADIO_INACTIVE: s('○', ' '),
  CHECKBOX_ACTIVE: s('◻', '[•]'),
  CHECKBOX_SELECTED: s('◼', '[+]'),
  CHECKBOX_INACTIVE: s('◻', '[ ]'),
  PASSWORD_MASK: s('▪', '•'),
  BAR_H: s('─', '-'),
  CORNER_TOP_RIGHT: s('╮', '+'),
  CONNECT_LEFT: s('├', '+'),
  CORNER_BOTTOM_RIGHT: s('╯', '+'),
  INFO: s('●', '•'),
  SUCCESS: s('◆', '*'),
  WARN: s('▲', '!'),
  ERROR: s('■', 'x'),
};

/**
 * Get symbol for prompt state
 */
function getStateSymbol(state) {
  const theme = getTheme();
  switch (state) {
    case 'initial':
    case 'active':
      return theme.primary(SYMBOLS.STEP_ACTIVE);
    case 'cancel':
      return chalk.red(SYMBOLS.STEP_CANCEL);
    case 'error':
      return chalk.yellow(SYMBOLS.STEP_ERROR);
    case 'submit':
      return chalk.green(SYMBOLS.STEP_SUBMIT);
    default:
      return theme.primary(SYMBOLS.STEP_ACTIVE);
  }
}

/**
 * Get primary color function
 */
function getPrimaryColor() {
  return getTheme().primary;
}

module.exports = {
  SYMBOLS,
  getStateSymbol,
  getPrimaryColor,
  isUnicodeSupported,
};


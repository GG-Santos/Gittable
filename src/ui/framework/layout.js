/**
 * Global layout and banner system
 * Provides standardized banner structure and layout management
 */

const chalk = require('chalk');
const { getTheme } = require('./theme');
const { getCommandASCII } = require('../ascii');
const commandVersions = require('../../utils/versions');
const { BANNER_STANDARDS, SPACING } = require('./standards');

/**
 * Create a standardized banner
 */
function createBanner(commandName, options = {}) {
  const {
    version = commandVersions[commandName.toLowerCase()] || '1.0.0',
    borderColor = null,
    contentColor = null,
    subtitle = null,
    compact = false,
  } = options;

  const theme = getTheme();
  const primaryColor = contentColor ? chalk[contentColor] : theme.primary;
  const borderChar = BANNER_STANDARDS.borderChar;

  // Get border color - use gray to match prompt borders (same as ┌ character)
  const border = borderColor 
    ? (typeof borderColor === 'string' && chalk[borderColor] ? chalk[borderColor] : theme[borderColor] || theme.dim)
    : chalk.gray;

  // Get ASCII art
  const asciiArt = getCommandASCII(commandName, { color: primaryColor });
  const asciiLines = asciiArt.split('\n').filter(Boolean);

  if (asciiLines.length === 0 && compact) {
    // Compact mode without ASCII
    const title = `${commandName} v${version}`;
    const width = Math.max(title.length + 4, 50);
    const dashes = '─'.repeat(width - title.length - 3);
    return `${border(borderChar.topLeft)}─ ${chalk.bold(primaryColor(title))} ${border(dashes)}${border(borderChar.topRight)}\n${border(borderChar.bottomLeft)}${'─'.repeat(width - 1)}${border(borderChar.bottomRight)}`;
  }

  if (asciiLines.length === 0) {
    return '';
  }

  // Calculate width
  const WIDTH = Math.max(...asciiLines.map((line) => line.length), 50);

  const content = primaryColor;

  // Helper functions
  const _TOTAL_WIDTH = WIDTH + 4;
  const pad = (text = '') => text.padEnd(WIDTH - 21);
  const framedLine = (text = '') => {
    const padded = pad(text);
    const colored = content(padded);
    return `${border(borderChar.vertical)} ${colored} ${border(borderChar.vertical)}`;
  };

  const topBorder = (title) => {
    const titleText = `${title}  `;
    const titleLen = titleText.length;
    const dashCount = WIDTH - 21 - titleLen;
    return border(`${titleText}${borderChar.horizontal.repeat(dashCount)}${borderChar.topRight}`);
  };

  const bottomBorder = () => border(`${borderChar.bottomLeft}${borderChar.horizontal.repeat(WIDTH - 19)}${borderChar.bottomRight}`);

  // Build banner
  const banner = [
    topBorder(`${commandName} v${version}`),
    ...asciiLines.map((line) => framedLine(`   ${line}`)),
    framedLine(),
    bottomBorder(),
  ].join('\n');

  // Add subtitle if provided
  if (subtitle) {
    return `${banner}\n${border(borderChar.vertical)}  ${chalk.bold(primaryColor(subtitle))}`;
  }

  return banner;
}

/**
 * Display banner using framework
 */
function showBanner(commandName, options = {}) {
  const { clearScreen = true } = options;
  
  // Clear screen if requested (default: true)
  if (clearScreen && process.stdout.isTTY) {
    // ANSI escape sequence: clear screen and move cursor to top-left
    process.stdout.write('\x1b[2J\x1b[H');
  }
  
  const banner = createBanner(commandName, options);
  if (banner) {
    const prompts = require('../prompts');
    prompts.intro(banner);
  }
}

/**
 * Create a section separator
 */
function createSectionSeparator(options = {}) {
  const { char = '─', length = 60, color = 'dim' } = options;
  const theme = getTheme();
  const colorFn = theme[color] || theme.dim;
  return colorFn(char.repeat(length));
}

/**
 * Add spacing between sections
 */
function addSectionSpacing() {
  return '\n'.repeat(SPACING.section);
}

module.exports = {
  createBanner,
  showBanner,
  createSectionSeparator,
  addSectionSpacing,
};



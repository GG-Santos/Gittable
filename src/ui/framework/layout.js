/**
 * Global layout and banner system
 * Provides standardized banner structure and layout management
 */

const chalk = require('chalk');
const stripAnsiModule = require('strip-ansi');
const stripAnsi = stripAnsiModule.default || stripAnsiModule;
const { getTheme } = require('./theme');
const { getCommandASCII } = require('../components/ascii');
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

  // Get border color - always use gray to match prompt borders (same as ┌ character)
  // Border color should remain constant regardless of theme changes
  const border = borderColor 
    ? (typeof borderColor === 'string' && chalk[borderColor] ? chalk[borderColor] : chalk.gray)
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

  // Calculate width - strip ANSI codes first to get actual visual width
  // Use the actual ASCII art width (no minimum) so border matches ASCII art
  const WIDTH = Math.max(...asciiLines.map((line) => stripAnsi(line).length));

  const content = primaryColor;

  // Calculate the actual content width inside framed lines
  // framedLine structure: │ ${content} │
  // Content is `   ${line}` where line is ASCII art, so content width = WIDTH + 3 (3-space prefix)
  // Total framed line width = 1 (left border) + 1 (space) + (WIDTH + 3) (content) + 1 (space) + 1 (right border) = WIDTH + 6
  const CONTENT_PADDED_WIDTH = WIDTH + 3; // ASCII art width + 3-space prefix
  const TOTAL_FRAMED_WIDTH = 1 + 1 + CONTENT_PADDED_WIDTH + 1 + 1; // │ + space + content + space + │ = WIDTH + 6

  // Helper functions
  const framedLine = (text = '') => {
    // Strip ANSI codes to get plain text for accurate padding
    const plainText = stripAnsi(text);
    const padded = plainText.padEnd(CONTENT_PADDED_WIDTH);
    // Apply color to the padded text
    const colored = content(padded);
    return `${border(borderChar.vertical)} ${colored} ${border(borderChar.vertical)}`;
  };

  const topBorder = (title) => {
    // Top border structure: ┌  ${coloredTitle}  ${dashes}╮
    // Total width should match TOTAL_FRAMED_WIDTH
    const coloredTitle = primaryColor(title);
    const coloredTitleText = `${coloredTitle}  `;
    // Calculate width using plain text (strip ANSI codes from colored version)
    const titleLen = stripAnsi(coloredTitleText).length;
    // Top border: ┌ (1) + space (1) + coloredTitleText + dashes + ╮ (1) = TOTAL_FRAMED_WIDTH
    // So: 1 + 1 + titleLen + dashCount + 1 = TOTAL_FRAMED_WIDTH
    // dashCount = TOTAL_FRAMED_WIDTH - 3 - titleLen
    const dashCount = TOTAL_FRAMED_WIDTH - 3 - titleLen;
    const dashes = borderChar.horizontal.repeat(Math.max(0, dashCount));
    // Build border: left border (gray) + space + colored title + dashes (gray) + right border (gray)
    return `${border(borderChar.topLeft)} ${coloredTitleText}${border(dashes)}${border(borderChar.topRight)}`;
  };

  // Bottom border: ├ + dashes + ╯ = TOTAL_FRAMED_WIDTH
  // So: 1 + dashCount + 1 = TOTAL_FRAMED_WIDTH
  // dashCount = TOTAL_FRAMED_WIDTH - 2
  const bottomBorder = () => border(`${borderChar.bottomLeft}${borderChar.horizontal.repeat(TOTAL_FRAMED_WIDTH - 2)}${borderChar.bottomRight}`);

  // Build banner
  // Use ASCII art lines as-is with 3-space prefix (no padding to match border)
  const banner = [
    topBorder(`${commandName} v${version}`),
    ...asciiLines.map((line) => framedLine(`   ${line}`)),
    framedLine(''), // Empty line between ASCII art and bottom border
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
    // Write banner directly - don't use intro() as it adds its own border character
    process.stdout.write(`${banner}\n`);
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



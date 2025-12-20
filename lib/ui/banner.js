const chalk = require('chalk');
const { getCommandASCII } = require('./ascii');
const commandVersions = require('../versions');

/**
 * Create a banner for a command with ASCII art, borders, and version
 * @param {string} commandName - The command name (e.g., 'COMMIT', 'STATUS')
 * @param {object} options - Banner options
 * @param {string} options.color - Color for ASCII art (default: 'cyan')
 * @param {string} options.version - Version override (default: from versions.js)
 * @param {string} options.borderColor - Border color (default: 'gray')
 * @param {string} options.contentColor - Content color (default: 'cyan')
 * @returns {string} - Formatted banner
 */
function createBanner(commandName, options = {}) {
  // Automatically look up version from lib/versions.js
  // Command names are converted to lowercase for lookup (e.g., 'COMMIT' -> 'commit', 'CHERRY-PICK' -> 'cherry-pick')
  const {
    version = commandVersions[commandName.toLowerCase()] || '1.0.0',
    borderColor = 'gray',
    contentColor = 'cyan',
  } = options;

  // Get ASCII art for the command
  const asciiArt = getCommandASCII(commandName, { color: contentColor });
  const asciiLines = asciiArt.split('\n').filter(Boolean);

  if (asciiLines.length === 0) {
    return '';
  }

  // Calculate width (use the longest line)
  const WIDTH = Math.max(...asciiLines.map((line) => line.length));

  const border = chalk[borderColor];
  const content = chalk[contentColor];

  // Helper functions
  // Each framed line is: │ + space + content (WIDTH) + space + │ = WIDTH + 4 total
  const _TOTAL_WIDTH = WIDTH + 4;
  const pad = (text = '') => text.padEnd(WIDTH - 7);
  const framedLine = (text = '') => `${border('│')} ${content(pad(text))} ${border('│')}`;
  const topBorder = (title) => {
    // Top border: ┌ + space + title + spaces + dashes + ╮ = TOTAL_WIDTH
    // ┌ (1) + space (1) + titleText (titleLen) + dashes (dashCount) + ╮ (1) = WIDTH + 4
    // So: 3 + titleLen + dashCount = WIDTH + 4
    // Therefore: dashCount = WIDTH + 1 - titleLen
    const titleText = `${title}  `;
    const titleLen = titleText.length;
    const dashCount = WIDTH - 7 - titleLen;
    return border(`${titleText}${'─'.repeat(dashCount)}╮`);
  };
  const bottomBorder = () => border(`├${'─'.repeat(WIDTH - 5)}╯`);

  // Build banner
  const banner = [
    topBorder(`${commandName} v${version}`),
    ...asciiLines.map((line) => framedLine(`   ${line}`)),
    framedLine(),
    bottomBorder(),
  ].join('\n');

  return banner;
}

/**
 * Display banner using clack.intro
 * @param {string} commandName - The command name
 * @param {object} options - Banner options
 */
function showBanner(commandName, options = {}) {
  const banner = createBanner(commandName, options);
  if (banner) {
    const clack = require('@clack/prompts');
    clack.intro(banner);
  }
}

module.exports = {
  createBanner,
  showBanner,
};

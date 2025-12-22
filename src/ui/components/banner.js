/**
 * Banner component
 * Maintains backward compatibility while using the framework
 */

const ui = require('../framework');

/**
 * Create a banner for a command with ASCII art, borders, and version
 * @param {string} commandName - The command name (e.g., 'COMMIT', 'STATUS')
 * @param {object} options - Banner options
 * @param {string} options.color - Color for ASCII art (default: 'cyan')
 * @param {string} options.version - Version override (default: from versions.js)
 * @param {string} options.borderColor - Border color (default: 'gray')
 * @param {string} options.contentColor - Content color (default: 'cyan')
 * @param {string} options.subtitle - Optional subtitle/description
 * @param {boolean} options.compact - Compact mode (no ASCII art)
 * @returns {string} - Formatted banner
 */
function createBanner(commandName, options = {}) {
  // Map old options to new framework options
  const {
    color,
    contentColor,
    subtitle,
    compact = false,
  } = options;

  return ui.layout.createBanner(commandName, {
    contentColor: contentColor || color,
    subtitle,
    compact,
  });
}

/**
 * Display banner using framework
 * @param {string} commandName - The command name
 * @param {object} options - Banner options
 */
function showBanner(commandName, options = {}) {
  ui.layout.showBanner(commandName, options);
}

module.exports = {
  createBanner,
  showBanner,
};


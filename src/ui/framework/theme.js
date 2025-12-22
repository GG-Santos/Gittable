/**
 * Enhanced theme system
 * Extends color-theme.js with framework-specific additions
 */

const chalk = require('chalk');
const { getTheme: getBaseTheme, THEMES } = require('../../utils/ui');
const { MESSAGE_TYPES } = require('./standards');

/**
 * Get enhanced theme with framework additions
 */
function getTheme() {
  const baseTheme = getBaseTheme();

  return {
    ...baseTheme,
    // Message type colors (already in base theme, but ensure consistency)
    message: {
      error: baseTheme.error,
      warning: baseTheme.warning,
      info: baseTheme.info,
      success: baseTheme.success,
      note: baseTheme.dim,
    },
    // Component-specific colors
    components: {
      prompt: {
        message: baseTheme.primary,
        placeholder: baseTheme.dim,
        selected: baseTheme.primary,
      },
      table: {
        header: baseTheme.primary,
        border: chalk.gray, // Always gray, independent of theme
        cell: chalk => chalk,
      },
      banner: {
        border: chalk.gray, // Always gray, independent of theme
        content: baseTheme.primary,
        version: baseTheme.dim,
      },
    },
  };
}

/**
 * Get message color for a specific message type
 */
function getMessageColor(type) {
  const theme = getTheme();
  const messageType = MESSAGE_TYPES[type];
  if (!messageType) {
    return theme.dim;
  }
  return theme[messageType.color] || theme.dim;
}

/**
 * Get component color
 */
function getComponentColor(component, element) {
  const theme = getTheme();
  return theme.components[component]?.[element] || theme.dim;
}

/**
 * Export base theme functions for compatibility
 */
module.exports = {
  getTheme,
  getMessageColor,
  getComponentColor,
  THEMES, // Re-export for access to theme definitions
};


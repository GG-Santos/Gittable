const { getTheme } = require('./color-theme');

/**
 * Get primary color function for use in prompts
 * This ensures all prompts use the theme color consistently
 */
function getPromptColor() {
  return getTheme().primary;
}

module.exports = {
  getPromptColor,
};



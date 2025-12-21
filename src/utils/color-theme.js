const chalk = require('chalk');
const { getPreference } = require('./user-preferences');

/**
 * Color theme definitions
 */
const THEMES = {
  default: {
    primary: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    info: chalk.blue,
    dim: chalk.dim,
    bold: chalk.bold,
  },
  dark: {
    primary: chalk.cyanBright,
    success: chalk.greenBright,
    warning: chalk.yellowBright,
    error: chalk.redBright,
    info: chalk.blueBright,
    dim: chalk.gray,
    bold: chalk.bold.white,
  },
  light: {
    primary: chalk.cyan.dim,
    success: chalk.green.dim,
    warning: chalk.yellow.dim,
    error: chalk.red.dim,
    info: chalk.blue.dim,
    dim: chalk.gray,
    bold: chalk.bold.black,
  },
  highContrast: {
    primary: chalk.white.bold,
    success: chalk.green.bold,
    warning: chalk.yellow.bold,
    error: chalk.red.bold,
    info: chalk.blue.bold,
    dim: chalk.white,
    bold: chalk.bold.white,
  },
};

/**
 * Create custom primary color function from RGB values
 */
function createCustomPrimaryColor(r, g, b) {
  return (text) => chalk.rgb(r, g, b)(text);
}

/**
 * Get current theme
 */
function getTheme() {
  const themeName = getPreference('theme', 'default');
  const theme = THEMES[themeName] || THEMES.default;
  
  // Check for custom primary color preference
  const customPrimaryColor = getPreference('primaryColor');
  if (customPrimaryColor) {
    // Handle RGB color object
    if (customPrimaryColor.r !== undefined && customPrimaryColor.g !== undefined && customPrimaryColor.b !== undefined) {
      return {
        ...theme,
        primary: createCustomPrimaryColor(customPrimaryColor.r, customPrimaryColor.g, customPrimaryColor.b),
      };
    }
    // Handle named color string
    if (typeof customPrimaryColor === 'string' && chalk[customPrimaryColor]) {
      return {
        ...theme,
        primary: chalk[customPrimaryColor],
      };
    }
  }
  
  return theme;
}

/**
 * Detect terminal color capabilities
 */
function detectTerminalCapabilities() {
  const supportsColor = chalk.supportsColor;

  return {
    hasBasic: supportsColor?.hasBasic || false,
    has256: supportsColor?.has256 || false,
    has16m: supportsColor?.has16m || false,
    level: supportsColor?.level || 0,
  };
}

/**
 * Auto-select theme based on terminal
 */
function autoSelectTheme() {
  const caps = detectTerminalCapabilities();

  if (caps.level >= 3) {
    return 'default';
  }
  if (caps.level >= 2) {
    return 'dark';
  }
  if (caps.level >= 1) {
    return 'light';
  }
  return 'highContrast';
}

/**
 * Apply theme to chalk instance
 */
function applyTheme(themeName = null) {
  const theme = themeName ? THEMES[themeName] : getTheme();

  // Return theme object for use in code
  return theme;
}

/**
 * Get theme with custom primary color for preview (without saving)
 */
function getThemeWithCustomPrimary(customPrimaryColor) {
  const themeName = getPreference('theme', 'default');
  const theme = THEMES[themeName] || THEMES.default;
  
  if (!customPrimaryColor) {
    return theme;
  }
  
  // Handle RGB color object
  if (customPrimaryColor.r !== undefined && customPrimaryColor.g !== undefined && customPrimaryColor.b !== undefined) {
    return {
      ...theme,
      primary: createCustomPrimaryColor(customPrimaryColor.r, customPrimaryColor.g, customPrimaryColor.b),
    };
  }
  // Handle named color string
  if (typeof customPrimaryColor === 'string' && chalk[customPrimaryColor]) {
    return {
      ...theme,
      primary: chalk[customPrimaryColor],
    };
  }
  
  return theme;
}

/**
 * Get primary color function directly
 */
function getPrimaryColor() {
  return getTheme().primary;
}

module.exports = {
  THEMES,
  getTheme,
  getThemeWithCustomPrimary,
  getPrimaryColor,
  createCustomPrimaryColor,
  detectTerminalCapabilities,
  autoSelectTheme,
  applyTheme,
};

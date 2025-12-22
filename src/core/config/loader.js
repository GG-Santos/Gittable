const findConfig = require('find-config');
const path = require('node:path');
const chalk = require('chalk');
const log = require('../../utils/logger');

const CONFIG_NAMES = ['.gittable.js', '.gittable.json'];

const showError = () => {
  console.log();
  log.error(chalk.red.bold('No configuration found!'));
  console.log();
  console.log(chalk.yellow('  Create one of:'));
  for (const name of CONFIG_NAMES) {
    console.log(chalk.cyan(`    • ${name}`));
  }
  console.log(chalk.cyan('    • package.json config'));
  console.log();
};

const readConfigFile = () => {
  // Try .gittable.js
  const jsConfig = findConfig.require(CONFIG_NAMES[0], { home: false });
  if (jsConfig) {
    log.success(chalk.green(`Using: ${chalk.bold(CONFIG_NAMES[0])}`));
    // Validate and normalize config
    return normalizeConfig(jsConfig);
  }

  // Try .gittable.json
  const jsonConfig = findConfig.require(CONFIG_NAMES[1], { home: false });
  if (jsonConfig) {
    log.success(chalk.green(`Using: ${chalk.bold(CONFIG_NAMES[1])}`));
    // Validate and normalize config
    return normalizeConfig(jsonConfig);
  }

  // Try package.json (for future package.json config support)
  // Currently not implemented - use .gittable.js or .gittable.json instead

  showError();
  return null;
};

/**
 * Normalize and validate config structure
 */
function normalizeConfig(config) {
  // Mode system has been removed - ignore mode if present
  // Keep it in config for backward compatibility but don't use it

  // Ensure enabledCommands is an array if provided
  if (config.enabledCommands !== undefined && !Array.isArray(config.enabledCommands)) {
    config.enabledCommands = [];
  }

  return config;
}

module.exports = readConfigFile;

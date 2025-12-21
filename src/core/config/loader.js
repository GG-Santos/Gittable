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
  console.log(chalk.gray('  Docs: github.com/leonardoanalista/cz-customizable'));
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

  // Try package.json
  const pkgPath = findConfig('package.json', { home: false });
  if (pkgPath) {
    const pkg = require(pkgPath);
    const configPath = pkg.config?.['cz-customizable']?.config;

    if (configPath) {
      const fullPath = path.resolve(path.dirname(pkgPath), configPath);
      log.success(chalk.green(`Using: ${chalk.bold(fullPath)}`));
      return normalizeConfig(require(fullPath));
    }
  }

  showError();
  return null;
};

/**
 * Normalize and validate config structure
 */
function normalizeConfig(config) {
  // Ensure mode is set (default to 'full' for backward compatibility)
  if (!config.mode || (config.mode !== 'basic' && config.mode !== 'full')) {
    config.mode = 'full';
  }

  // Ensure enabledCommands is an array if provided
  if (config.enabledCommands !== undefined && !Array.isArray(config.enabledCommands)) {
    config.enabledCommands = [];
  }

  return config;
}

module.exports = readConfigFile;

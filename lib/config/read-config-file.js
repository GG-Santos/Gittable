const findConfig = require('find-config');
const path = require('node:path');
const chalk = require('chalk');
const log = require('../utils/logger');

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
  // Try .cz-config.js
  const jsConfig = findConfig.require(CONFIG_NAMES[0], { home: false });
  if (jsConfig) {
    log.success(chalk.green(`Using: ${chalk.bold(CONFIG_NAMES[0])}`));
    return jsConfig;
  }

  // Try .cz-config.json
  const jsonConfig = findConfig.require(CONFIG_NAMES[1], { home: false });
  if (jsonConfig) {
    log.success(chalk.green(`Using: ${chalk.bold(CONFIG_NAMES[1])}`));
    return jsonConfig;
  }

  // Try package.json
  const pkgPath = findConfig('package.json', { home: false });
  if (pkgPath) {
    const pkg = require(pkgPath);
    const configPath = pkg.config?.['cz-customizable']?.config;

    if (configPath) {
      const fullPath = path.resolve(path.dirname(pkgPath), configPath);
      log.success(chalk.green(`Using: ${chalk.bold(fullPath)}`));
      return require(fullPath);
    }
  }

  showError();
  return null;
};

module.exports = readConfigFile;

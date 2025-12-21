const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader } = require('../../utils/command-helpers');
const { clearAllCaches } = require('../../utils/cache');

/**
 * Clear all caches
 */
module.exports = async (_args) => {
  showCommandHeader('CLEAR-CACHE', 'Clear Cache');

  clearAllCaches();

  clack.outro(chalk.green.bold('All caches cleared'));
};

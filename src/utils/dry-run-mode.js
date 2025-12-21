const chalk = require('chalk');

/**
 * Dry run mode state
 */
let dryRunMode = false;

/**
 * Enable dry run mode
 */
function enableDryRun() {
  dryRunMode = true;
}

/**
 * Check if dry run mode is enabled
 */
function isDryRun() {
  return dryRunMode || process.env.GITTABLE_DRY_RUN === 'true';
}

/**
 * Log dry run message
 */
function dryRunLog(message, command = null) {
  if (isDryRun()) {
    console.log();
    console.log(chalk.yellow.bold('[DRY RUN]'), chalk.yellow(message));
    if (command) {
      console.log(chalk.dim(`Would execute: git ${command}`));
    }
    console.log();
  }
}

/**
 * Execute or simulate command based on dry run mode
 */
async function executeOrSimulate(command, executor, options = {}) {
  if (isDryRun()) {
    dryRunLog(options.message || 'Would execute command', command);
    return { success: true, dryRun: true, output: '[DRY RUN]', error: null };
  }

  return await executor();
}

module.exports = {
  enableDryRun,
  isDryRun,
  dryRunLog,
  executeOrSimulate,
};

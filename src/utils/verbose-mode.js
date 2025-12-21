const chalk = require('chalk');

/**
 * Verbose mode state
 */
let verboseMode = false;

/**
 * Enable verbose mode
 */
function enableVerbose() {
  verboseMode = true;
}

/**
 * Check if verbose mode is enabled
 */
function isVerbose() {
  return verboseMode || process.env.GITTABLE_VERBOSE === 'true';
}

/**
 * Log verbose message
 */
function verbose(message, ...args) {
  if (isVerbose()) {
    console.log(chalk.dim('[VERBOSE]'), chalk.dim(message), ...args);
  }
}

/**
 * Log command execution
 */
function verboseCommand(command, options = {}) {
  if (isVerbose()) {
    const { cwd, ...rest } = options;
    console.log(chalk.dim('[VERBOSE] Executing:'), chalk.cyan(`git ${command}`));
    if (cwd) {
      console.log(chalk.dim('[VERBOSE] Working directory:'), chalk.gray(cwd));
    }
    if (Object.keys(rest).length > 0) {
      console.log(chalk.dim('[VERBOSE] Options:'), chalk.gray(JSON.stringify(rest, null, 2)));
    }
  }
}

module.exports = {
  enableVerbose,
  isVerbose,
  verbose,
  verboseCommand,
};

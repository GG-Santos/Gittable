const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getCurrentBranch } = require('../git/exec');

/**
 * Validate branch exists and handle empty repository cases
 * This pattern is duplicated in push.js, pull.js, and sync.js
 * @param {string} branchName - Branch name to validate (optional, defaults to current branch)
 * @param {string} contextMessage - Context for error message (e.g., 'pushing', 'pulling')
 * @returns {string|null} - Valid branch name or null if invalid
 */
function validateBranch(branchName = null, contextMessage = 'performing this operation') {
  const branch = branchName || getCurrentBranch();

  // Handle empty repository (no commits = no branch)
  if (!branch || branch === 'null' || branch === 'HEAD') {
    clack.cancel(chalk.red('No branch found'));
    console.log(chalk.yellow('Repository has no commits yet.'));
    console.log(chalk.gray(`Make at least one commit before ${contextMessage}.`));
    process.exit(1);
  }

  return branch;
}

/**
 * Get current branch or validate provided branch
 * @param {string} branchName - Optional branch name
 * @param {string} contextMessage - Context for error message
 * @returns {string} - Valid branch name
 */
function getValidBranch(branchName = null, contextMessage = 'performing this operation') {
  return validateBranch(branchName, contextMessage);
}

module.exports = {
  validateBranch,
  getValidBranch,
};



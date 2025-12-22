const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { getCurrentBranch } = require('../../core/git');
const { GitError } = require('../../core/errors');

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
    throw new GitError(
      'No branch found. Repository has no commits yet.',
      'branch',
      {
        suggestion: `Make at least one commit before ${contextMessage}.`,
      }
    );
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

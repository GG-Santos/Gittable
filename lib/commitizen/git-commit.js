const { execSync } = require('node:child_process');
const { executeCommit, validateStagingArea } = require('../commit/commit-utils');

/**
 * Check if the staging area is clean
 * @deprecated Use validateStagingArea from commit-utils instead
 */
function isStagingClean(gitRoot) {
  try {
    execSync('git diff --cached --quiet', {
      cwd: gitRoot,
      stdio: 'pipe',
    });
    return true; // Exit code 0 means clean
  } catch (error) {
    return false; // Exit code 1 means there are staged changes
  }
}

/**
 * Execute git commit with the given message
 * Uses the shared commit utility for consistency
 */
function commit(gitRoot, message, options = {}) {
  const { allowEmpty = false, all = false } = options;

  // Validate staging area
  if (!allowEmpty) {
    const validation = validateStagingArea({ allowEmpty, all });
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  // Use shared commit execution
  return executeCommit(message, {
    ...options,
    gitRoot,
  });
}

module.exports = {
  commit,
  isStagingClean, // Keep for backward compatibility
};


/**
 * Commit validation module
 * Handles staging area validation and file staging checks
 */

const { execGit } = require('../git/executor');
const { getStatus } = require('../git/status');
const { ValidationError } = require('../errors');

/**
 * Check if there are staged changes or if --all flag is used
 */
function hasStagedChanges(options = {}) {
  const { all = false, allowEmpty = false } = options;

  if (allowEmpty || all) {
    return true; // Skip check if these flags are set
  }

  // Check if staging area has changes
  const result = execGit('diff --cached --quiet', { silent: true });
  return !result.success; // Exit code 1 means there are staged changes
}

/**
 * Get staged files count and names for display
 */
function getStagedFilesInfo() {
  const result = execGit('diff --cached --name-only', { silent: true });
  if (!result.success) {
    return { count: 0, files: [] };
  }

  const { STAGED_FILES_PREVIEW_LIMIT } = require('../constants');
  const files = result.output.trim().split('\n').filter(Boolean);
  return {
    count: files.length,
    files: files.slice(0, STAGED_FILES_PREVIEW_LIMIT),
    hasMore: files.length > STAGED_FILES_PREVIEW_LIMIT,
  };
}

/**
 * Validate staging area before commit
 */
function validateStagingArea(options = {}) {
  const { all = false, allowEmpty = false } = options;

  if (allowEmpty) {
    return { valid: true };
  }

  if (all) {
    // Check if there are any changes at all
    const status = getStatus();
    if (
      !status ||
      (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0)
    ) {
      return {
        valid: false,
        error: 'No changes to commit. Use --allow-empty to create an empty commit.',
      };
    }
    return { valid: true };
  }

  // Check for staged changes
  if (!hasStagedChanges(options)) {
    const stagedInfo = getStagedFilesInfo();
    return {
      valid: false,
      error: 'No files added to staging! Did you forget to run git add?',
      suggestion: 'Run "gittable add" to stage files, or use "git cz -a" to commit all changes.',
    };
  }

  return { valid: true };
}

/**
 * Validate and throw ValidationError if invalid
 */
function validateStagingAreaOrThrow(options = {}) {
  const validation = validateStagingArea(options);
  if (!validation.valid) {
    throw new ValidationError(validation.error, null, {
      suggestion: validation.suggestion,
    });
  }
}

module.exports = {
  hasStagedChanges,
  getStagedFilesInfo,
  validateStagingArea,
  validateStagingAreaOrThrow,
};


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
  // diff --cached --quiet returns:
  //   - Exit code 0: no staged changes (success: true)
  //   - Exit code 1: has staged changes (success: false, but this is expected)
  //   - Error: not a git repo or other error (success: false, with error message)
  const result = execGit('diff --cached --quiet', { silent: true });
  
  // If there's a real error message (not just "Command failed" from non-zero exit),
  // it means the command actually failed (not a git repo, etc.)
  // For git diff --cached --quiet, exit code 1 with no stderr is expected when there are staged changes
  // The generic "Command failed" message is set when exit code is non-zero but stderr is empty
  const hasRealError = result.error && 
    result.error.trim() && 
    result.error !== 'Command failed' &&
    result.output === '';
  
  if (hasRealError) {
    return false; // Real error, no staged changes
  }
  
  // If success is false but no real error, it means exit code 1 (has staged changes)
  // If success is true, it means exit code 0 (no staged changes)
  return !result.success;
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
    // Only check for unstaged files if we're in a git repo
    // getStatus() returns null if not a git repo
    // Force fresh status check (don't use cache) to ensure we have latest data
    const status = getStatus(false);
    if (!status) {
      // Not a git repo - this should have been caught earlier, but handle gracefully
      return {
        valid: false,
        hasUnstagedFiles: false,
        error: 'No files added to staging! Did you forget to run git add?',
        suggestion: 'Run "gittable add" to stage files, or use "git cz -a" to commit all changes.',
      };
    }
    
    const unstagedCount = status.unstaged.length + status.untracked.length;
    
    // If there are unstaged files, return a special flag to offer staging options
    if (unstagedCount > 0) {
      return {
        valid: false,
        hasUnstagedFiles: true,
        unstagedCount,
        error: 'No files added to staging!',
        suggestion: 'Stage files to continue with commit.',
      };
    }
    
    // No staged files and no unstaged files - show error
    return {
      valid: false,
      hasUnstagedFiles: false,
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


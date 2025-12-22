/**
 * Commit execution module
 * Handles the actual git commit command execution
 */

const { execSync } = require('node:child_process');
const { GitError, createGitError } = require('../errors');

/**
 * Execute git commit with improved error handling
 */
function executeCommit(message, options = {}) {
  const {
    allowEmpty = false,
    amend = false,
    all = false,
    noVerify = false,
    noGpgSign = false,
    gitRoot = process.cwd(),
  } = options;

  // Build git commit command
  const args = ['commit'];

  if (amend) {
    args.push('--amend');
  }

  if (all) {
    args.push('-a');
  }

  if (noVerify) {
    args.push('--no-verify');
  }

  if (noGpgSign) {
    args.push('--no-gpg-sign');
  }

  // Use -F - to read message from stdin
  args.push('-F', '-');

  try {
    execSync(`git ${args.join(' ')}`, {
      cwd: gitRoot,
      input: message,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true };
  } catch (error) {
    const stderr = error.stderr?.toString() || '';
    const stdout = error.stdout?.toString() || '';

    // Parse common git errors for better messages
    let errorMessage = stderr || error.message || 'Failed to create commit';

    // Improve error messages
    if (stderr.includes('nothing to commit')) {
      errorMessage =
        'No changes to commit. Stage files first with "gittable add" or use --allow-empty.';
    } else if (stderr.includes('no changes added to commit')) {
      errorMessage = 'No changes staged for commit. Use "gittable add" to stage files.';
    } else if (stderr.includes('hook')) {
      errorMessage = `Git hook failed: ${stderr.trim()}`;
    }

    return {
      success: false,
      error: errorMessage,
      stdout,
      stderr,
    };
  }
}

/**
 * Execute commit and throw GitError on failure
 */
function executeCommitOrThrow(message, options = {}) {
  const result = executeCommit(message, options);
  if (!result.success) {
    throw createGitError(result, 'commit');
  }
  return result;
}

module.exports = {
  executeCommit,
  executeCommitOrThrow,
};


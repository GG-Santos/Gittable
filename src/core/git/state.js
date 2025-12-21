const { execGit } = require('./executor');

/**
 * Check if repository is in merge state
 */
function isMergeInProgress() {
  const result = execGit('rev-parse --verify MERGE_HEAD', { silent: true });
  return result.success;
}

/**
 * Check if repository is in rebase state
 */
function isRebaseInProgress() {
  const gitDirResult = execGit('rev-parse --git-dir', { silent: true });
  if (!gitDirResult.success) {
    return false;
  }

  const gitDir = gitDirResult.output.trim();
  const fs = require('node:fs');
  const path = require('node:path');

  // Check for rebase-apply or rebase-merge directories
  const rebaseApply = path.join(gitDir, 'rebase-apply');
  const rebaseMerge = path.join(gitDir, 'rebase-merge');

  return fs.existsSync(rebaseApply) || fs.existsSync(rebaseMerge);
}

/**
 * Check if repository is in cherry-pick state
 */
function isCherryPickInProgress() {
  const result = execGit('rev-parse --verify CHERRY_PICK_HEAD', { silent: true });
  return result.success;
}

/**
 * Get current repository state
 */
function getRepositoryState() {
  const state = {
    merge: isMergeInProgress(),
    rebase: isRebaseInProgress(),
    cherryPick: isCherryPickInProgress(),
    clean: true,
  };

  state.clean = !state.merge && !state.rebase && !state.cherryPick;

  return state;
}

/**
 * Get state description
 */
function getStateDescription() {
  const state = getRepositoryState();

  if (state.merge) {
    return 'merge';
  }
  if (state.rebase) {
    return 'rebase';
  }
  if (state.cherryPick) {
    return 'cherry-pick';
  }

  return null;
}

module.exports = {
  isMergeInProgress,
  isRebaseInProgress,
  isCherryPickInProgress,
  getRepositoryState,
  getStateDescription,
};

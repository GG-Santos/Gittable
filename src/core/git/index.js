// Re-export all git operations for convenience
const { execGit, isGitRepo, getCurrentBranch } = require('./executor');
const { getStatus } = require('./status');
const { getBranches } = require('./branch');
const { getLog, getStashList } = require('./commit');
const { remoteExists, getRemotes } = require('./remote');
const {
  isMergeInProgress,
  isRebaseInProgress,
  isCherryPickInProgress,
  getRepositoryState,
  getStateDescription,
} = require('./state');

module.exports = {
  // Executor
  execGit,
  isGitRepo,
  getCurrentBranch,
  // Status
  getStatus,
  // Branch
  getBranches,
  // Commit/Log
  getLog,
  getStashList,
  // Remote
  remoteExists,
  getRemotes,
  // State
  isMergeInProgress,
  isRebaseInProgress,
  isCherryPickInProgress,
  getRepositoryState,
  getStateDescription,
};

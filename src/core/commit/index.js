/**
 * Commit module - Re-exports commit-related functionality
 */

const { commitFlow, executeCommit, validateStagingArea, prompter } = require('./flow');
const buildCommit = require('./builder');
const { promptQuestions, CancelError } = require('./questions');
const { getCommitSuggestions, suggestTypeFromFiles } = require('./context');
const { getRecentMessages, saveRecentMessage, clearRecentMessages } = require('./recent-messages');
const { getPreviousCommit } = require('./get-previous-commit');

// Export modular functions
const { hasStagedChanges, getStagedFilesInfo } = require('./validation');
const { showCommitPreview } = require('./preview');
const { handleUnstagedFiles } = require('./staging');

module.exports = {
  // Main flow
  commitFlow,
  executeCommit,
  validateStagingArea,
  prompter,
  // Builder
  buildCommit,
  // Questions
  promptQuestions,
  CancelError,
  // Context
  getCommitSuggestions,
  suggestTypeFromFiles,
  // Recent messages
  getRecentMessages,
  saveRecentMessage,
  clearRecentMessages,
  // Previous commit
  getPreviousCommit,
  // Validation
  hasStagedChanges,
  getStagedFilesInfo,
  // Preview
  showCommitPreview,
  // Staging
  handleUnstagedFiles,
};

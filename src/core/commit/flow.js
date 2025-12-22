const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { promptQuestions, CancelError } = require('./questions');
const buildCommit = require('./builder');
const readConfigFile = require('../config/loader');
const { getCommitSuggestions } = require('./context');
const { getTheme } = require('../../utils/ui');
const { ConfigError, CancelledError: GittableCancelledError, GitError, ValidationError } = require('../errors');

// Import modular functions
const { validateStagingArea, hasStagedChanges, getStagedFilesInfo } = require('./validation');
const { executeCommit } = require('./execution');
const { handleUnstagedFiles } = require('./staging');
const { showCommitPreview, reviewCommitMessage } = require('./preview');
const { runPostCommitActions } = require('./post-commit');
const { handlePushIntegration } = require('./push-integration');

/**
 * Main commit flow - shared between commit command and commitizen adapter
 */
async function commitFlow(options = {}) {
  const {
    showHeader = false,
    showStagedFiles = true,
    skipValidation = false,
    commitCallback = null,
  } = options;

  // Show header if requested
  if (showHeader) {
    const { showCommandHeader } = require('../../utils/commands');
    showCommandHeader('COMMIT', 'Create Commit');
  }

  // Load config
  const config = readConfigFile();
  if (!config) {
    throw new ConfigError('No commit configuration found', {
      suggestion: 'Run "gittable setup" to create a configuration file',
      solution: 'gittable setup',
    });
  }

  const { DEFAULT_SUBJECT_LIMIT } = require('../constants');
  config.subjectLimit = config.subjectLimit || DEFAULT_SUBJECT_LIMIT;

  // Get context-aware suggestions
  const suggestions = getCommitSuggestions();
  if (suggestions.suggestedType && !options.skipTypeSuggestion) {
    const theme = getTheme();
    prompts.note(
      `Suggested type: ${theme.primary(suggestions.suggestedType)} (based on ${suggestions.fileCount} changed file(s))`,
      chalk.dim('Context-aware suggestion')
    );
  }

  // Check for pre-commit hook if not skipping verification
  if (!options.noVerify && process.stdin.isTTY) {
    const { checkPreCommitHook } = require('../../utils/git');
    const hookCheck = await checkPreCommitHook();

    if (hookCheck.exists && hookCheck.skip) {
      // User chose to skip hook, add --no-verify
      options.noVerify = true;
    } else if (hookCheck.exists && hookCheck.shouldRun) {
      // Run pre-commit hook
      const { runHook } = require('../../utils/git');
      const hookResult = runHook('pre-commit');

      if (!hookResult.success) {
        throw new GitError('Pre-commit hook failed', 'pre-commit', {
          suggestion: hookResult.error || 'Check your pre-commit hook configuration',
        });
      }

      if (hookResult.duration) {
        prompts.note(`Pre-commit hook passed (${hookResult.duration}ms)`, chalk.dim('Git Hook'));
      }
    }
  }

  // Validate staging area
  if (!skipValidation) {
    const validation = validateStagingArea(options);
    if (!validation.valid) {
      throw new ValidationError(validation.error, null, {
        suggestion: validation.suggestion,
      });
    }
  }

  // Check for unstaged files and offer staging options
  if (!skipValidation && process.stdin.isTTY) {
    try {
      const stagingResult = await handleUnstagedFiles(options);
      if (stagingResult.cancelled) {
        return { cancelled: true };
      }
      // If files were staged, refresh status
      if (stagingResult.staged) {
      // Clear status cache to get fresh data
      const { STATUS_CACHE_TTL } = require('../constants');
      const { getCache } = require('../../utils');
      const statusCache = getCache('status', { ttl: STATUS_CACHE_TTL });
      statusCache.clear();
      }
    } catch (error) {
      if (error instanceof GittableCancelledError) {
        return { cancelled: true };
      }
      throw error;
    }
  }

  // Prompt for commit message
  let message;
  try {
    const answers = await promptQuestions(config);
    message = buildCommit(answers, config);

    // Show commit preview and allow editing
    showCommitPreview(message, { showStagedFiles });
    const reviewResult = await reviewCommitMessage(message, { showStagedFiles });
    
    if (reviewResult.cancelled) {
      return { cancelled: true };
    }
    
    message = reviewResult.message;
  } catch (error) {
    if (error instanceof CancelError || error.isCancel || error instanceof GittableCancelledError) {
      return { cancelled: true };
    }
    throw error;
  }

  // Execute commit
  const spinner = prompts.spinner();
  spinner.start('Creating commit...');

  let result;
  if (commitCallback) {
    // Use provided callback (for commitizen adapter)
    try {
      await new Promise((resolve, reject) => {
        try {
          commitCallback(message);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      result = { success: true };
    } catch (error) {
      result = {
        success: false,
        error: error.message || 'Failed to create commit',
      };
    }
  } else {
    // Direct git commit
    result = executeCommit(message, options);
  }

  spinner.stop();

  if (result.success) {
    prompts.outro(chalk.green.bold('Commit created successfully'));

    // Run post-commit actions (hooks, notifications, message saving)
    await runPostCommitActions(message, options);

    // Handle push/sync integration
    await handlePushIntegration(options);

    return { success: true, message };
  }
  
  // Commit failed
  throw new GitError(result.error || 'Failed to create commit', 'commit', {
    suggestion: 'Check the error message above for details',
  });
}

/**
 * Prompter function for programmatic use
 * Provides a simple interface that wraps commitFlow
 * @param {unknown} _ - Unused parameter (kept for compatibility)
 * @param {function} commit - Commit callback function
 * @returns {Promise<void>}
 */
async function prompter(_, commit) {
  try {
    const result = await commitFlow({
      showHeader: false,
      showStagedFiles: true,
      skipValidation: false,
      commitCallback: commit,
    });

    if (result?.cancelled) {
      // Return cancellation status instead of exiting
      return { cancelled: true };
    }
    return result;
  } catch (error) {
    // Re-throw error instead of exiting
    // Caller should handle error appropriately
    throw error;
  }
}

// Re-export functions for backward compatibility
module.exports = {
  commitFlow,
  executeCommit,
  validateStagingArea,
  hasStagedChanges,
  getStagedFilesInfo,
  showCommitPreview,
  prompter,
};

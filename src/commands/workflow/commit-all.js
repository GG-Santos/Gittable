const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/command-helpers');
const { commitFlow } = require('../../core/commit/flow');
const clack = require('@clack/prompts');
const chalk = require('chalk');

/**
 * Commit-all command - Stage all and commit with message
 */
module.exports = async (args) => {
  showCommandHeader('COMMIT-ALL', 'Stage All and Commit');

  requireTTY('Please use: git add -A && git commit -m "message" for non-interactive mode');

  // Check if message is provided
  const messageIndex = args.findIndex((arg) => arg === '-m' || arg === '--message');
  let commitMessage = null;

  if (messageIndex !== -1 && args[messageIndex + 1]) {
    commitMessage = args[messageIndex + 1];
  } else if (args[0] && !args[0].startsWith('-')) {
    // Assume first non-flag arg is message
    commitMessage = args[0];
  }

  // Stage all changes
  const confirmed = await promptConfirm('Stage all changes?', true);
  if (!confirmed) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  await execGitWithSpinner('add -A', {
    spinnerText: 'Staging all changes',
    successMessage: null,
    errorMessage: 'Failed to stage files',
  });

  // Commit
  const commitOptions = {
    showHeader: false,
    showStagedFiles: true,
    all: false, // Already staged
    allowEmpty: args.includes('--allow-empty'),
    amend: args.includes('--amend'),
    noVerify: args.includes('--no-verify'),
    noGpgSign: args.includes('--no-gpg-sign'),
    skipPushSuggestion: true, // Don't show push suggestion in commit-all
  };

  // If message provided, use it directly
  if (commitMessage) {
    const { executeCommit } = require('../../core/commit/flow');
    const result = executeCommit(commitMessage, {
      all: false,
      allowEmpty: commitOptions.allowEmpty,
      amend: commitOptions.amend,
      noVerify: commitOptions.noVerify,
      noGpgSign: commitOptions.noGpgSign,
    });

    if (result.success) {
      clack.outro(chalk.green.bold('Commit created successfully'));
    } else {
      clack.cancel(chalk.red('Failed to create commit'));
      console.error(result.error);
      process.exit(1);
    }
  } else {
    // Interactive commit
    try {
      await commitFlow(commitOptions);
    } catch (error) {
      clack.cancel(chalk.red('Commit failed'));
      console.error(error.message);
      process.exit(1);
    }
  }
};

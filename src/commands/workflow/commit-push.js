const { showCommandHeader, requireTTY } = require('../../utils/commands');
const { commitFlow } = require('../../core/commit/flow');
const { handleError } = require('../../core/errors');

/**
 * Commit + Push command
 * Uses enhanced commit flow which handles push automatically
 */
module.exports = async (args) => {
  showCommandHeader('COMMIT-PUSH', 'Commit and Push');
  requireTTY('Please use: git commit -m "message" && git push for non-interactive commits');

  const commitOptions = {
    showHeader: false,
    showStagedFiles: true,
    all: args.includes('-a') || args.includes('--all'),
    allowEmpty: args.includes('--allow-empty'),
    amend: args.includes('--amend') || args.includes('--no-edit'),
    noVerify: args.includes('--no-verify'),
    noGpgSign: args.includes('--no-gpg-sign'),
    force: args.includes('--force') || args.includes('-f'),
    skipPushSuggestion: args.includes('--no-push'),
  };

  try {
    const result = await commitFlow(commitOptions);
    if (result?.cancelled) {
      return; // User cancelled, exit gracefully
    }
  } catch (error) {
    handleError(error, { exitCode: 1 });
    throw error; // Re-throw to let router handle it
  }
};

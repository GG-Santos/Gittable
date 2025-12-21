const { requireTTY } = require('../../utils/command-helpers');
const { commitFlow } = require('../../core/commit/flow');

/**
 * Commit command - Framework agnostic commit creation with interactive prompts
 * Supports going back to previous questions during the commit flow
 */
module.exports = async (args) => {
  requireTTY('Please use: git commit -m "message" for non-interactive commits');

  // Parse command line arguments
  const options = {
    showHeader: true,
    showStagedFiles: true,
    all: args.includes('-a') || args.includes('--all'),
    allowEmpty: args.includes('--allow-empty'),
    amend: args.includes('--amend') || args.includes('--no-edit'),
    noVerify: args.includes('--no-verify'),
    noGpgSign: args.includes('--no-gpg-sign'),
  };

  try {
    await commitFlow(options);
  } catch (error) {
    // Error handling is done in commitFlow
    process.exit(1);
  }
};

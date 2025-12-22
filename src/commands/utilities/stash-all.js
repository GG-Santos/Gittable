const ui = require('../../ui/framework');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/commands');

/**
 * Stash-all command - Stash all changes including untracked files
 */
module.exports = async (args) => {
  showCommandHeader('STASH-ALL', 'Stash All Changes');

  requireTTY('Please use: git stash push -u -m "message" for non-interactive mode');

  // Parse message
  const messageIndex = args.findIndex((arg) => arg === '-m' || arg === '--message');
  let stashMessage = null;

  if (messageIndex !== -1 && args[messageIndex + 1]) {
    stashMessage = args[messageIndex + 1];
  } else if (args[0] && !args[0].startsWith('-')) {
    stashMessage = args[0];
  }

  // Confirm
  const confirmed = await promptConfirm('Stash all changes including untracked files?', true);
  if (!confirmed) {
    return;
  }

  // Build stash command
  let stashCommand = 'stash push -u';
  if (stashMessage) {
    stashCommand += ` -m "${stashMessage}"`;
  }

  await execGitWithSpinner(stashCommand, {
    spinnerText: 'Stashing all changes',
    successMessage: 'All changes stashed',
    errorMessage: 'Failed to stash changes',
  });
};

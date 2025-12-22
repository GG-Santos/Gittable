const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { remoteExists, getRemotes } = require('../../core/git');
const { promptConfirm } = require('../../utils/commands');
const { addRemote } = require('../../commands/remote/remote');
const { CancelledError, GitError } = require('../../core/errors');

/**
 * Ensure remote exists, prompting to add it if it doesn't
 * This pattern is duplicated in push.js, pull.js, and sync.js
 * @param {string} remote - Remote name (default: 'origin')
 * @returns {Promise<boolean>} - True if remote exists or was added successfully
 */
async function ensureRemoteExists(remote = 'origin') {
  if (remoteExists(remote)) {
    return true;
  }

  const remotes = getRemotes();
  if (remotes.length === 0) {
    console.log(chalk.yellow(`Remote '${remote}' does not exist.`));
  } else {
    console.log(chalk.yellow(`Remote '${remote}' not found`));
    console.log(chalk.dim(`Available remotes: ${remotes.join(', ')}`));
  }

  const shouldAdd = await promptConfirm(`Would you like to add remote '${remote}'?`, true);

  if (!shouldAdd) {
    throw new CancelledError('Remote addition cancelled');
  }

  const added = await addRemote([remote, null]);
  if (!added) {
    throw new GitError(`Failed to add remote '${remote}'`, 'remote');
  }

  return added;
}

module.exports = {
  ensureRemoteExists,
};

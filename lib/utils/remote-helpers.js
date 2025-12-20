const clack = require('@clack/prompts');
const chalk = require('chalk');
const { remoteExists, getRemotes } = require('../git/exec');
const { addRemote } = require('../../commands/remote');
const { promptConfirm } = require('./command-helpers');

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

  const shouldAdd = await promptConfirm(
    `Would you like to add remote '${remote}'?`,
    true
  );

  if (!shouldAdd) {
    clack.cancel(chalk.yellow('Cancelled'));
    process.exit(1);
  }

  const added = await addRemote(remote, null);
  if (!added) {
    process.exit(1);
  }

  return added;
}

module.exports = {
  ensureRemoteExists,
};



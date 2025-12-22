/**
 * Post-commit hooks and notifications module
 * Handles post-commit actions like hooks, notifications, and message saving
 */

const prompts = require('../../ui/prompts');
const chalk = require('chalk');

/**
 * Run post-commit hooks and send notifications
 */
async function runPostCommitActions(message, options = {}) {
  if (options.skipPostCommit || !process.stdin.isTTY) {
    return;
  }

  // Run post-commit hooks if enabled
  const { runPostCommitHooks, sendNotification } = require('../../utils/post-commit');
  const { getPreference } = require('../../utils/user-preferences');

  const runPostCommit = getPreference('postCommit.enabled', false);
  if (runPostCommit) {
    await runPostCommitHooks({
      runTests: getPreference('postCommit.runTests', false),
      sendNotifications: getPreference('postCommit.sendNotifications', false),
    });
  }

  // Send notification if enabled
  const notificationsEnabled = getPreference('notifications.enabled', false);
  if (notificationsEnabled) {
    const shortMessage = message.split('\n')[0];
    sendNotification('Commit Created', `Commit created successfully: ${shortMessage}`, {
      type: 'success',
    });
  }

  // Save commit message to recent messages
  const { saveRecentMessage } = require('./recent-messages');
  saveRecentMessage(message);
}

module.exports = {
  runPostCommitActions,
};


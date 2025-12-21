const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader } = require('../../utils/command-helpers');
const { sendNotification } = require('../../utils/post-commit');
const { getPreference, setPreference } = require('../../utils/user-preferences');

/**
 * Notification management command
 */
module.exports = async (args) => {
  const action = args[0];

  if (!action || action === 'status') {
    showCommandHeader('NOTIFY', 'Notification Status');
    const enabled = getPreference('notifications.enabled', false);

    console.log();
    if (enabled) {
      console.log(chalk.green('✓ Notifications are enabled'));
    } else {
      console.log(chalk.dim('Notifications are disabled'));
    }

    console.log();
    console.log(chalk.dim('Enable: gittable notify enable'));
    console.log(chalk.dim('Disable: gittable notify disable'));
    console.log(chalk.dim('Test: gittable notify test'));
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'enable' || action === 'on') {
    showCommandHeader('NOTIFY', 'Enable Notifications');
    setPreference('notifications.enabled', true);
    clack.outro(chalk.green.bold('Notifications enabled'));
    return;
  }

  if (action === 'disable' || action === 'off') {
    showCommandHeader('NOTIFY', 'Disable Notifications');
    setPreference('notifications.enabled', false);
    clack.outro(chalk.green.bold('Notifications disabled'));
    return;
  }

  if (action === 'test') {
    showCommandHeader('NOTIFY', 'Test Notification');
    sendNotification('Gittable Test', 'This is a test notification from Gittable', {
      type: 'info',
    });
    clack.outro(chalk.green.bold('Test notification sent'));
    return;
  }

  // Default: show status
  showCommandHeader('NOTIFY', 'Notification Status');
  const enabled = getPreference('notifications.enabled', false);
  console.log(chalk[enabled ? 'green' : 'dim'](enabled ? '✓ Enabled' : 'Disabled'));
  clack.outro(chalk.green.bold('Done'));
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader } = require('../../utils/command-helpers');
const { sendNotification } = require('../../utils/post-commit');
const { getPreference, setPreference } = require('../../utils/user-preferences');
const { getTheme } = require('../../utils/color-theme');

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

    const theme = getTheme();
    console.log();
    console.log(theme.dim('Enable: gittable notify enable'));
    console.log(theme.dim('Disable: gittable notify disable'));
    console.log(theme.dim('Test: gittable notify test'));
    ui.success('Done');
    return;
  }

  if (action === 'enable' || action === 'on') {
    showCommandHeader('NOTIFY', 'Enable Notifications');
    setPreference('notifications.enabled', true);
    ui.success('Notifications enabled');
    return;
  }

  if (action === 'disable' || action === 'off') {
    showCommandHeader('NOTIFY', 'Disable Notifications');
    setPreference('notifications.enabled', false);
    ui.success('Notifications disabled');
    return;
  }

  if (action === 'test') {
    showCommandHeader('NOTIFY', 'Test Notification');
    sendNotification('Gittable Test', 'This is a test notification from Gittable', {
      type: 'info',
    });
    ui.success('Test notification sent');
    return;
  }

  // Default: show status
  showCommandHeader('NOTIFY', 'Notification Status');
  const enabled = getPreference('notifications.enabled', false);
  const theme2 = getTheme();
  console.log(enabled ? theme2.success('✓ Enabled') : theme2.dim('Disabled'));
  ui.success('Done');
};

const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Remote-set-url command - Update remote URL
 */
module.exports = async (args) => {
  showCommandHeader('REMOTE-SET-URL', 'Update Remote URL');

  requireTTY('Please use: git remote set-url <name> <url> for non-interactive mode');

  let remoteName = args[0];
  let newUrl = args[1];

  // Get remote name
  if (!remoteName) {
    const remotesResult = execGit('remote', { silent: true });
    if (!remotesResult.success || !remotesResult.output.trim()) {
      clack.cancel(chalk.yellow('No remotes found'));
      return;
    }

    const remotes = remotesResult.output.trim().split('\n').filter(Boolean);
    const options = remotes.map((name) => ({
      value: name,
      label: name,
    }));

    const theme = getTheme();
    remoteName = await clack.select({
      message: theme.primary('Select remote:'),
      options,
    });

    if (handleCancel(remoteName)) return;
  }

  // Get current URL
  const currentUrlResult = execGit(`remote get-url ${remoteName}`, { silent: true });
  if (!currentUrlResult.success) {
    clack.cancel(chalk.red(`Remote ${remoteName} not found`));
    return;
  }

  const currentUrl = currentUrlResult.output.trim();
  console.log(chalk.dim(`Current URL: ${currentUrl}`));

  // Get new URL
  if (!newUrl) {
    const theme = getTheme();
    newUrl = await clack.text({
      message: theme.primary('New remote URL:'),
      placeholder: 'https://github.com/user/repo.git',
      initialValue: currentUrl,
    });

    if (handleCancel(newUrl)) return;
  }

  if (newUrl === currentUrl) {
    clack.outro(chalk.yellow('URL unchanged'));
    return;
  }

  // Update URL
  await execGitWithSpinner(`remote set-url ${remoteName} ${newUrl}`, {
    spinnerText: 'Updating remote URL',
    successMessage: `Remote ${remoteName} URL updated`,
    errorMessage: 'Failed to update remote URL',
  });
};

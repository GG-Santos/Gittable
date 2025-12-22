const chalk = require('chalk');
const ui = require('../../ui/framework');
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
      ui.warn('No remotes found');
      return;
    }

    const remotes = remotesResult.output.trim().split('\n').filter(Boolean);
    const options = remotes.map((name) => ({
      value: name,
      label: name,
    }));

    remoteName = await ui.prompt.select({
      message: 'Select remote:',
      options,
    });

    if (remoteName === null) return;
  }

  // Get current URL
  const currentUrlResult = execGit(`remote get-url ${remoteName}`, { silent: true });
  if (!currentUrlResult.success) {
    ui.error(`Remote ${remoteName} not found`, { exit: true });
  }

  const currentUrl = currentUrlResult.output.trim();
  console.log(chalk.dim(`Current URL: ${currentUrl}`));

  // Get new URL
  if (!newUrl) {
    newUrl = await ui.prompt.text({
      message: 'New remote URL:',
      placeholder: 'https://github.com/user/repo.git',
      initialValue: currentUrl,
    });

    if (newUrl === null) return;
  }

  if (newUrl === currentUrl) {
    ui.info('URL unchanged', { dim: true });
    return;
  }

  // Update URL
  await execGitWithSpinner(`remote set-url ${remoteName} ${newUrl}`, {
    spinnerText: 'Updating remote URL',
    successMessage: `Remote ${remoteName} URL updated`,
    errorMessage: 'Failed to update remote URL',
  });
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  showBanner('CLONE');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Clone Repository')}`);

  let url = args[0];
  let directory = args[1];

  if (!url) {
    if (!process.stdin.isTTY) {
      ui.error('Interactive mode required', {
        suggestion: 'Please provide a repository URL: gittable clone <url> [directory]',
        exit: true,
      });
    }

    url = await ui.prompt.text({
      message: 'Repository URL:',
      placeholder: 'https://github.com/user/repo.git',
    });

    if (url === null) return;
  }

  if (!directory) {
    if (process.stdin.isTTY) {
      directory = await ui.prompt.text({
        message: 'Directory name (optional):',
        placeholder: 'repo-name',
        required: false,
      });

      if (directory === null) return;
    }
  }

  const depth = args.find((arg) => arg.startsWith('--depth='))?.split('=')[1];
  const branch =
    args.find((arg) => arg.startsWith('--branch='))?.split('=')[1] ||
    args.find((arg) => arg.startsWith('-b='))?.split('=')[1];

  const spinner = ui.prompt.spinner();
  spinner.start(`Cloning ${url}${directory ? ` into ${directory}` : ''}`);

  let command = `clone ${url}`;
  if (directory) {
    command += ` ${directory}`;
  }
  if (depth) {
    command += ` --depth ${depth}`;
  }
  if (branch) {
    command += ` --branch ${branch}`;
  }

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success('Repository cloned');
  } else {
    ui.error('Failed to clone repository', {
      suggestion: result.error,
      exit: true,
    });
  }
};

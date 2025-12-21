const clack = require('@clack/prompts');
const chalk = require('chalk');
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
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a repository URL: gittable clone <url> [directory]'));
      process.exit(1);
    }

    const theme = getTheme();
    url = await clack.text({
      message: theme.primary('Repository URL:'),
      placeholder: 'https://github.com/user/repo.git',
    });

    if (clack.isCancel(url)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  if (!directory) {
    if (process.stdin.isTTY) {
      directory = await clack.text({
        message: theme.primary('Directory name (optional):'),
        placeholder: 'repo-name',
        required: false,
      });

      if (clack.isCancel(directory)) {
        clack.cancel(chalk.yellow('Cancelled'));
        return;
      }
    }
  }

  const depth = args.find((arg) => arg.startsWith('--depth='))?.split('=')[1];
  const branch =
    args.find((arg) => arg.startsWith('--branch='))?.split('=')[1] ||
    args.find((arg) => arg.startsWith('-b='))?.split('=')[1];

  const spinner = clack.spinner();
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
    clack.outro(chalk.green.bold('Repository cloned'));
  } else {
    clack.cancel(chalk.red('Failed to clone repository'));
    console.error(result.error);
    process.exit(1);
  }
};

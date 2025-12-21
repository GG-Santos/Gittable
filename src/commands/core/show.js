const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('SHOW');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Show Commit'))}`);

  const commit = args[0] || 'HEAD';

  // Check if commit exists (for HEAD or any commit)
  const checkResult = execGit(`rev-parse --verify ${commit}`, { silent: true });
  if (!checkResult.success) {
    clack.cancel(chalk.red('Failed to show commit'));
    if (commit === 'HEAD') {
      console.log(chalk.yellow('No commits found in repository'));
      console.log(chalk.gray('Make at least one commit before using show'));
    } else {
      console.error(chalk.red(`Commit ${commit} does not exist`));
    }
    process.exit(1);
  }

  const stat = args.includes('--stat') || args.includes('-s');
  const nameOnly = args.includes('--name-only') || args.includes('--name-status');

  let command = 'show';
  if (stat) {
    command += ' --stat';
  } else if (nameOnly) {
    command += ' --name-status';
  } else {
    command += ' --format=fuller';
  }
  command += ` ${commit}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    clack.cancel(chalk.red('Failed to show commit'));
    console.error(result.error);
    process.exit(1);
  }

  clack.outro(chalk.green.bold('Done'));
};

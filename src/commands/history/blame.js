const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('BLAME');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Blame File'))}`);

  const file = args[0];
  const revision = args.find((arg) => !arg.startsWith('--'));

  if (!file) {
    clack.cancel(chalk.yellow('No file specified'));
    return;
  }

  let command = 'blame';
  if (revision && revision !== file) {
    command += ` ${revision}`;
  }
  command += ` ${file}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    clack.cancel(chalk.red('Failed to show blame'));
    console.error(result.error);
    process.exit(1);
  }

  clack.outro(chalk.green.bold('Done'));
};

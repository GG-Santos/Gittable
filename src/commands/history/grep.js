const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('GREP');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Search in Repository'))}`);

  const pattern = args[0];
  const caseInsensitive = args.includes('--ignore-case') || args.includes('-i');
  const files = args.filter((arg) => !arg.startsWith('--') && arg !== pattern);

  if (!pattern) {
    clack.cancel(chalk.yellow('No search pattern specified'));
    return;
  }

  let command = 'grep';
  if (caseInsensitive) {
    command += ' --ignore-case';
  }
  command += ` "${pattern}"`;
  if (files.length > 0) {
    command += ` ${files.join(' ')}`;
  }

  const result = execGit(command, { silent: false });

  if (!result.success) {
    // Grep returns non-zero when no matches found, which is not an error
    if (result.error && !result.error.includes('No matches found')) {
      clack.cancel(chalk.red('Grep failed'));
      console.error(result.error);
      process.exit(1);
    } else {
      console.log(chalk.dim('No matches found'));
    }
  }

  clack.outro(chalk.green.bold('Done'));
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('BLAME');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Blame File'))}`);

  const file = args[0];
  const revision = args.find((arg) => !arg.startsWith('--'));

  if (!file) {
    ui.warn('No file specified');
    return;
  }

  let command = 'blame';
  if (revision && revision !== file) {
    command += ` ${revision}`;
  }
  command += ` ${file}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    ui.error('Failed to show blame', {
      suggestion: result.error,
      exit: true,
    });
  }

  ui.success('Done');
};

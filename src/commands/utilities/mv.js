const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('MV');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Move/Rename Files'))}`);

  const force = args.includes('--force') || args.includes('-f');
  const files = args.filter((arg) => !arg.startsWith('--'));

  if (files.length < 2) {
    ui.warn('Usage: mv <source> <destination>');
    return;
  }

  const source = files[0];
  const destination = files[1];

  const spinner = ui.prompt.spinner();
  spinner.start(`Moving ${source} to ${destination}`);

  let command = 'mv';
  if (force) {
    command += ' --force';
  }
  command += ` ${source} ${destination}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success(`Moved ${source} to ${destination}`);
  } else {
    ui.error('Failed to move file', {
      suggestion: result.error,
      exit: true,
    });
  }
};

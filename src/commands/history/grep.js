const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('GREP');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Search in Repository'))}`);

  const pattern = args[0];
  const caseInsensitive = args.includes('--ignore-case') || args.includes('-i');
  const files = args.filter((arg) => !arg.startsWith('--') && arg !== pattern);

  if (!pattern) {
    ui.warn('No search pattern specified');
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
      ui.error('Grep failed', {
        suggestion: result.error,
        exit: true,
      });
    } else {
      const theme = getTheme();
      console.log(theme.dim('No matches found'));
    }
  }

  ui.success('Done');
};

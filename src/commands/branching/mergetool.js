const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader, execGitWithSpinner } = require('../../utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('MERGETOOL', 'Launch Merge Tool');

  const tool =
    args.find((arg) => arg.startsWith('--tool='))?.split('=')[1] ||
    args.find((arg) => arg.startsWith('-t='))?.split('=')[1] ||
    null;

  const noPrompt = args.includes('--no-prompt') || args.includes('-y');
  const prompt = !noPrompt && (args.includes('--prompt') || args.includes('-p'));
  const gui = args.includes('--gui') || args.includes('-g');
  const noGui = args.includes('--no-gui') || args.includes('--no-tool');

  const files = args.filter(
    (arg) => !arg.startsWith('--') && !arg.startsWith('-') && !arg.includes('=')
  );

  let command = 'mergetool';
  if (tool) command += ` --tool=${tool}`;
  if (noPrompt) command += ' --no-prompt';
  if (prompt) command += ' --prompt';
  if (gui) command += ' --gui';
  if (noGui) command += ' --no-gui';
  if (files.length > 0) {
    command += ` ${files.join(' ')}`;
  }

  const result = execGit(command, { silent: false });

  if (!result.success) {
    // Check if there are merge conflicts
    const statusResult = execGit('status --porcelain', { silent: true });
    if (statusResult.success) {
      const hasConflicts =
        statusResult.output.includes('UU') ||
        statusResult.output.includes('AA') ||
        statusResult.output.includes('DD');

      if (!hasConflicts) {
        ui.warn('No merge conflicts to resolve');
        ui.info('Use this command when you have merge conflicts');
        return;
      }
    }

    ui.error('Failed to launch merge tool', {
      suggestion: result.error,
      exit: true,
    });
  } else {
    ui.success('Merge tool completed');
  }
};

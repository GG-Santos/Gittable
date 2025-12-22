const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader, requireTTY, handleCancel } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  showCommandHeader('RANGE-DIFF', 'Compare Commit Ranges');

  let range1 = args[0];
  let range2 = args[1];

  // Parse --range1 and --range2 flags
  const range1Flag = args.find((arg) => arg.startsWith('--range1='))?.split('=')[1];
  const range2Flag = args.find((arg) => arg.startsWith('--range2='))?.split('=')[1];

  if (range1Flag) range1 = range1Flag;
  if (range2Flag) range2 = range2Flag;

  if (!range1 || !range2) {
    requireTTY('Please provide two commit ranges: gittable range-diff <range1> <range2>');

    if (!range1) {
      range1 = await ui.prompt.text({
        message: 'First commit range (e.g., main..feature):',
        placeholder: 'main..feature',
      });
      if (range1 === null) return;
    }

    if (!range2) {
      range2 = await ui.prompt.text({
        message: 'Second commit range (e.g., main..feature-v2):',
        placeholder: 'main..feature-v2',
      });
      if (range2 === null) return;
    }
  }

  const creationFactor = args.find((arg) => arg.startsWith('--creation-factor='))?.split('=')[1];
  const noNotes = args.includes('--no-notes');
  const notes = args.includes('--notes');
  const stat = args.includes('--stat') || args.includes('-s');
  const summary = args.includes('--summary');

  let command = 'range-diff';
  if (creationFactor) command += ` --creation-factor=${creationFactor}`;
  if (noNotes) command += ' --no-notes';
  if (notes) command += ' --notes';
  if (stat) command += ' --stat';
  if (summary) command += ' --summary';
  command += ` ${range1} ${range2}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    ui.error('Failed to compare commit ranges', {
      suggestion: result.error,
      exit: true,
    });
  }

  ui.success('Done');
};

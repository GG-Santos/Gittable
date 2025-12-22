const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader, requireTTY } = require('../../utils/commands');

/**
 * Check if arguments match range-diff pattern
 * Patterns: "main..feature", "commit1..commit2", or two separate ranges
 */
function isRangeDiffPattern(args) {
  // Check for --range-diff flag
  if (args.includes('--range-diff')) {
    return true;
  }

  // Check for range patterns (e.g., "main..feature", "commit1..commit2")
  const nonFlagArgs = args.filter((arg) => !arg.startsWith('--'));
  
  // If we have two non-flag arguments that look like ranges
  if (nonFlagArgs.length >= 2) {
    const hasRangePattern = nonFlagArgs.some((arg) => arg.includes('..'));
    if (hasRangePattern) {
      return true;
    }
  }

  // If we have exactly two non-flag arguments, treat as range-diff
  if (nonFlagArgs.length === 2) {
    return true;
  }

  return false;
}

module.exports = async (args) => {
  // Check if this is a range-diff request
  if (isRangeDiffPattern(args)) {
    showCommandHeader('DIFF', 'Compare Commit Ranges');

    let range1, range2;

    // Parse --range-diff flag
    if (args.includes('--range-diff')) {
      const rangeDiffIndex = args.indexOf('--range-diff');
      const nonFlagArgs = args.filter((arg) => !arg.startsWith('--') && args.indexOf(arg) > rangeDiffIndex);
      range1 = nonFlagArgs[0];
      range2 = nonFlagArgs[1];
    } else {
      // Parse range patterns from arguments
      const nonFlagArgs = args.filter((arg) => !arg.startsWith('--'));
      range1 = nonFlagArgs[0];
      range2 = nonFlagArgs[1];
    }

    // Parse --range1 and --range2 flags
    const range1Flag = args.find((arg) => arg.startsWith('--range1='))?.split('=')[1];
    const range2Flag = args.find((arg) => arg.startsWith('--range2='))?.split('=')[1];

    if (range1Flag) range1 = range1Flag;
    if (range2Flag) range2 = range2Flag;

    // If ranges not provided, prompt for them
    if (!range1 || !range2) {
      requireTTY('Please provide two commit ranges: gittable diff <range1> <range2> or gittable diff --range-diff <range1> <range2>');

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
    return;
  }

  // Regular diff command
  showCommandHeader('DIFF', 'Show Changes');

  const staged = args.includes('--staged') || args.includes('--cached');
  const file = args.find((arg) => !arg.startsWith('--'));

  let command = 'diff';
  if (staged) {
    command += ' --staged';
  }
  if (file) {
    command += ` ${file}`;
  }

  const result = execGit(command, { silent: false });

  if (!result.success) {
    ui.error('Failed to show diff', {
      suggestion: result.error,
      exit: true,
    });
  }

  ui.success('Done');
};

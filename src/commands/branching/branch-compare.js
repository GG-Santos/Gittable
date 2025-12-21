const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getBranches, getCurrentBranch, execGit } = require('../../core/git');
const { showCommandHeader, requireTTY, handleCancel } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Branch-compare command - Show differences between two branches
 */
module.exports = async (args) => {
  showCommandHeader('BRANCH-COMPARE', 'Compare Branches');

  requireTTY('Please use: git diff <branch1>..<branch2> for non-interactive mode');

  const branches = getBranches();
  const current = getCurrentBranch();

  let branch1 = args[0];
  let branch2 = args[1];

  // Get first branch
  if (!branch1) {
    const options = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? chalk.green(`* ${branch.name}`) : branch.name,
    }));

    const theme = getTheme();
    branch1 = await clack.select({
      message: theme.primary('Select first branch:'),
      options,
    });

    if (handleCancel(branch1)) return;
  }

  // Get second branch
  if (!branch2) {
    const options = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? chalk.green(`* ${branch.name}`) : branch.name,
    }));

    branch2 = await clack.select({
      message: theme.primary('Select second branch:'),
      options,
    });

    if (handleCancel(branch2)) return;
  }

  if (branch1 === branch2) {
    clack.cancel(chalk.yellow('Cannot compare branch to itself'));
    return;
  }

  // Show commit differences
  console.log(chalk.cyan(`\nCommits in ${branch2} but not in ${branch1}:`));
  const aheadResult = execGit(`log ${branch1}..${branch2} --oneline`, { silent: true });
  if (aheadResult.success && aheadResult.output.trim()) {
    console.log(aheadResult.output);
  } else {
    console.log(chalk.dim('  (none)'));
  }

  console.log(chalk.cyan(`\nCommits in ${branch1} but not in ${branch2}:`));
  const behindResult = execGit(`log ${branch2}..${branch1} --oneline`, { silent: true });
  if (behindResult.success && behindResult.output.trim()) {
    console.log(behindResult.output);
  } else {
    console.log(chalk.dim('  (none)'));
  }

  // Show file differences
  console.log(chalk.cyan('\nFile differences:'));
  const diffResult = execGit(`diff --stat ${branch1}..${branch2}`, { silent: true });
  if (diffResult.success) {
    console.log(diffResult.output || chalk.dim('  (no differences)'));
  }

  console.log();
  clack.outro(chalk.green.bold('Comparison complete'));
};

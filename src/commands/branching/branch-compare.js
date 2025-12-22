const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getBranches, getCurrentBranch, execGit } = require('../../core/git');
const { showCommandHeader, requireTTY, handleCancel } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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

    branch1 = await ui.prompt.select({
      message: 'Select first branch:',
      options,
    });

    if (branch1 === null) return;
  }

  // Get second branch
  if (!branch2) {
    const options = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? chalk.green(`* ${branch.name}`) : branch.name,
    }));

    branch2 = await ui.prompt.select({
      message: 'Select second branch:',
      options,
    });

    if (branch2 === null) return;
  }

  if (branch1 === branch2) {
    ui.warn('Cannot compare branch to itself');
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
  ui.success('Comparison complete');
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showBanner } = require('../../ui/banner');
const VERSION = require('../../../package.json').version;
const { requireTTY } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Tutorial command - Interactive walkthrough of common workflows
 */
const TUTORIALS = [
  {
    name: 'Basic Workflow',
    description: 'Stage, commit, and push changes',
    steps: [
      { text: 'Check repository status', cmd: 'gittable status' },
      { text: 'Stage files for commit', cmd: 'gittable add' },
      { text: 'Create a commit', cmd: 'gittable commit' },
      { text: 'Push to remote', cmd: 'gittable push' },
    ],
  },
  {
    name: 'Quick Workflow',
    description: 'Use the quick command for common workflow',
    steps: [{ text: 'Stage, commit, and push in one command', cmd: 'gittable quick' }],
  },
  {
    name: 'Branch Workflow',
    description: 'Create and work with branches',
    steps: [
      { text: 'List branches', cmd: 'gittable branch' },
      { text: 'Create new branch', cmd: 'gittable branch create feature/new-feature' },
      { text: 'Make changes and commit', cmd: 'gittable commit' },
      { text: 'Push branch to remote', cmd: 'gittable push' },
    ],
  },
  {
    name: 'Stash Workflow',
    description: 'Temporarily save changes',
    steps: [
      { text: 'Stash current changes', cmd: 'gittable stash create "WIP: feature"' },
      { text: 'Switch branches or pull', cmd: 'gittable pull' },
      { text: 'Restore stashed changes', cmd: 'gittable stash apply 0' },
    ],
  },
  {
    name: 'Conflict Resolution',
    description: 'Resolve merge conflicts',
    steps: [
      { text: 'List conflicted files', cmd: 'gittable conflicts' },
      { text: 'Resolve a file', cmd: 'gittable resolve file.js' },
      { text: 'Continue merge/rebase', cmd: 'gittable merge --continue' },
    ],
  },
];

module.exports = async (_args) => {
  requireTTY('Tutorial requires interactive mode');

  showBanner('GITTABLE', { version: VERSION });
  console.log();
  console.log(chalk.bold.cyan('Interactive Tutorial'));
  console.log(chalk.dim('Learn common Git workflows with Gittable'));
  console.log();

  const options = TUTORIALS.map((tutorial, index) => ({
    value: index,
    label: `${chalk.cyan(tutorial.name)} - ${chalk.gray(tutorial.description)}`,
  }));

  options.push({
    value: 'exit',
    label: chalk.red('Exit tutorial'),
  });

  const selected = await ui.prompt.select({
    message: 'Select a tutorial:',
    options,
  });

  if (selected === null || selected === 'exit') {
    return;
  }

  const tutorial = TUTORIALS[selected];

  console.log();
  console.log(chalk.bold.yellow(tutorial.name));
  console.log(chalk.dim(tutorial.description));
  console.log();

  for (let i = 0; i < tutorial.steps.length; i++) {
    const step = tutorial.steps[i];
    console.log(chalk.cyan(`Step ${i + 1}: ${step.text}`));
    console.log(chalk.gray(`  $ ${step.cmd}`));
    console.log();

    if (i < tutorial.steps.length - 1) {
      const continueTutorial = await ui.prompt.confirm({
        message: 'Continue to next step?',
        initialValue: true,
      });

      if (!continueTutorial) {
        return;
      }
      console.log();
    }
  }

  console.log();
  ui.success('Tutorial complete!');
  const theme = getTheme();
  console.log(theme.dim('Try these commands in your repository'));
};

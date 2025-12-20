#!/usr/bin/env node

const clack = require('@clack/prompts');
const chalk = require('chalk');
const { isGitRepo } = require('./lib/git/exec');

// Command aliases mapping
const COMMANDS = {
  status: require('./commands/status'),
  st: require('./commands/status'),

  branch: require('./commands/branch'),
  br: require('./commands/branch'),
  co: require('./commands/branch'),

  commit: require('./commands/commit'),
  ci: require('./commands/commit'),

  pull: require('./commands/pull'),
  pl: require('./commands/pull'),

  push: require('./commands/push'),
  ps: require('./commands/push'),

  sync: require('./commands/sync'),

  merge: require('./commands/merge'),

  rebase: require('./commands/rebase'),

  stash: require('./commands/stash'),

  log: require('./commands/log'),

  undo: require('./commands/undo'),
  reset: require('./commands/undo'),

  // New commands
  add: require('./commands/add'),
  diff: require('./commands/diff'),
  init: require('./commands/init'),
  uninit: require('./commands/uninit'),
  deinit: require('./commands/uninit'),
  clone: require('./commands/clone'),
  fetch: require('./commands/fetch'),
  remote: require('./commands/remote'),
  tag: require('./commands/tag'),
  show: require('./commands/show'),
  checkout: require('./commands/checkout'),
  revert: require('./commands/revert'),
  'cherry-pick': require('./commands/cherry-pick'),
  clean: require('./commands/clean'),
  config: require('./commands/config'),
  blame: require('./commands/blame'),
  grep: require('./commands/grep'),
  rm: require('./commands/rm'),
  mv: require('./commands/mv'),
  restore: require('./commands/restore'),
  // New missing commands
  switch: require('./commands/switch'),
  sw: require('./commands/switch'),
  bisect: require('./commands/bisect'),
  archive: require('./commands/archive'),
  describe: require('./commands/describe'),
  shortlog: require('./commands/shortlog'),
  'range-diff': require('./commands/range-diff'),
  worktree: require('./commands/worktree'),
  wt: require('./commands/worktree'),
  submodule: require('./commands/submodule'),
  sub: require('./commands/submodule'),
  mergetool: require('./commands/mergetool'),
  mt: require('./commands/mergetool'),
};

const VERSION = require('./package.json').version;
const { showBanner } = require('./lib/ui/banner');
const { createLink } = require('./lib/utils/terminal-link');

// Command categories - organized by workflow and functionality
const COMMAND_CATEGORIES = {
  gettingStarted: {
    name: 'Getting Started',
    commands: [
      { name: 'init', aliases: [], description: 'Initialize a new repository' },
      { name: 'clone', aliases: [], description: 'Clone a repository' },
      { name: 'config', aliases: [], description: 'Git configuration management' },
    ],
  },
  coreWorkflow: {
    name: 'Core Workflow',
    commands: [
      { name: 'status', aliases: ['st'], description: 'Show repository status' },
      { name: 'add', aliases: [], description: 'Stage files for commit' },
      { name: 'commit', aliases: ['ci'], description: 'Create commits with conventional format' },
      { name: 'diff', aliases: [], description: 'Show changes between commits, branches, or files' },
      { name: 'log', aliases: [], description: 'View commit history' },
      { name: 'show', aliases: [], description: 'Show commit details and changes' },
    ],
  },
  branching: {
    name: 'Branching & Merging',
    commands: [
      { name: 'branch', aliases: ['br'], description: 'Branch management (list, create, delete)' },
      { name: 'checkout', aliases: ['co'], description: 'Checkout branches or restore files' },
      { name: 'switch', aliases: ['sw'], description: 'Switch branches (modern alternative to checkout)' },
      { name: 'merge', aliases: [], description: 'Merge branches' },
      { name: 'rebase', aliases: [], description: 'Rebase operations' },
      { name: 'cherry-pick', aliases: [], description: 'Apply commits from another branch' },
      { name: 'mergetool', aliases: ['mt'], description: 'Launch merge tool to resolve conflicts' },
    ],
  },
  remote: {
    name: 'Remote Operations',
    commands: [
      { name: 'remote', aliases: [], description: 'Manage remote repositories' },
      { name: 'fetch', aliases: [], description: 'Fetch from remote' },
      { name: 'pull', aliases: ['pl'], description: 'Fetch and merge from remote' },
      { name: 'push', aliases: ['ps'], description: 'Push to remote' },
      { name: 'sync', aliases: [], description: 'Synchronize (pull + rebase + push)' },
    ],
  },
  fileOps: {
    name: 'File Operations',
    commands: [
      { name: 'rm', aliases: [], description: 'Remove files from git' },
      { name: 'mv', aliases: [], description: 'Move/rename files' },
      { name: 'clean', aliases: [], description: 'Remove untracked files' },
    ],
  },
  history: {
    name: 'History & Inspection',
    commands: [
      { name: 'log', aliases: [], description: 'View commit history' },
      { name: 'show', aliases: [], description: 'Show commit details' },
      { name: 'blame', aliases: [], description: 'Show who last modified each line' },
      { name: 'grep', aliases: [], description: 'Search in repository' },
      { name: 'shortlog', aliases: [], description: 'Summarize commit log by author' },
      { name: 'describe', aliases: [], description: 'Describe a commit using nearest tag' },
      { name: 'range-diff', aliases: [], description: 'Compare two commit ranges' },
    ],
  },
  undo: {
    name: 'Undo & Recovery',
    commands: [
      { name: 'undo', aliases: ['reset'], description: 'Undo operations and reflog browser' },
      { name: 'revert', aliases: [], description: 'Revert commits' },
      { name: 'stash', aliases: [], description: 'Stash management (save/restore changes)' },
      { name: 'restore', aliases: [], description: 'Restore files from index or commit' },
      { name: 'bisect', aliases: [], description: 'Binary search to find bug-introducing commit' },
    ],
  },
  tagging: {
    name: 'Tagging',
    commands: [
      { name: 'tag', aliases: [], description: 'Tag management (list, create, delete)' },
    ],
  },
  repo: {
    name: 'Repository Management',
    commands: [
      { name: 'uninit', aliases: ['deinit'], description: 'Remove git repository (clear history)' },
      { name: 'archive', aliases: [], description: 'Create archive from repository' },
      { name: 'worktree', aliases: ['wt'], description: 'Manage multiple working trees' },
      { name: 'submodule', aliases: ['sub'], description: 'Manage submodules' },
    ],
  },
};

const showHelp = () => {
  // Show banner
  showBanner('GITTABLE', { version: VERSION });

  // GitHub link at the top
  const repoLink = createLink('GitHub', 'https://github.com/GG-Santos/Gittable');
  console.log(`${chalk.gray('├')}  ${chalk.dim(repoLink)}`);
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Modern Git CLI with Interactive Prompts')}`);
  console.log(
    chalk.gray('├') +
      '  ' +
      chalk.yellow('Usage:') +
      ' ' +
      chalk.white('gittable <command> [options]')
  );
  console.log(chalk.gray('│'));

  // Display all categories
  const categoryOrder = [
    'gettingStarted',
    'coreWorkflow',
    'branching',
    'remote',
    'fileOps',
    'history',
    'undo',
    'tagging',
    'repo',
  ];

  for (const categoryKey of categoryOrder) {
    const category = COMMAND_CATEGORIES[categoryKey];
    console.log(chalk.bold.cyan(`  ${category.name}:`));
    console.log();
    for (const cmd of category.commands) {
      const cmdList = [cmd.name, ...cmd.aliases].join(', ');
      console.log(`    ${chalk.cyan(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
    }
    console.log();
  }
};

const showInteractiveMenu = async () => {
  showBanner('GITTABLE', { version: VERSION });

  const category = await clack.select({
    message: chalk.cyan('Select a category:'),
    options: [
      { value: 'gettingStarted', label: chalk.cyan('Getting Started') },
      { value: 'coreWorkflow', label: chalk.cyan('Core Workflow') },
      { value: 'branching', label: chalk.cyan('Branching & Merging') },
      { value: 'remote', label: chalk.cyan('Remote Operations') },
      { value: 'fileOps', label: chalk.cyan('File Operations') },
      { value: 'history', label: chalk.cyan('History & Inspection') },
      { value: 'undo', label: chalk.cyan('Undo & Recovery') },
      { value: 'tagging', label: chalk.cyan('Tagging') },
      { value: 'repo', label: chalk.cyan('Repository Management') },
      { value: 'help', label: chalk.yellow('List Commands') },
      { value: 'exit', label: chalk.red('Exit') },
    ],
  });

  if (clack.isCancel(category) || category === 'exit') {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (category === 'help') {
    showHelp();
    return;
  }

  // Show commands in selected category
  const categoryData = COMMAND_CATEGORIES[category];
  const commandOptions = categoryData.commands.map((cmd) => ({
    value: cmd.name,
    label: `${chalk.cyan(cmd.name)} ${chalk.gray(`- ${cmd.description}`)}`,
  }));

  // Add back option
  commandOptions.push({
    value: '__back__',
    label: chalk.dim('← Back to categories'),
  });

  const selectedCommand = await clack.select({
    message: chalk.cyan(`Select a command from ${categoryData.name}:`),
    options: commandOptions,
  });

  if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
    // Recursively show menu again
    return showInteractiveMenu();
  }

  // Execute the selected command
  if (COMMANDS[selectedCommand]) {
    // Check if we're in a git repo (except for init, uninit, and clone)
    if (
      !isGitRepo() &&
      selectedCommand !== 'init' &&
      selectedCommand !== 'uninit' &&
      selectedCommand !== 'clone'
    ) {
      clack.cancel(chalk.red('Not a git repository'));
      console.log();
      console.log(`${chalk.gray('├')}  ${chalk.yellow('Tip:')}`);
      console.log(`${chalk.gray('│')}  ${chalk.gray('Initialize a new repository with:')}`);
      console.log(`${chalk.gray('│')}  ${chalk.cyan('  gittable init')}`);
      console.log(chalk.gray('│'));
      console.log(`${chalk.gray('└')}  ${chalk.gray('Or clone an existing repository with:')}`);
      console.log(chalk.gray('    ') + chalk.cyan('  gittable clone <url>'));
      console.log();
      return;
    }

    try {
      await COMMANDS[selectedCommand]([]);
    } catch (error) {
      clack.cancel(chalk.red('Command failed'));
      console.error(error);
      process.exit(1);
    }
  } else {
    clack.cancel(chalk.red(`Command '${selectedCommand}' not found`));
    process.exit(1);
  }
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  if (args[0] === '--version' || args[0] === '-v') {
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    clack.outro(chalk.green(`Version ${VERSION}`));
    process.exit(0);
  }

  // If no arguments provided and TTY is available, show interactive menu
  if (args.length === 0 && process.stdin.isTTY) {
    try {
      await showInteractiveMenu();
      process.exit(0);
    } catch (error) {
      clack.cancel(chalk.red('Menu failed'));
      console.error(error);
      process.exit(1);
    }
  }

  // If no arguments and not TTY, show help
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0].toLowerCase();
  const commandArgs = args.slice(1);

  if (!COMMANDS[command]) {
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    clack.cancel(chalk.red(`Unknown command: ${chalk.bold(command)}`));
    console.log();
    console.log(`${chalk.gray('├')}  ${chalk.yellow('Available commands:')}`);
    console.log(chalk.gray('│'));

    // Show some common commands as suggestions
    const suggestions = Object.keys(COMMANDS).slice(0, 10);
    for (const cmd of suggestions) {
      console.log(`${chalk.gray('│')}  ${chalk.cyan(`  ${cmd}`)}`);
    }

    console.log(chalk.gray('│'));
    console.log(
      `${chalk.gray('└')}  ${chalk.gray('Run "gittable --help" for full usage information')}`
    );
    console.log();
    process.exit(1);
  }

  // Check if we're in a git repo (except for help/version, init, uninit, and clone)
  if (!isGitRepo() && command !== 'init' && command !== 'uninit' && command !== 'clone') {
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    clack.cancel(chalk.red('Not a git repository'));
    console.log();
    console.log(`${chalk.gray('├')}  ${chalk.yellow('Tip:')}`);
    console.log(`${chalk.gray('│')}  ${chalk.gray('Initialize a new repository with:')}`);
    console.log(`${chalk.gray('│')}  ${chalk.cyan('  gittable init')}`);
    console.log(chalk.gray('│'));
    console.log(`${chalk.gray('└')}  ${chalk.gray('Or clone an existing repository with:')}`);
    console.log(chalk.gray('    ') + chalk.cyan('  gittable clone <url>'));
    console.log();
    process.exit(1);
  }

  try {
    await COMMANDS[command](commandArgs);
  } catch (error) {
    clack.cancel(chalk.red('Command failed'));
    console.error(error);
    process.exit(1);
  }
};

// Export prompter for programmatic use
const { prompter } = require('./lib/commit/commit-utils');

// Run CLI if executed directly
if (require.main === module) {
  main();
}

// Export for programmatic use
module.exports = { prompter };

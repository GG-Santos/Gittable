const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showBanner } = require('../../ui/components/banner');
const VERSION = require('../../../package.json').version;

/**
 * Command help system
 */
const COMMAND_HELP = {
  add: {
    description: 'Stage files for commit',
    usage: 'gittable add [files...]',
    aliases: [],
    examples: [
      'gittable add',
      'gittable add file1.js file2.js',
      'gittable add --all',
      'gittable add --unstage file1.js',
    ],
  },
  commit: {
    description: 'Create commits with conventional format (includes staging, preview, and push/sync options)',
    usage: 'gittable commit [options]',
    aliases: ['ci', 'save'],
    examples: ['gittable commit', 'gittable commit -a', 'gittable commit --amend'],
  },
  push: {
    description: 'Push to remote repository',
    usage: 'gittable push [remote] [branch]',
    aliases: ['ps', 'up'],
    examples: ['gittable push', 'gittable push origin main', 'gittable push --force'],
  },
  pull: {
    description: 'Fetch and merge from remote (use --rebase for rebase instead of merge)',
    usage: 'gittable pull [remote] [branch] [--rebase]',
    aliases: ['pl', 'down'],
    examples: ['gittable pull', 'gittable pull origin main', 'gittable pull --rebase'],
  },
  status: {
    description: 'Show repository status',
    usage: 'gittable status',
    aliases: ['st', 's'],
    examples: ['gittable status', 'gittable st'],
  },
  'commit-push': {
    description: 'Commit and push using enhanced commit command',
    usage: 'gittable commit-push [options]',
    aliases: ['cp'],
    examples: ['gittable commit-push', 'gittable cp --no-push'],
  },
  branch: {
    description: 'Branch management',
    usage: 'gittable branch [action] [name]',
    aliases: ['br'],
    examples: [
      'gittable branch',
      'gittable branch create feature/new',
      'gittable branch delete old-branch',
    ],
  },
  stash: {
    description: 'Stash management',
    usage: 'gittable stash [action]',
    aliases: [],
    examples: [
      'gittable stash',
      'gittable stash create "WIP: feature"',
      'gittable stash apply 0',
      'gittable stash pop',
    ],
  },
};

function showCommandHelp(commandName) {
  const help = COMMAND_HELP[commandName];

  if (!help) {
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    ui.error(`No help available for command: ${chalk.bold(commandName)}`);
    console.log();
    console.log(chalk.yellow('Available commands with help:'));
    console.log(chalk.gray(Object.keys(COMMAND_HELP).join(', ')));
    console.log();
    return;
  }

  showBanner('GITTABLE', { version: VERSION });
  console.log();
  console.log(chalk.bold.cyan(`Command: ${chalk.white(commandName)}`));
  if (help.aliases.length > 0) {
    console.log(chalk.dim(`Aliases: ${help.aliases.join(', ')}`));
  }
  console.log();
  console.log(chalk.bold('Description:'));
  console.log(`  ${help.description}`);
  console.log();
  console.log(chalk.bold('Usage:'));
  console.log(`  ${chalk.cyan(help.usage)}`);
  console.log();
  if (help.examples && help.examples.length > 0) {
    console.log(chalk.bold('Examples:'));
    help.examples.forEach((example) => {
      console.log(`  ${chalk.gray('$')} ${chalk.cyan(example)}`);
    });
    console.log();
  }
  ui.success('Help complete');
}

module.exports = async (args) => {
  const commandName = args[0];

  if (!commandName) {
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    console.log(chalk.yellow('Usage: gittable help <command>'));
    console.log();
    console.log(chalk.bold('Available commands with help:'));
    console.log(chalk.gray(Object.keys(COMMAND_HELP).join(', ')));
    console.log();
    console.log(chalk.dim('Run "gittable --help" for full command list'));
    console.log();
    return;
  }

  showCommandHelp(commandName.toLowerCase());
};

const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showBanner } = require('../../ui/banner');
const VERSION = require('../../../package.json').version;

/**
 * Examples command - Show usage examples
 */
const EXAMPLES = {
  'Quick Workflow': [
    { cmd: 'gittable quick', desc: 'Stage, commit, and push in one command' },
    { cmd: 'gittable q', desc: 'Short alias for quick' },
    { cmd: 'gittable q --all', desc: 'Quick with all files' },
  ],
  'Combined Commands': [
    { cmd: 'gittable add-commit', desc: 'Stage files and commit' },
    { cmd: 'gittable commit-push', desc: 'Commit and push' },
    { cmd: 'gittable commit-sync', desc: 'Commit and sync (fetch + rebase + push)' },
    { cmd: 'gittable ac file1.js', desc: 'Stage specific file and commit' },
    { cmd: 'gittable cp', desc: 'Short alias for commit-push' },
  ],
  'File Operations': [
    { cmd: 'gittable add', desc: 'Interactively stage files' },
    { cmd: 'gittable add --all', desc: 'Stage all changes' },
    { cmd: 'gittable add-pattern "*.js"', desc: 'Stage files matching pattern' },
    { cmd: 'gittable add-pattern "src/**/*.ts"', desc: 'Stage TypeScript files in src' },
    { cmd: 'gittable diff-preview', desc: 'Preview changes before committing' },
  ],
  'Status and Info': [
    { cmd: 'gittable status', desc: 'Full repository status' },
    { cmd: 'gittable s', desc: 'Short one-line status' },
    { cmd: 'gittable info', desc: 'Quick repository overview' },
  ],
  'Branch Management': [
    { cmd: 'gittable branch', desc: 'List branches' },
    { cmd: 'gittable branch create feature/new', desc: 'Create and checkout new branch' },
    { cmd: 'gittable branch-clean', desc: 'Delete merged branches' },
    { cmd: 'gittable branch-rename old new', desc: 'Rename branch' },
    { cmd: 'gittable branch-compare branch1 branch2', desc: 'Compare two branches' },
  ],
  'Stash Operations': [
    { cmd: 'gittable stash', desc: 'List stashes' },
    { cmd: 'gittable stash create "WIP: feature"', desc: 'Create stash with message' },
    { cmd: 'gittable stash apply 0', desc: 'Apply stash by index' },
    { cmd: 'gittable stash pop', desc: 'Apply and drop most recent stash' },
    { cmd: 'gittable stash-all', desc: 'Stash all including untracked' },
  ],
  'Remote Operations': [
    { cmd: 'gittable push', desc: 'Push to remote' },
    { cmd: 'gittable pull', desc: 'Pull from remote' },
    { cmd: 'gittable sync', desc: 'Sync (fetch + rebase + push)' },
    { cmd: 'gittable pull-rebase', desc: 'Pull and rebase without pushing' },
    { cmd: 'gittable remote-set-url origin <url>', desc: 'Update remote URL' },
  ],
  'Conflict Resolution': [
    { cmd: 'gittable conflicts', desc: 'List all conflicted files' },
    { cmd: 'gittable resolve file.js', desc: 'Open file in editor to resolve conflicts' },
    { cmd: 'gittable mergetool', desc: 'Launch merge tool' },
  ],
  'Tag Management': [
    { cmd: 'gittable tag', desc: 'List tags' },
    { cmd: 'gittable tag create v1.0.0', desc: 'Create tag' },
    { cmd: 'gittable tag-push v1.0.0', desc: 'Create and push tag' },
    { cmd: 'gittable tag-delete v1.0.0', desc: 'Delete tag locally and remotely' },
  ],
  'Help and Examples': [
    { cmd: 'gittable help commit', desc: 'Get help for commit command' },
    { cmd: 'gittable examples', desc: 'Show usage examples' },
    { cmd: 'gittable --help', desc: 'Show all commands' },
  ],
};

module.exports = async (_args) => {
  showBanner('GITTABLE', { version: VERSION });
  console.log();
  console.log(chalk.bold.cyan('Usage Examples'));
  console.log();

  for (const [category, examples] of Object.entries(EXAMPLES)) {
    console.log(chalk.bold.yellow(`${category}:`));
    console.log();

    for (const example of examples) {
      console.log(`  ${chalk.cyan(example.cmd.padEnd(40))} ${chalk.gray(example.desc)}`);
    }

    console.log();
  }

  console.log(chalk.dim('For more information, run: gittable help <command>'));
  console.log();
  clack.outro(chalk.green.bold('Examples complete'));
};

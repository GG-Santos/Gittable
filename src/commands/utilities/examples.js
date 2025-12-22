const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showBanner } = require('../../ui/components');
const VERSION = require('../../../package.json').version;

/**
 * Comprehensive examples command - Show usage examples organized by use case
 */
const EXAMPLES = {
  'Getting Started': [
    { cmd: 'gittable', desc: 'Launch interactive menu (workflow-oriented)' },
    { cmd: 'gittable status', desc: 'Check repository status' },
    { cmd: 'gittable s', desc: 'Quick one-line status' },
    { cmd: 'gittable info', desc: 'Get repository overview' },
    { cmd: 'gittable help', desc: 'Show help menu' },
    { cmd: 'gittable examples', desc: 'Show usage examples' },
    { cmd: 'gittable tutorial', desc: 'Interactive tutorial with levels' },
  ],

  'Daily Development Workflow': [
    { cmd: 'gittable status', desc: 'Check what files have changed' },
    { cmd: 'gittable add', desc: 'Interactively stage files (with pattern matching)' },
    { cmd: 'gittable add --all', desc: 'Stage all changes at once' },
    { cmd: 'gittable commit', desc: 'Create commit (includes diff preview, push/sync options)' },
    { cmd: 'gittable commit -a', desc: 'Stage all modified files and commit' },
    { cmd: 'gittable diff', desc: 'View changes in working directory' },
    { cmd: 'gittable diff --staged', desc: 'View staged changes' },
    { cmd: 'gittable log', desc: 'View commit history' },
    { cmd: 'gittable show', desc: 'Show details of last commit' },
  ],

  'Branch Management': [
    { cmd: 'gittable branch', desc: 'List all branches' },
    { cmd: 'gittable branch create feature/new', desc: 'Create and checkout new branch' },
    { cmd: 'gittable checkout main', desc: 'Switch to main branch' },
    { cmd: 'gittable switch feature/new', desc: 'Switch to branch (modern syntax)' },
    { cmd: 'gittable branch-rename old-name new-name', desc: 'Rename a branch' },
    { cmd: 'gittable branch-compare main feature', desc: 'Compare two branches' },
    { cmd: 'gittable branch-clean', desc: 'Delete merged branches interactively' },
    { cmd: 'gittable merge feature', desc: 'Merge feature branch into current' },
    { cmd: 'gittable rebase main', desc: 'Rebase current branch onto main' },
  ],

  'Remote Operations & Collaboration': [
    { cmd: 'gittable push', desc: 'Push commits to remote' },
    { cmd: 'gittable push --force', desc: 'Force push (use with caution)' },
    { cmd: 'gittable pull', desc: 'Pull and merge from remote' },
    { cmd: 'gittable pull --rebase', desc: 'Pull and rebase instead of merge' },
    { cmd: 'gittable sync', desc: 'Sync: fetch + rebase + push' },
    { cmd: 'gittable fetch', desc: 'Fetch from remote without merging' },
    { cmd: 'gittable remote', desc: 'List remote repositories' },
    { cmd: 'gittable remote-set-url origin <url>', desc: 'Update remote URL' },
    { cmd: 'gittable create-pr', desc: 'Create pull request (if supported)' },
  ],

  'Stash Operations': [
    { cmd: 'gittable stash', desc: 'List all stashes' },
    { cmd: 'gittable stash create "WIP: feature"', desc: 'Create stash with message' },
    { cmd: 'gittable stash apply 0', desc: 'Apply stash by index (keeps stash)' },
    { cmd: 'gittable stash pop', desc: 'Apply and remove most recent stash' },
    { cmd: 'gittable stash-all', desc: 'Stash all changes including untracked files' },
  ],

  'Undo & Recovery Operations': [
    { cmd: 'gittable undo', desc: 'Undo last commit (keeps changes)' },
    { cmd: 'gittable revert HEAD', desc: 'Revert a commit (creates new commit)' },
    { cmd: 'gittable restore file.js', desc: 'Restore file from index' },
    { cmd: 'gittable restore --staged file.js', desc: 'Unstage a file' },
    { cmd: 'gittable restore-backup', desc: 'Restore from backup branch' },
    { cmd: 'gittable bisect start', desc: 'Start binary search for bug' },
  ],

  'File Operations': [
    { cmd: 'gittable remove file.js', desc: 'Remove file from git (rm alias available)' },
    { cmd: 'gittable remove --cached file.js', desc: 'Remove from index but keep file' },
    { cmd: 'gittable move old.js new.js', desc: 'Move/rename file (mv alias available)' },
    { cmd: 'gittable clean', desc: 'Remove untracked files interactively' },
    { cmd: 'gittable clean -f', desc: 'Force remove untracked files' },
  ],

  'History & Inspection': [
    { cmd: 'gittable log', desc: 'View commit history' },
    { cmd: 'gittable log --oneline', desc: 'Compact one-line log' },
    { cmd: 'gittable show HEAD', desc: 'Show commit details and changes' },
    { cmd: 'gittable blame file.js', desc: 'See who changed each line' },
    { cmd: 'gittable grep "pattern"', desc: 'Search for pattern in repository' },
    { cmd: 'gittable shortlog', desc: 'Summarize commits by author' },
    { cmd: 'gittable describe', desc: 'Describe commit using nearest tag' },
    { cmd: 'gittable diff main..feature', desc: 'Compare two commit ranges' },
    { cmd: 'gittable diff --range-diff range1 range2', desc: 'Compare commit ranges' },
  ],

  'Conflict Resolution': [
    { cmd: 'gittable conflicts', desc: 'List all conflicted files' },
    { cmd: 'gittable resolve file.js', desc: 'Open file in editor to resolve conflicts' },
    { cmd: 'gittable mergetool', desc: 'Launch merge tool' },
    { cmd: 'gittable merge --continue', desc: 'Continue merge after resolving conflicts' },
    { cmd: 'gittable merge --abort', desc: 'Abort merge and return to previous state' },
  ],

  'Repository Management': [
    { cmd: 'gittable init', desc: 'Initialize new repository' },
    { cmd: 'gittable clone <url>', desc: 'Clone a repository' },
    { cmd: 'gittable archive', desc: 'Create archive of repository' },
    { cmd: 'gittable worktree', desc: 'Manage multiple working trees' },
    { cmd: 'gittable submodule', desc: 'Manage submodules' },
    { cmd: 'gittable state', desc: 'Show current repository state' },
    { cmd: 'gittable hooks', desc: 'List all git hooks' },
  ],

  'Tag Management': [
    { cmd: 'gittable tag', desc: 'List all tags' },
    { cmd: 'gittable tag create v1.0.0', desc: 'Create a tag' },
    { cmd: 'gittable tag-push v1.0.0', desc: 'Create and push tag in one step' },
    { cmd: 'gittable tag-delete v1.0.0', desc: 'Delete tag locally and remotely' },
  ],

  'Configuration & Customization': [
    { cmd: 'gittable config', desc: 'Manage Git configuration' },
    { cmd: 'gittable config user.name "Your Name"', desc: 'Set user name' },
    { cmd: 'gittable config user.email "email@example.com"', desc: 'Set user email' },
    { cmd: 'gittable theme', desc: 'Customize color theme' },
  ],

  'Advanced Operations': [
    { cmd: 'gittable cherry-pick <commit>', desc: 'Apply commit from another branch' },
    { cmd: 'gittable rebase -i HEAD~3', desc: 'Interactive rebase (edit commits)' },
    { cmd: 'gittable diff --stat', desc: 'Show diff statistics' },
    { cmd: 'gittable log --graph --oneline', desc: 'Visual branch history' },
  ],

  'Help & Learning': [
    { cmd: 'gittable help', desc: 'Show help menu' },
    { cmd: 'gittable help <command>', desc: 'Get help for specific command' },
    { cmd: 'gittable examples', desc: 'Show comprehensive usage examples' },
    { cmd: 'gittable tutorial', desc: 'Interactive gamified tutorial' },
    { cmd: 'gittable history', desc: 'View command history' },
  ],
};

module.exports = async (_args) => {
  showBanner('GITTABLE', { version: VERSION });
  console.log();
  console.log(chalk.bold.cyan('Usage Examples'));
  console.log(chalk.dim('Comprehensive examples organized by use case'));
  console.log();

  for (const [category, examples] of Object.entries(EXAMPLES)) {
    console.log(chalk.bold.yellow(`${category}:`));
    console.log();

    for (const example of examples) {
      console.log(`  ${chalk.cyan(example.cmd.padEnd(45))} ${chalk.gray(example.desc)}`);
    }

    console.log();
  }

  console.log(chalk.dim('💡 Tip: Use "gittable help <command>" for detailed help on any command'));
  console.log(chalk.dim('📚 Learn: Run "gittable tutorial" for interactive learning'));
  console.log();
  ui.success('Examples complete');
};

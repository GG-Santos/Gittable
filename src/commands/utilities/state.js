const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader } = require('../../utils/command-helpers');
const { getRepositoryState, getStateDescription } = require('../../core/git/state');
const { execGit } = require('../../core/git');

/**
 * State command - Show current repository state
 */
module.exports = async (_args) => {
  showCommandHeader('STATE', 'Repository State');

  const state = getRepositoryState();

  console.log();

  if (state.clean) {
    console.log(chalk.green.bold('✓ Repository is in clean state'));
    console.log(chalk.dim('No active merge, rebase, or cherry-pick operations'));
  } else {
    console.log(chalk.yellow.bold('⚠ Repository has active operations:'));
    console.log();

    if (state.merge) {
      console.log(chalk.yellow('  • Merge in progress'));
      const mergeHead = execGit('rev-parse --verify MERGE_HEAD', { silent: true });
      if (mergeHead.success) {
        const mergeCommit = execGit('log -1 --format="%s" MERGE_HEAD', { silent: true });
        if (mergeCommit.success) {
          console.log(chalk.dim(`    Merging: ${mergeCommit.output.trim()}`));
        }
      }
      console.log();
      console.log(chalk.dim('  Continue: gittable merge-continue'));
      console.log(chalk.dim('  Abort: gittable merge-abort'));
    }

    if (state.rebase) {
      console.log(chalk.yellow('  • Rebase in progress'));
      console.log();
      console.log(chalk.dim('  Continue: gittable rebase --continue'));
      console.log(chalk.dim('  Abort: gittable rebase --abort'));
    }

    if (state.cherryPick) {
      console.log(chalk.yellow('  • Cherry-pick in progress'));
      console.log();
      console.log(chalk.dim('  Continue: git cherry-pick --continue'));
      console.log(chalk.dim('  Abort: git cherry-pick --abort'));
    }
  }

  // Check for conflicts
  const conflicts = execGit('diff --name-only --diff-filter=U', { silent: true });
  if (conflicts.success && conflicts.output.trim()) {
    const conflictedFiles = conflicts.output.trim().split('\n').filter(Boolean);
    console.log();
    console.log(chalk.red.bold(`⚠ ${conflictedFiles.length} file(s) have conflicts:`));
    conflictedFiles.forEach((file) => {
      console.log(chalk.red(`  - ${file}`));
    });
    console.log();
    console.log(chalk.dim('  List conflicts: gittable conflicts'));
    console.log(chalk.dim('  Resolve file: gittable resolve <file>'));
  }

  console.log();
  clack.outro(chalk.green.bold('State check complete'));
};

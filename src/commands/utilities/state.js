const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader } = require('../../utils/commands');
const { getRepositoryState, getStateDescription } = require('../../core/git/state');
const { execGit } = require('../../core/git');
const { getTheme } = require('../../utils/ui');

/**
 * State command - Show current repository state
 */
module.exports = async (_args) => {
  showCommandHeader('STATE', 'Repository State');

  const state = getRepositoryState();
  const theme = getTheme();

  console.log();

  if (state.clean) {
    ui.success('Repository is in clean state');
    console.log(theme.dim('No active merge, rebase, or cherry-pick operations'));
  } else {
    ui.warn('Repository has active operations:');
    console.log();

    if (state.merge) {
      console.log(theme.warning('  • Merge in progress'));
      const mergeHead = execGit('rev-parse --verify MERGE_HEAD', { silent: true });
      if (mergeHead.success) {
        const mergeCommit = execGit('log -1 --format="%s" MERGE_HEAD', { silent: true });
        if (mergeCommit.success) {
          console.log(theme.dim(`    Merging: ${mergeCommit.output.trim()}`));
        }
      }
      console.log();
      console.log(theme.dim('  Continue: gittable merge-continue'));
      console.log(theme.dim('  Abort: gittable merge-abort'));
    }

    if (state.rebase) {
      console.log(theme.warning('  • Rebase in progress'));
      console.log();
      console.log(theme.dim('  Continue: gittable rebase --continue'));
      console.log(theme.dim('  Abort: gittable rebase --abort'));
    }

    if (state.cherryPick) {
      console.log(theme.warning('  • Cherry-pick in progress'));
      console.log();
      console.log(theme.dim('  Continue: git cherry-pick --continue'));
      console.log(theme.dim('  Abort: git cherry-pick --abort'));
    }
  }

  // Check for conflicts
  const conflicts = execGit('diff --name-only --diff-filter=U', { silent: true });
  if (conflicts.success && conflicts.output.trim()) {
    const conflictedFiles = conflicts.output.trim().split('\n').filter(Boolean);
    console.log();
    ui.error(`${conflictedFiles.length} file(s) have conflicts:`);
    conflictedFiles.forEach((file) => {
      console.log(theme.error(`  - ${file}`));
    });
    console.log();
    console.log(theme.dim('  List conflicts: gittable conflicts'));
    console.log(theme.dim('  Resolve file: gittable resolve <file>'));
  }

  ui.success('State check complete');
};

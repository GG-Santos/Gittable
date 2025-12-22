const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getBranches, getCurrentBranch, execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
} = require('../../utils/command-helpers');

/**
 * Branch-clean command - Delete merged branches interactively
 */
module.exports = async (args) => {
  showCommandHeader('BRANCH-CLEAN', 'Clean Merged Branches');

  requireTTY('This command requires interactive input');

  const current = getCurrentBranch();
  const branches = getBranches();

  // Get merged branches (excluding current and main/master)
  const protectedBranches = ['main', 'master', 'develop', 'dev', current].filter(Boolean);
  const mergedResult = execGit('branch --merged', { silent: true });

  if (!mergedResult.success) {
    ui.error('Failed to get merged branches', { exit: true });
  }

  const mergedBranches = mergedResult.output
    .trim()
    .split('\n')
    .map((b) => b.replace(/^\*\s*/, '').trim())
    .filter((b) => b && !protectedBranches.includes(b));

  if (mergedBranches.length === 0) {
    ui.success('No merged branches to clean');
    return;
  }

  // Show merged branches
  console.log(chalk.cyan(`\nFound ${mergedBranches.length} merged branch(es):`));
  mergedBranches.forEach((branch) => {
    console.log(chalk.gray(`  - ${branch}`));
  });

  const confirmed = await promptConfirm(
    `Delete ${mergedBranches.length} merged branch(es)?`,
    false
  );

  if (!confirmed) {
    return;
  }

  // Delete branches
  let deleted = 0;
  let failed = 0;
  const theme = require('../../utils/color-theme').getTheme();

  for (const branch of mergedBranches) {
    const result = execGit(`branch -d ${branch}`, { silent: true });
    if (result.success) {
      deleted++;
      console.log(theme.success(`  ✓ Deleted ${branch}`));
    } else {
      failed++;
      console.log(theme.warning(`  ⚠ Could not delete ${branch}: ${result.error.trim()}`));
    }
  }

  console.log();
  if (deleted > 0) {
    ui.success(`Deleted ${deleted} branch(es)`);
  }
  if (failed > 0) {
    ui.warn(`Could not delete ${failed} branch(es) (may need -D to force)`);
  }
};

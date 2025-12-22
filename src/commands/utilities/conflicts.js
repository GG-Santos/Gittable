const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader, handleCancel } = require('../../utils/commands');
const { createTable } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

/**
 * Conflicts command - List all conflicted files
 */
module.exports = async (_args) => {
  showCommandHeader('CONFLICTS', 'List Conflicted Files');

  // Get conflicted files
  const result = execGit('diff --name-only --diff-filter=U', { silent: true });
  const theme = getTheme();

  if (!result.success || !result.output.trim()) {
    ui.success('No conflicts found');
    return;
  }

  const conflictedFiles = result.output.trim().split('\n').filter(Boolean);

  ui.warn(`Found ${conflictedFiles.length} conflicted file(s):`);

  const rows = conflictedFiles.map((file, index) => [
    theme.primary(`#${index + 1}`),
    theme.warning(file),
  ]);

  console.log(createTable(['#', 'File'], rows));

  console.log();
  ui.info('To resolve conflicts:');
  console.log(theme.dim('  1. Edit the conflicted files manually'));
  console.log(theme.dim('  2. Stage resolved files: gittable add <file>'));
  console.log(theme.dim('  3. Continue: gittable rebase --continue or gittable merge --continue'));
  console.log();
  ui.info('Or use mergetool:');
  console.log(theme.primary('  gittable mergetool'));
  console.log();

  ui.success('Conflicts listed');
};

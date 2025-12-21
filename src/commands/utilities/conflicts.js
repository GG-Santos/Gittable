const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { showCommandHeader, handleCancel } = require('../../utils/command-helpers');
const { createTable } = require('../../ui/table');

/**
 * Conflicts command - List all conflicted files
 */
module.exports = async (_args) => {
  showCommandHeader('CONFLICTS', 'List Conflicted Files');

  // Get conflicted files
  const result = execGit('diff --name-only --diff-filter=U', { silent: true });

  if (!result.success || !result.output.trim()) {
    clack.outro(chalk.green('No conflicts found'));
    return;
  }

  const conflictedFiles = result.output.trim().split('\n').filter(Boolean);

  console.log(chalk.yellow(`\nFound ${conflictedFiles.length} conflicted file(s):\n`));

  const rows = conflictedFiles.map((file, index) => [
    chalk.cyan(`#${index + 1}`),
    chalk.yellow(file),
  ]);

  console.log(createTable(['#', 'File'], rows));

  console.log();
  console.log(chalk.dim('To resolve conflicts:'));
  console.log(chalk.dim('  1. Edit the conflicted files manually'));
  console.log(chalk.dim('  2. Stage resolved files: gittable add <file>'));
  console.log(chalk.dim('  3. Continue: gittable rebase --continue or gittable merge --continue'));
  console.log();
  console.log(chalk.dim('Or use mergetool:'));
  console.log(chalk.cyan('  gittable mergetool'));
  console.log();

  clack.outro(chalk.green.bold('Conflicts listed'));
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader } = require('../../utils/commands');
const { listHooks, getHooksDir } = require('../../utils/git');
const { createTable } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

/**
 * Hooks command - List git hooks
 */
module.exports = async (_args) => {
  showCommandHeader('HOOKS', 'Git Hooks');

  const hooksDir = getHooksDir();
  const theme = getTheme();
  if (!hooksDir) {
    ui.error('Not a git repository', { exit: true });
  }

  const hooks = listHooks();

  if (hooks.length === 0) {
    console.log(theme.dim('\nNo git hooks found'));
    console.log(theme.dim(`Hooks directory: ${hooksDir}`));
    console.log();
    ui.warn('No hooks installed');
    return;
  }

  console.log(theme.primary(`\nFound ${hooks.length} hook(s):\n`));
  console.log(theme.dim(`Hooks directory: ${hooksDir}\n`));

  const rows = hooks.map((hook) => [
    chalk.cyan(hook.name),
    hook.executable ? chalk.green('✓') : chalk.yellow('⚠'),
    hook.executable ? chalk.green('executable') : chalk.yellow('not executable'),
  ]);

  console.log(createTable(['Hook', 'Status', 'Permission'], rows));

  console.log();
  console.log(theme.dim('Common hooks:'));
  console.log(theme.dim('  - pre-commit: Runs before commit'));
  console.log(theme.dim('  - pre-push: Runs before push'));
  console.log(theme.dim('  - commit-msg: Validates commit message'));
  console.log();

  ui.success('Hooks listed');
};

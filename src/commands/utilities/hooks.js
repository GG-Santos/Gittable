const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader } = require('../../utils/command-helpers');
const { listHooks, getHooksDir } = require('../../utils/git-hooks');
const { createTable } = require('../../ui/table');

/**
 * Hooks command - List git hooks
 */
module.exports = async (_args) => {
  showCommandHeader('HOOKS', 'Git Hooks');

  const hooksDir = getHooksDir();
  if (!hooksDir) {
    clack.cancel(chalk.red('Not a git repository'));
    process.exit(1);
  }

  const hooks = listHooks();

  if (hooks.length === 0) {
    console.log(chalk.dim('\nNo git hooks found'));
    console.log(chalk.dim(`Hooks directory: ${hooksDir}`));
    console.log();
    clack.outro(chalk.yellow('No hooks installed'));
    return;
  }

  console.log(chalk.cyan(`\nFound ${hooks.length} hook(s):\n`));
  console.log(chalk.dim(`Hooks directory: ${hooksDir}\n`));

  const rows = hooks.map((hook) => [
    chalk.cyan(hook.name),
    hook.executable ? chalk.green('✓') : chalk.yellow('⚠'),
    hook.executable ? chalk.green('executable') : chalk.yellow('not executable'),
  ]);

  console.log(createTable(['Hook', 'Status', 'Permission'], rows));

  console.log();
  console.log(chalk.dim('Common hooks:'));
  console.log(chalk.dim('  - pre-commit: Runs before commit'));
  console.log(chalk.dim('  - pre-push: Runs before push'));
  console.log(chalk.dim('  - commit-msg: Validates commit message'));
  console.log();

  clack.outro(chalk.green.bold('Hooks listed'));
};

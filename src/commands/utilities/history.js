const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader, handleCancel } = require('../../utils/command-helpers');
const { loadHistory, clearHistory } = require('../../utils/command-history');
const { createTable } = require('../../ui/table');

/**
 * History command - Show recent commands executed
 */
module.exports = async (args) => {
  showCommandHeader('HISTORY', 'Command History');

  const clear = args.includes('--clear') || args.includes('-c');

  if (clear) {
    const { promptConfirm } = require('../../utils/command-helpers');
    const confirmed = await promptConfirm('Clear command history?', false);
    if (confirmed) {
      clearHistory();
      clack.outro(chalk.green('History cleared'));
    } else {
      clack.cancel(chalk.yellow('Cancelled'));
    }
    return;
  }

  const limit = Number.parseInt(args[0]) || 20;
  const history = loadHistory(limit);

  if (history.length === 0) {
    clack.outro(chalk.yellow('No command history found'));
    return;
  }

  console.log(chalk.cyan(`\nRecent commands (showing ${history.length}):\n`));

  const rows = history.map((entry, index) => {
    const date = new Date(entry.timestamp);
    const timeAgo = getTimeAgo(date);
    return [
      chalk.cyan(`#${index + 1}`),
      chalk.yellow(entry.command),
      chalk.gray(entry.args.join(' ') || '(no args)'),
      chalk.dim(timeAgo),
    ];
  });

  console.log(createTable(['#', 'Command', 'Args', 'Time'], rows));

  console.log();
  console.log(chalk.dim('Replay a command by typing it again'));
  console.log(chalk.dim('Clear history: gittable history --clear'));
  console.log();

  clack.outro(chalk.green.bold('History complete'));
};

/**
 * Get human-readable time ago
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${diffDays}d ago`;
}

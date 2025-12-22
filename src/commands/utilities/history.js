const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader, handleCancel, promptConfirm } = require('../../utils/commands');
const { loadHistory, clearHistory } = require('../../utils/commands/command-history');
const { createTable } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

/**
 * History command - Show recent commands executed
 */
module.exports = async (args) => {
  showCommandHeader('HISTORY', 'Command History');

  const clear = args.includes('--clear') || args.includes('-c');

  if (clear) {
    const confirmed = await promptConfirm('Clear command history?', false);
    if (confirmed) {
      clearHistory();
      ui.success('History cleared');
    }
    return;
  }

  const limit = Number.parseInt(args[0]) || 20;
  const history = loadHistory(limit);
  const theme = getTheme();

  if (history.length === 0) {
    ui.warn('No command history found');
    return;
  }

  console.log(theme.primary(`\nRecent commands (showing ${history.length}):\n`));

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
  console.log(theme.dim('Replay a command by typing it again'));
  console.log(theme.dim('Clear history: gittable history --clear'));
  console.log();

  ui.success('History complete');
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

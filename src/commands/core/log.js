const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getLog } = require('../../core/git');
const { createTable } = require('../../ui/components');
const { showCommandHeader } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  showCommandHeader('LOG', 'Commit History');

  const limit = Number.parseInt(args[0], 10) || 20;
  const format = args.includes('--oneline') ? '%h|%s' : '%h|%an|%ar|%s';
  const theme = getTheme();

  const commits = getLog(limit, format);

  if (commits.length === 0) {
    ui.info('No commits found', { dim: true });
    return;
  }

  if (args.includes('--oneline')) {
    for (const commit of commits) {
      console.log(`${theme.primary(commit.hash)} ${commit.message}`);
    }
  } else {
    const rows = commits.map((commit) => [
      theme.primary(commit.hash),
      commit.author,
      theme.dim(commit.date),
      commit.message,
    ]);

    console.log(`\n${createTable(['Hash', 'Author', 'Date', 'Message'], rows)}`);
  }

  ui.success('Done');
};

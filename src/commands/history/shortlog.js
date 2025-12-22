const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader } = require('../../utils/commands');

module.exports = async (args) => {
  showCommandHeader('SHORTLOG', 'Summarize Commit Log');

  const summary = args.includes('--summary') || args.includes('-s');
  const email = args.includes('--email');
  const numbered = args.includes('--numbered');
  const since = args.find((arg) => arg.startsWith('--since='))?.split('=')[1];
  const until = args.find((arg) => arg.startsWith('--until='))?.split('=')[1];
  const range = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-')) || null;

  let command = 'shortlog';
  if (summary) command += ' --summary';
  if (email) command += ' --email';
  if (numbered) command += ' --numbered';
  if (since) command += ` --since="${since}"`;
  if (until) command += ` --until="${until}"`;
  if (range) command += ` ${range}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    ui.error('Failed to generate shortlog', {
      suggestion: result.error,
      exit: true,
    });
  }

  ui.success('Done');
};

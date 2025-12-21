const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { showCommandHeader } = require('../../utils/command-helpers');

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
    clack.cancel(chalk.red('Failed to generate shortlog'));
    console.error(result.error);
    process.exit(1);
  }

  clack.outro(chalk.green.bold('Done'));
};

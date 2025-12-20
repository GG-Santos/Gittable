const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getStatus } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

const stageFiles = async (files) => {
  if (!files || files.length === 0) {
    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Available options:'));
      console.log(chalk.gray('  - gittable add <file1> <file2> ...'));
      console.log(chalk.gray('  - gittable add --all (or -A)'));
      process.exit(1);
    }

    // Interactive mode: show unstaged files
    const status = getStatus();
    if (!status) {
      clack.cancel(chalk.red('Failed to get repository status'));
      process.exit(1);
    }

    const allFiles = [
      ...status.unstaged.map((f) => ({
        value: f.file,
        label: chalk.yellow(`M ${f.file}`),
        hint: 'modified',
      })),
      ...status.untracked.map((f) => ({
        value: f,
        label: chalk.green(`? ${f}`),
        hint: 'untracked',
      })),
    ];

    if (allFiles.length === 0) {
      clack.cancel(chalk.yellow('No files to stage'));
      return;
    }

    const selected = await clack.multiselect({
      message: chalk.cyan('Select files to stage:'),
      options: allFiles,
    });

    if (clack.isCancel(selected)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    files = selected;
  }

  const spinner = clack.spinner();
  spinner.start(`Staging ${files.length} file(s)`);

  const result = execGit(`add ${files.join(' ')}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Staged ${files.length} file(s)`));
  } else {
    clack.cancel(chalk.red('Failed to stage files'));
    console.error(result.error);
    process.exit(1);
  }
};

const stageAll = async () => {
  const confirm = await clack.confirm({
    message: chalk.cyan('Stage all changes?'),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start('Staging all changes');

  const result = execGit('add -A', { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Staged all changes'));
  } else {
    clack.cancel(chalk.red('Failed to stage files'));
    console.error(result.error);
    process.exit(1);
  }
};

const unstageFiles = async (files) => {
  if (!files || files.length === 0) {
    const status = getStatus();
    if (!status || status.staged.length === 0) {
      clack.cancel(chalk.yellow('No staged files to unstage'));
      return;
    }

    const options = status.staged.map((f) => ({
      value: f.file,
      label: `${f.status} ${f.file}`,
    }));

    const selected = await clack.multiselect({
      message: chalk.cyan('Select files to unstage:'),
      options,
    });

    if (clack.isCancel(selected)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    files = selected;
  }

  const spinner = clack.spinner();
  spinner.start(`Unstaging ${files.length} file(s)`);

  const result = execGit(`reset HEAD -- ${files.join(' ')}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Unstaged ${files.length} file(s)`));
  } else {
    clack.cancel(chalk.red('Failed to unstage files'));
    console.error(result.error);
    process.exit(1);
  }
};

module.exports = async (args) => {
  const action = args[0];

  if (action === '--all' || action === '-A') {
    showBanner('ADD');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Stage All Changes')}`);
    await stageAll();
    return;
  }

  if (action === '--unstage' || action === 'unstage') {
    showBanner('ADD');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Unstage Files')}`);
    await unstageFiles(args.slice(1));
    return;
  }

  // Default: stage files
  showBanner('ADD');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Stage Files')}`);
  await stageFiles(args);
};

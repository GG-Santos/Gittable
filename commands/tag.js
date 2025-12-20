const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showBanner } = require('../lib/ui/banner');

const listTags = () => {
  const result = execGit('tag -l --format="%(refname:short)|%(creatordate:relative)|%(subject)"', {
    silent: true,
  });
  if (!result.success || !result.output.trim()) {
    console.log(chalk.dim('No tags found'));
    return;
  }

  const lines = result.output.trim().split('\n').filter(Boolean);
  const tags = lines.map((line) => {
    const [name, date, ...messageParts] = line.split('|');
    return {
      name,
      date,
      message: messageParts.join('|') || '(no message)',
    };
  });

  const rows = tags.map((tag) => [chalk.cyan(tag.name), chalk.gray(tag.date), tag.message]);

  console.log(`\n${createTable(['Tag', 'Date', 'Message'], rows)}`);
};

const createTag = async (name, message, commit, lightweight = false) => {
  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Tag name:'),
      placeholder: 'v1.0.0',
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const annotated = !lightweight;
  if (annotated && !message) {
    message = await clack.text({
      message: chalk.cyan('Tag message (optional):'),
      placeholder: 'Release version 1.0.0',
      required: false,
    });

    if (clack.isCancel(message)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Creating tag ${name}`);

  let command = 'tag';
  if (annotated && message) {
    command += ` -a ${name} -m "${message}"`;
  } else if (annotated) {
    command += ` -a ${name}`;
  } else {
    command += ` ${name}`;
  }
  if (commit) {
    command += ` ${commit}`;
  }

  const result = execGit(command, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Tag ${name} created`));
  } else {
    clack.cancel(chalk.red('Failed to create tag'));
    console.error(result.error);
    process.exit(1);
  }
};

const deleteTag = async (name) => {
  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Tag name to delete:'),
      placeholder: 'v1.0.0',
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const confirm = await clack.confirm({
    message: chalk.yellow(`Delete tag ${name}?`),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Deleting tag ${name}`);

  const result = execGit(`tag -d ${name}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Tag ${name} deleted`));
  } else {
    clack.cancel(chalk.red('Failed to delete tag'));
    console.error(result.error);
    process.exit(1);
  }
};

module.exports = async (args) => {
  const action = args[0];

  if (!action || action === 'list' || action === 'ls') {
    showBanner('TAG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Tag List')}`);
    listTags();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'create' || action === 'add') {
    showBanner('TAG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Create Tag')}`);
    const lightweight = args.includes('--lightweight');
    await createTag(args[1], args[2], args[3], lightweight);
    return;
  }

  if (action === 'delete' || action === 'del' || action === 'rm') {
    showBanner('TAG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Delete Tag')}`);
    await deleteTag(args[1]);
    return;
  }

  // Default: create tag
  showBanner('TAG');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Create Tag')}`);
  await createTag(action);
};

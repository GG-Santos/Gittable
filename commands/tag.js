const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showCommandHeader, execGitWithSpinner, handleCancel, promptConfirm } = require('../lib/utils/command-helpers');

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

const createTag = async (args) => {
  let name = args[0];
  let message = args[1];
  const commit = args[2];
  const lightweight = args.includes('--lightweight');

  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Tag name:'),
      placeholder: 'v1.0.0',
    });

    if (handleCancel(name)) return;
  }

  const annotated = !lightweight;
  if (annotated && !message) {
    message = await clack.text({
      message: chalk.cyan('Tag message (optional):'),
      placeholder: 'Release version 1.0.0',
      required: false,
    });

    if (handleCancel(message)) return;
  }

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

  await execGitWithSpinner(command, {
    spinnerText: `Creating tag ${name}`,
    successMessage: `Tag ${name} created`,
    errorMessage: 'Failed to create tag',
    silent: true,
  });
};

const deleteTag = async (args) => {
  let name = args[0];

  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Tag name to delete:'),
      placeholder: 'v1.0.0',
    });

    if (handleCancel(name)) return;
  }

  const confirmed = await promptConfirm(`Delete tag ${name}?`, false);
  if (!confirmed) return;

  await execGitWithSpinner(`tag -d ${name}`, {
    spinnerText: `Deleting tag ${name}`,
    successMessage: `Tag ${name} deleted`,
    errorMessage: 'Failed to delete tag',
    silent: true,
  });
};

module.exports = async (args) => {
  const action = args[0];

  if (!action || action === 'list' || action === 'ls') {
    showCommandHeader('TAG', 'Tag List');
    listTags();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'create' || action === 'add') {
    showCommandHeader('TAG', 'Create Tag');
    await createTag(args.slice(1));
    return;
  }

  if (action === 'delete' || action === 'del' || action === 'rm') {
    showCommandHeader('TAG', 'Delete Tag');
    await deleteTag(args.slice(1));
    return;
  }

  // Default: create tag
  showCommandHeader('TAG', 'Create Tag');
  await createTag([action]);
};

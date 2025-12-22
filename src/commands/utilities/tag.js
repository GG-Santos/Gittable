const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/components');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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
    name = await ui.prompt.text({
      message: 'Tag name:',
      placeholder: 'v1.0.0',
    });

    if (name === null) return;
  }

  const annotated = !lightweight;
  if (annotated && !message) {
    message = await ui.prompt.text({
      message: 'Tag message (optional):',
      placeholder: 'Release version 1.0.0',
      required: false,
    });

    if (message === null) return;
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
    name = await ui.prompt.text({
      message: 'Tag name to delete:',
      placeholder: 'v1.0.0',
    });

    if (name === null) return;
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
    ui.success('Done');
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

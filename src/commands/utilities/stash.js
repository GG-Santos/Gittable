const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStashList } = require('../../core/git');
const { createTable } = require('../../ui/table');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const listStashes = () => {
  const stashes = getStashList();

  if (stashes.length === 0) {
    console.log(chalk.dim('No stashes found'));
    return;
  }

  const rows = stashes.map((stash, index) => [
    chalk.cyan(`#${index}`),
    chalk.yellow(stash.ref),
    chalk.gray(stash.date),
    stash.message || chalk.dim('(no message)'),
  ]);

  console.log(`\n${createTable(['Index', 'Ref', 'Date', 'Message'], rows)}`);
  console.log(chalk.dim('\nUse: gittable stash apply <index> or gittable stash pop <index>'));
};

const createStash = async (args) => {
  let message = args[0];
  const includeUntracked = args.includes('--include-untracked') || args.includes('-u');

  if (!message) {
    const theme = getTheme();
    message = await clack.text({
      message: theme.primary('Stash message (optional):'),
      placeholder: 'WIP: working on feature',
    });

    if (handleCancel(message)) return;
  }

  const command = includeUntracked
    ? `stash push -u -m "${message || 'Stash'}"`
    : `stash push -m "${message || 'Stash'}"`;

  await execGitWithSpinner(command, {
    spinnerText: 'Creating stash',
    successMessage: 'Stash created',
    errorMessage: 'Failed to create stash',
    silent: true,
  });
};

const applyStash = async (args) => {
  const stashes = getStashList();
  const theme = getTheme();
  let stashRef = args[0];

  if (!stashRef) {
    if (stashes.length === 0) {
      clack.cancel(chalk.yellow('No stashes available'));
      return;
    }

    const options = stashes.map((stash, index) => ({
      value: stash.ref,
      label: `${chalk.cyan(`#${index}`)} ${stash.ref} - ${stash.message || chalk.dim('(no message)')}`,
    }));

    stashRef = await clack.select({
      message: theme.primary('Select stash to apply:'),
      options,
    });

    if (handleCancel(stashRef)) return;
  } else {
    // Support index-based selection (e.g., "0" for first stash)
    const index = Number.parseInt(stashRef, 10);
    if (!Number.isNaN(index) && index >= 0 && index < stashes.length) {
      stashRef = stashes[index].ref;
    }
  }

  await execGitWithSpinner(`stash apply ${stashRef}`, {
    spinnerText: `Applying stash ${stashRef}`,
    successMessage: 'Stash applied',
    errorMessage: 'Failed to apply stash',
  });
};

const popStash = async (args) => {
  const stashes = getStashList();
  const theme = getTheme();
  let stashRef = args[0];

  if (!stashRef) {
    if (stashes.length === 0) {
      clack.cancel(chalk.yellow('No stashes available'));
      return;
    }

    // Allow selection if multiple stashes
    if (stashes.length > 1) {
      const options = stashes.map((stash, index) => ({
        value: stash.ref,
        label: `${chalk.cyan(`#${index}`)} ${stash.ref} - ${stash.message || chalk.dim('(no message)')}`,
      }));

      stashRef = await clack.select({
        message: theme.primary('Select stash to pop:'),
        options,
      });

      if (handleCancel(stashRef)) return;
    } else {
      stashRef = stashes[0].ref; // Default to most recent
    }
  } else {
    // Support index-based selection
    const index = Number.parseInt(stashRef, 10);
    if (!Number.isNaN(index) && index >= 0 && index < stashes.length) {
      stashRef = stashes[index].ref;
    }
  }

  await execGitWithSpinner(`stash pop ${stashRef}`, {
    spinnerText: `Popping stash ${stashRef}`,
    successMessage: 'Stash popped',
    errorMessage: 'Failed to pop stash',
  });
};

const dropStash = async (args) => {
  const stashes = getStashList();
  const theme = getTheme();
  let stashRef = args[0];

  if (!stashRef) {
    if (stashes.length === 0) {
      clack.cancel(chalk.yellow('No stashes available'));
      return;
    }

    const options = stashes.map((stash) => ({
      value: stash.ref,
      label: `${stash.ref} - ${stash.message}`,
    }));

    stashRef = await clack.select({
      message: theme.primary('Select stash to drop:'),
      options,
    });

    if (handleCancel(stashRef)) return;
  }

  const confirmed = await promptConfirm(`Delete stash ${stashRef}?`, false);
  if (!confirmed) return;

  await execGitWithSpinner(`stash drop ${stashRef}`, {
    spinnerText: `Dropping stash ${stashRef}`,
    successMessage: 'Stash dropped',
    errorMessage: 'Failed to drop stash',
    silent: true,
  });
};

module.exports = async (args) => {
  const action = args[0] || 'list';

  showCommandHeader('STASH', 'Stash Management');

  if (action === 'list' || action === 'ls') {
    listStashes();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'create' || action === 'save' || action === 'push') {
    await createStash(args.slice(1));
    return;
  }

  if (action === 'apply') {
    await applyStash(args.slice(1));
    return;
  }

  if (action === 'pop') {
    await popStash(args.slice(1));
    return;
  }

  if (action === 'drop' || action === 'delete') {
    await dropStash(args.slice(1));
    return;
  }

  // Default: create stash
  await createStash([action]);
};

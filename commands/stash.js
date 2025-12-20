const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getStashList } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showBanner } = require('../lib/ui/banner');

const listStashes = () => {
  const stashes = getStashList();

  if (stashes.length === 0) {
    console.log(chalk.dim('No stashes found'));
    return;
  }

  const rows = stashes.map((stash, _index) => [stash.ref, stash.date, stash.message]);

  console.log(`\n${createTable(['Ref', 'Date', 'Message'], rows)}`);
};

const createStash = async (message, includeUntracked = false) => {
  const spinner = clack.spinner();
  spinner.start('Creating stash');

  const command = includeUntracked
    ? `stash push -u -m "${message || 'Stash'}"`
    : `stash push -m "${message || 'Stash'}"`;

  const result = execGit(command, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Stash created'));
  } else {
    clack.cancel(chalk.red('Failed to create stash'));
    console.error(result.error);
    process.exit(1);
  }
};

const applyStash = async (stashRef) => {
  const stashes = getStashList();

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
      message: chalk.cyan('Select stash to apply:'),
      options,
    });

    if (clack.isCancel(stashRef)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Applying stash ${stashRef}`);

  const result = execGit(`stash apply ${stashRef}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Stash applied'));
  } else {
    clack.cancel(chalk.red('Failed to apply stash'));
    console.error(result.error);
    process.exit(1);
  }
};

const popStash = async (stashRef) => {
  const stashes = getStashList();

  if (!stashRef) {
    if (stashes.length === 0) {
      clack.cancel(chalk.yellow('No stashes available'));
      return;
    }

    stashRef = stashes[0].ref; // Default to most recent
  }

  const spinner = clack.spinner();
  spinner.start(`Popping stash ${stashRef}`);

  const result = execGit(`stash pop ${stashRef}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Stash popped'));
  } else {
    clack.cancel(chalk.red('Failed to pop stash'));
    console.error(result.error);
    process.exit(1);
  }
};

const dropStash = async (stashRef) => {
  const stashes = getStashList();

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
      message: chalk.cyan('Select stash to drop:'),
      options,
    });

    if (clack.isCancel(stashRef)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const confirm = await clack.confirm({
    message: chalk.yellow(`Delete stash ${stashRef}?`),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Dropping stash ${stashRef}`);

  const result = execGit(`stash drop ${stashRef}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Stash dropped'));
  } else {
    clack.cancel(chalk.red('Failed to drop stash'));
    console.error(result.error);
    process.exit(1);
  }
};

module.exports = async (args) => {
  const action = args[0] || 'list';

  showBanner('STASH');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Stash Management')}`);

  if (action === 'list' || action === 'ls') {
    listStashes();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'create' || action === 'save' || action === 'push') {
    const message =
      args[1] ||
      (await clack.text({
        message: chalk.cyan('Stash message (optional):'),
        placeholder: 'WIP: working on feature',
      }));

    if (!clack.isCancel(message)) {
      const includeUntracked = args.includes('--include-untracked') || args.includes('-u');
      await createStash(message, includeUntracked);
    }
    return;
  }

  if (action === 'apply') {
    await applyStash(args[1]);
    return;
  }

  if (action === 'pop') {
    await popStash(args[1]);
    return;
  }

  if (action === 'drop' || action === 'delete') {
    await dropStash(args[1]);
    return;
  }

  // Default: create stash
  await createStash(action);
};

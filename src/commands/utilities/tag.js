const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/components');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
  requireTTY,
} = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');
const { createActionRouter } = require('../../utils/commands/action-router');
const { ensureRemoteExists } = require('../../utils/git');

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

const pushTag = async (args) => {
  requireTTY('Please use: git tag <name> && git push <remote> <name> for non-interactive mode');

  let tagName = args[0];
  let message = args[1];
  const remote = args[2] || 'origin';
  const lightweight = args.includes('--lightweight');

  // Get tag name
  if (!tagName) {
    tagName = await ui.prompt.text({
      message: 'Tag name:',
      placeholder: 'v1.0.0',
    });

    if (tagName === null) return;
  }

  // Check if tag already exists
  const tagExists = execGit(`tag -l ${tagName}`, { silent: true });
  if (tagExists.success && tagExists.output.trim()) {
    const overwrite = await promptConfirm(`Tag ${tagName} already exists. Overwrite?`, false);
    if (!overwrite) {
      return;
    }
    // Delete existing tag
    await execGitWithSpinner(`tag -d ${tagName}`, {
      spinnerText: 'Deleting existing tag',
      successMessage: null,
      errorMessage: 'Failed to delete existing tag',
      silent: true,
    });
  }

  // Get message for annotated tag
  const annotated = !lightweight;
  if (annotated && !message) {
    message = await ui.prompt.text({
      message: 'Tag message (optional):',
      placeholder: 'Release version 1.0.0',
      required: false,
    });

    if (message === null) return;
  }

  // Create tag
  let createCommand = 'tag';
  if (annotated && message) {
    createCommand += ` -a ${tagName} -m "${message}"`;
  } else if (annotated) {
    createCommand += ` -a ${tagName}`;
  } else {
    createCommand += ` ${tagName}`;
  }

  await execGitWithSpinner(createCommand, {
    spinnerText: `Creating tag ${tagName}`,
    successMessage: null,
    errorMessage: 'Failed to create tag',
    silent: true,
  });

  // Ensure remote exists
  await ensureRemoteExists(remote);

  // Push tag
  const shouldPush = await promptConfirm(`Push tag ${tagName} to ${remote}?`, true);

  if (!shouldPush) {
    ui.success(`Tag ${tagName} created locally`);
    return;
  }

  await execGitWithSpinner(`push ${remote} ${tagName}`, {
    spinnerText: `Pushing tag to ${remote}`,
    successMessage: `Tag ${tagName} created and pushed`,
    errorMessage: 'Failed to push tag',
  });
};

const deleteTag = async (args) => {
  requireTTY(
    'Please use: git tag -d <name> && git push <remote> --delete <name> for non-interactive mode'
  );

  let tagName = args[0];
  const remote = args[1] || 'origin';

  // Get tag name
  if (!tagName) {
    const tagsResult = execGit('tag -l', { silent: true });
    if (!tagsResult.success || !tagsResult.output.trim()) {
      ui.warn('No tags found');
      return;
    }

    const tags = tagsResult.output.trim().split('\n').filter(Boolean);
    const options = tags.map((tag) => ({
      value: tag,
      label: tag,
    }));

    tagName = await ui.prompt.select({
      message: 'Select tag to delete:',
      options,
    });

    if (tagName === null) return;
  }

  // Check if tag exists locally
  const tagExists = execGit(`tag -l ${tagName}`, { silent: true });
  if (!tagExists.success || !tagExists.output.trim()) {
    ui.warn(`Tag ${tagName} not found locally`);
    return;
  }

  // Confirm deletion
  const confirmed = await promptConfirm(`Delete tag ${tagName}?`, false);

  if (!confirmed) {
    return;
  }

  // Delete locally
  await execGitWithSpinner(`tag -d ${tagName}`, {
    spinnerText: 'Deleting tag locally',
    successMessage: null,
    errorMessage: 'Failed to delete tag locally',
    silent: true,
  });

  // Check if remote exists
  const remoteExists = execGit(`ls-remote --tags ${remote} ${tagName}`, { silent: true });
  const hasRemoteTag = remoteExists.success && remoteExists.output.trim().length > 0;

  if (hasRemoteTag) {
    const deleteRemote = await promptConfirm(
      `Tag exists on ${remote}. Delete from remote too?`,
      true
    );

    if (deleteRemote) {
      await execGitWithSpinner(`push ${remote} --delete ${tagName}`, {
        spinnerText: `Deleting tag from ${remote}`,
        successMessage: `Tag ${tagName} deleted locally and remotely`,
        errorMessage: 'Failed to delete tag from remote',
      });
    } else {
      ui.success(`Tag ${tagName} deleted locally`);
    }
  } else {
    ui.success(`Tag ${tagName} deleted`);
  }
};

module.exports = createActionRouter({
  commandName: 'TAG',
  helpText: [
    'Available actions:',
    '  - gittable tag (list tags)',
    '  - gittable tag create <name> (create tag)',
    '  - gittable tag push <name> (create and push tag)',
    '  - gittable tag delete <name> (delete tag locally and optionally from remote)',
  ],
  actions: [
    {
      value: 'list',
      label: chalk.cyan('List tags'),
      title: 'Tag List',
      handler: async () => {
        listTags();
        ui.success('Done');
      },
      aliases: ['ls', 'l'],
      showOutro: false,
    },
    {
      value: 'create',
      label: chalk.green('Create tag'),
      title: 'Create Tag',
      handler: createTag,
      aliases: ['add', 'new'],
    },
    {
      value: 'push',
      label: chalk.yellow('Create and push tag'),
      title: 'Create and Push Tag',
      handler: pushTag,
      aliases: ['p'],
    },
    {
      value: 'delete',
      label: chalk.red('Delete tag'),
      title: 'Delete Tag',
      handler: deleteTag,
      aliases: ['del', 'rm', 'remove'],
    },
  ],
  defaultAction: async (args) => {
    // Default: list tags if no action provided
    if (!args[0]) {
      showCommandHeader('TAG', 'Tag List');
      listTags();
      ui.success('Done');
      return;
    }
    // If first arg looks like a tag name, create it
    showCommandHeader('TAG', 'Create Tag');
    await createTag(args);
  },
});

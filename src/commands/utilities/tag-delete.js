const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
} = require('../../utils/commands');
const { ensureRemoteExists } = require('../../utils/git');
const { getTheme } = require('../../utils/ui');

/**
 * Tag-delete command - Delete tag locally and remotely
 */
module.exports = async (args) => {
  showCommandHeader('TAG-DELETE', 'Delete Tag');

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

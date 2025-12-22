const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
} = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Tag-push command - Create and push tag
 */
module.exports = async (args) => {
  showCommandHeader('TAG-PUSH', 'Create and Push Tag');

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

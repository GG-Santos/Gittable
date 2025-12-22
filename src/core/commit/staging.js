/**
 * File staging module
 * Handles interactive file staging before commit
 */

const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { getStatus } = require('../git/status');
const { CancelledError } = require('../errors');

/**
 * Check for unstaged files and offer staging options
 */
async function handleUnstagedFiles(options = {}) {
  const { all = false, skipStagingCheck = false } = options;

  // Skip if --all flag is used or staging check is disabled
  if (all || skipStagingCheck) {
    return { staged: false, cancelled: false };
  }

  // Force fresh status check (don't use cache) to ensure accurate counts
  const status = getStatus(false);
  if (!status) {
    return { staged: false, cancelled: false };
  }

  const unstagedCount = status.unstaged.length + status.untracked.length;
  const stagedCount = status.staged.length;

  // If no unstaged files, proceed
  if (unstagedCount === 0) {
    return { staged: false, cancelled: false };
  }

  // If no staged files but unstaged files exist, we need to stage
  if (stagedCount === 0 && unstagedCount > 0) {
    return await handleNoStagedFiles(status, unstagedCount);
  }

  // If we have both staged and unstaged files, offer to stage more
  if (stagedCount > 0 && unstagedCount > 0) {
    return await handlePartialStaging(status, stagedCount, unstagedCount);
  }

  return { staged: false, cancelled: false };
}

/**
 * Handle case where no files are staged
 */
async function handleNoStagedFiles(status, unstagedCount) {
  const { execGitWithSpinner } = require('../../utils/commands');
  const { createFileOptions } = require('../../utils/file-selection');
  const ui = require('../../ui/framework');

  prompts.note(
    `Found ${unstagedCount} unstaged file(s) and no staged files.`,
    chalk.yellow('Staging Required')
  );

  const action = await prompts.select({
    message: 'What would you like to do?',
    options: [
      { value: 'stage-all', label: chalk.green('Stage all files') + chalk.dim(' - Stage all changes') },
      { value: 'stage-select', label: chalk.cyan('Select files to stage') + chalk.dim(' - Choose specific files') },
      { value: 'proceed', label: chalk.yellow('Proceed anyway') + chalk.dim(' - Create empty commit (not recommended)') },
      { value: 'cancel', label: chalk.red('Cancel') },
    ],
  });

  if (prompts.isCancel(action) || action === 'cancel') {
    throw new CancelledError('Operation cancelled');
  }

  if (action === 'proceed') {
    return { staged: false, cancelled: false };
  }

  if (action === 'stage-all') {
    await execGitWithSpinner('add -A', {
      spinnerText: 'Staging all changes',
      successMessage: null,
      errorMessage: 'Failed to stage files',
    });
    return { staged: true, cancelled: false };
  }

  if (action === 'stage-select') {
    return await stageSelectedFiles(status);
  }

  return { staged: false, cancelled: false };
}

/**
 * Handle case where some files are staged
 */
async function handlePartialStaging(status, stagedCount, unstagedCount) {
  const { execGitWithSpinner } = require('../../utils/commands');

  const action = await prompts.select({
    message: `You have ${stagedCount} staged and ${unstagedCount} unstaged file(s). What would you like to do?`,
    options: [
      { value: 'proceed', label: chalk.green('Proceed with staged files') + chalk.dim(' - Commit only staged files') },
      { value: 'stage-more', label: chalk.cyan('Stage more files') + chalk.dim(' - Select additional files to stage') },
      { value: 'stage-all', label: chalk.cyan('Stage all files') + chalk.dim(' - Stage all remaining changes') },
      { value: 'cancel', label: chalk.red('Cancel') },
    ],
  });

  if (prompts.isCancel(action) || action === 'cancel') {
    throw new CancelledError('Operation cancelled');
  }

  if (action === 'proceed') {
    return { staged: false, cancelled: false };
  }

  if (action === 'stage-all') {
    await execGitWithSpinner('add -A', {
      spinnerText: 'Staging all changes',
      successMessage: null,
      errorMessage: 'Failed to stage files',
    });
    return { staged: true, cancelled: false };
  }

  if (action === 'stage-more') {
    // Get fresh status to ensure we have the latest file list
    const freshStatus = getStatus(false);
    return await stageSelectedFiles(freshStatus || status, true);
  }

  return { staged: false, cancelled: false };
}

/**
 * Stage selected files interactively
 */
async function stageSelectedFiles(status, isAdditional = false) {
  const { execGitWithSpinner } = require('../../utils/commands');
  const { createFileOptions } = require('../../utils/file-selection');
  const ui = require('../../ui/framework');

  const allFilesList = [...status.unstaged.map((f) => f.file), ...status.untracked];
  const statusMap = {
    ...Object.fromEntries(status.unstaged.map((f) => [f.file, 'M'])),
    ...Object.fromEntries(status.untracked.map((f) => [f, '?'])),
  };
  const allFiles = createFileOptions(allFilesList, statusMap);

  if (allFiles.length === 0) {
    ui.warn('No files to stage');
    return { staged: false, cancelled: !isAdditional };
  }

  const selected = await ui.prompt.multiselect({
    message: isAdditional ? 'Select additional files to stage:' : 'Select files to stage:',
    options: allFiles,
    maxItems: 7,
  });

  if (prompts.isCancel(selected) || !selected || selected.length === 0) {
    return { staged: false, cancelled: !isAdditional };
  }

  if (selected.length === 0) {
    if (!isAdditional) {
      throw new CancelledError('No files selected');
    }
    return { staged: false, cancelled: false };
  }

  // Pass files as array to handle spaces and special characters safely
  const gitArgs = ['add', ...selected];
  const result = await execGitWithSpinner(gitArgs, {
    spinnerText: isAdditional 
      ? `Staging ${selected.length} additional file(s)`
      : `Staging ${selected.length} file(s)`,
    successMessage: null,
    errorMessage: 'Failed to stage files',
  });

  // Verify that staging actually succeeded
  if (!result.success) {
    return { staged: false, cancelled: false };
  }

  // Clear status cache after successful staging
  const { getCache } = require('../../utils');
  const statusCache = getCache('status');
  statusCache.clear();

  return { staged: true, cancelled: false };
}

module.exports = {
  handleUnstagedFiles,
};


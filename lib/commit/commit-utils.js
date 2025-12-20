const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execSync } = require('node:child_process');
const { execGit, getStatus } = require('../git/exec');
const { promptQuestions, CancelError } = require('./questions');
const buildCommit = require('./build-commit');
const readConfigFile = require('../config/read-config-file');

/**
 * Check if there are staged changes or if --all flag is used
 */
function hasStagedChanges(options = {}) {
  const { all = false, allowEmpty = false } = options;
  
  if (allowEmpty || all) {
    return true; // Skip check if these flags are set
  }

  // Check if staging area has changes
  const result = execGit('diff --cached --quiet', { silent: true });
  return !result.success; // Exit code 1 means there are staged changes
}

/**
 * Get staged files count and names for display
 */
function getStagedFilesInfo() {
  const result = execGit('diff --cached --name-only', { silent: true });
  if (!result.success) {
    return { count: 0, files: [] };
  }

  const files = result.output.trim().split('\n').filter(Boolean);
  return {
    count: files.length,
    files: files.slice(0, 10), // Show first 10 files
    hasMore: files.length > 10,
  };
}

/**
 * Validate staging area before commit
 */
function validateStagingArea(options = {}) {
  const { all = false, allowEmpty = false } = options;

  if (allowEmpty) {
    return { valid: true };
  }

  if (all) {
    // Check if there are any changes at all
    const status = getStatus();
    if (!status || (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0)) {
      return {
        valid: false,
        error: 'No changes to commit. Use --allow-empty to create an empty commit.',
      };
    }
    return { valid: true };
  }

  // Check for staged changes
  if (!hasStagedChanges(options)) {
    const stagedInfo = getStagedFilesInfo();
    return {
      valid: false,
      error: 'No files added to staging! Did you forget to run git add?',
      suggestion: 'Run "gittable add" to stage files, or use "git cz -a" to commit all changes.',
    };
  }

  return { valid: true };
}

/**
 * Execute git commit with improved error handling
 */
function executeCommit(message, options = {}) {
  const {
    allowEmpty = false,
    amend = false,
    all = false,
    noVerify = false,
    noGpgSign = false,
    gitRoot = process.cwd(),
  } = options;

  // Build git commit command
  const args = ['commit'];

  if (amend) {
    args.push('--amend');
  }

  if (all) {
    args.push('-a');
  }

  if (noVerify) {
    args.push('--no-verify');
  }

  if (noGpgSign) {
    args.push('--no-gpg-sign');
  }

  // Use -F - to read message from stdin
  args.push('-F', '-');

  try {
    execSync(`git ${args.join(' ')}`, {
      cwd: gitRoot,
      input: message,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true };
  } catch (error) {
    const stderr = error.stderr?.toString() || '';
    const stdout = error.stdout?.toString() || '';
    
    // Parse common git errors for better messages
    let errorMessage = stderr || error.message || 'Failed to create commit';
    
    // Improve error messages
    if (stderr.includes('nothing to commit')) {
      errorMessage = 'No changes to commit. Stage files first with "gittable add" or use --allow-empty.';
    } else if (stderr.includes('no changes added to commit')) {
      errorMessage = 'No changes staged for commit. Use "gittable add" to stage files.';
    } else if (stderr.includes('hook')) {
      errorMessage = `Git hook failed: ${stderr.trim()}`;
    }

    return {
      success: false,
      error: errorMessage,
      stdout,
      stderr,
    };
  }
}

/**
 * Show commit preview with staged files info
 */
function showCommitPreview(message, options = {}) {
  const { showStagedFiles = true } = options;

  if (showStagedFiles) {
    const stagedInfo = getStagedFilesInfo();
    if (stagedInfo.count > 0) {
      const filesPreview = stagedInfo.files.join(', ');
      const moreText = stagedInfo.hasMore ? ` and ${stagedInfo.count - 10} more` : '';
      clack.note(
        `${stagedInfo.count} file(s) staged: ${filesPreview}${moreText}`,
        chalk.dim('Staged Files')
      );
    }
  }

  clack.note(message, chalk.bold('Commit Preview'));
}

/**
 * Main commit flow - shared between commit command and commitizen adapter
 */
async function commitFlow(options = {}) {
  const {
    showHeader = false,
    showStagedFiles = true,
    skipValidation = false,
    commitCallback = null,
  } = options;

  // Show header if requested
  if (showHeader) {
    const { showCommandHeader } = require('../utils/command-helpers');
    showCommandHeader('COMMIT', 'Create Commit');
  }

  // Load config
  const config = readConfigFile();
  if (!config) {
    clack.cancel(chalk.red('No configuration found'));
    throw new Error('No commit configuration found');
  }

  config.subjectLimit = config.subjectLimit || 100;

  // Validate staging area
  if (!skipValidation) {
    const validation = validateStagingArea(options);
    if (!validation.valid) {
      clack.cancel(chalk.red(validation.error));
      if (validation.suggestion) {
        console.log(chalk.yellow(validation.suggestion));
      }
      throw new Error(validation.error);
    }
  }

  // Prompt for commit message
  let message;
  try {
    const answers = await promptQuestions(config);
    message = buildCommit(answers, config);

    showCommitPreview(message, { showStagedFiles });

    const action = await clack.select({
      message: chalk.yellow('Proceed?'),
      options: [
        { value: 'yes', label: chalk.green('Commit') },
        { value: 'no', label: chalk.red('Cancel') },
      ],
    });

    if (clack.isCancel(action) || action === 'no') {
      clack.cancel(chalk.yellow('Cancelled'));
      return { cancelled: true };
    }
  } catch (error) {
    if (error instanceof CancelError || error.isCancel) {
      clack.cancel(chalk.yellow('Operation cancelled'));
      return { cancelled: true };
    }
    throw error;
  }

  // Execute commit
  const spinner = clack.spinner();
  spinner.start('Creating commit...');

  let result;
  if (commitCallback) {
    // Use provided callback (for commitizen adapter)
    try {
      await new Promise((resolve, reject) => {
        try {
          commitCallback(message);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      result = { success: true };
    } catch (error) {
      result = {
        success: false,
        error: error.message || 'Failed to create commit',
      };
    }
  } else {
    // Direct git commit
    result = executeCommit(message, options);
  }

  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Commit created successfully'));
    return { success: true, message };
  } else {
    clack.cancel(chalk.red('Failed to create commit'));
    console.error(result.error);
    throw new Error(result.error);
  }
}

/**
 * Prompter function for programmatic use
 * Provides a simple interface that wraps commitFlow
 * @param {unknown} _ - Unused parameter (kept for compatibility)
 * @param {function} commit - Commit callback function
 * @returns {Promise<void>}
 */
async function prompter(_, commit) {
  try {
    const result = await commitFlow({
      showHeader: false,
      showStagedFiles: true,
      skipValidation: false,
      commitCallback: commit,
    });

    if (result?.cancelled) {
      process.exit(0);
    }
  } catch (error) {
    // Error handling is done in commitFlow
    process.exit(1);
  }
}

module.exports = {
  commitFlow,
  executeCommit,
  validateStagingArea,
  hasStagedChanges,
  getStagedFilesInfo,
  showCommitPreview,
  prompter,
};


const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showBanner } = require('../ui/banner');
const { getTheme } = require('./color-theme');

/**
 * Display command header (banner + title)
 * This pattern is used in almost every command
 */
function showCommandHeader(commandName, title) {
  const theme = getTheme();
  showBanner(commandName);
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary(title))}`);
}

/**
 * Check if TTY is available and show error if not
 * Returns true if TTY is available, false otherwise
 */
function requireTTY(helpText = null) {
  if (!process.stdin.isTTY) {
    clack.cancel(chalk.red('Interactive mode required'));
    if (helpText) {
      console.log(chalk.yellow('This command requires interactive input.'));
      if (Array.isArray(helpText)) {
        helpText.forEach((line) => console.log(chalk.gray(line)));
      } else {
        console.log(chalk.gray(helpText));
      }
    }
    process.exit(1);
  }
  return true;
}

/**
 * Execute git command with spinner and standardized error handling
 * This is the most common pattern across all commands
 */
async function execGitWithSpinner(gitCommand, options = {}) {
  const {
    spinnerText,
    silent = false,
    successMessage = null,
    errorMessage = null,
    onSuccess = null,
    onError = null,
  } = options;

  const spinner = clack.spinner();
  if (spinnerText) {
    spinner.start(spinnerText);
  }

  const { execGit } = require('../core/git/executor');
  const { verboseCommand } = require('./verbose-mode');
  const { isDryRun, dryRunLog, executeOrSimulate } = require('./dry-run-mode');

  verboseCommand(gitCommand, options);

  // Handle dry run mode
  if (isDryRun()) {
    dryRunLog(spinnerText || 'Would execute command', gitCommand);
    return {
      success: true,
      dryRun: true,
      output: '[DRY RUN] Command would be executed',
      error: null,
    };
  }

  const result = execGit(gitCommand, { silent });

  if (spinnerText) {
    spinner.stop();
  }

  if (result.success) {
    if (successMessage) {
      clack.outro(chalk.green.bold(successMessage));
    }
    if (onSuccess) {
      await onSuccess(result);
    }
    return result;
  }
  const errorMsg = errorMessage || 'Operation failed';
  clack.cancel(chalk.red(errorMsg));

  // Show enhanced error message with suggestions
  const { displayEnhancedError } = require('./error-helpers');
  displayEnhancedError(result.error, gitCommand);

  if (onError) {
    await onError(result);
  } else {
    process.exit(1);
  }
  return result;
}

/**
 * Handle clack cancel with consistent messaging
 */
function handleCancel(value, customMessage = 'Cancelled') {
  if (clack.isCancel(value)) {
    clack.cancel(chalk.yellow(customMessage));
    return true;
  }
  return false;
}

/**
 * Prompt for confirmation with consistent handling
 */
async function promptConfirm(message, initialValue = false) {
  const confirm = await clack.confirm({
    message: chalk.yellow(message),
    initialValue,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return false;
  }

  return true;
}

/**
 * Show smart suggestions for next actions
 */
async function showSmartSuggestion(message, options = []) {
  if (!process.stdin.isTTY || options.length === 0) {
    return null;
  }

  const theme = getTheme();
  const action = await clack.select({
    message: theme.primary(message),
    options: options.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  });

  if (clack.isCancel(action)) {
    return null;
  }

  return action;
}

module.exports = {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
  showSmartSuggestion,
};

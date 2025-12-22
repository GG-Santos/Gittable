const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showBanner } = require('../../ui/components/banner');
const { getTheme } = require('../ui');

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
    ui.error('Interactive mode required', {
      suggestion: helpText ? (Array.isArray(helpText) ? helpText.join('\n') : helpText) : 'This command requires interactive input.',
      exit: true,
    });
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

  const spinner = ui.prompt.spinner();
  if (spinnerText) {
    spinner.start(spinnerText);
  }

  const { execGit } = require('../../core/git/executor');
  const { verboseCommand } = require('../verbose-mode');
  const { isDryRun, dryRunLog, executeOrSimulate } = require('../dry-run-mode');

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
      ui.success(successMessage);
    }
    if (onSuccess) {
      await onSuccess(result);
    }
    return result;
  }
  const errorMsg = errorMessage || 'Operation failed';

  // Show enhanced error message with suggestions
  const { parseGitError } = require('../validation');
  const parsedError = parseGitError(result.error, gitCommand);
  
  ui.error(errorMsg, {
    suggestion: parsedError.suggestion,
    solution: parsedError.solution,
    exit: false, // Don't exit here, let caller handle it
  });

  if (onError) {
    await onError(result);
  }
  // Return result instead of exiting - let caller handle the error
  return result;
}

/**
 * Handle prompt cancel with consistent messaging
 */
function handleCancel(value, customMessage = 'Cancelled') {
  return ui.prompt.handleCancel(value, customMessage);
}

/**
 * Prompt for confirmation with consistent handling
 */
async function promptConfirm(message, initialValue = false) {
  return ui.prompt.confirm({
    message,
    initialValue,
  });
}

/**
 * Show smart suggestions for next actions
 */
async function showSmartSuggestion(message, options = []) {
  if (!process.stdin.isTTY || options.length === 0) {
    return null;
  }

  return ui.prompt.select({
    message,
    options: options.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  });
}

module.exports = {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
  showSmartSuggestion,
};

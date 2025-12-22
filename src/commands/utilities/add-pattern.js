const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execSync } = require('node:child_process');
const { getStatus } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Add-pattern command - Stage files matching a pattern
 */
module.exports = async (args) => {
  showCommandHeader('ADD-PATTERN', 'Stage Files by Pattern');

  requireTTY('Please use: git add <pattern> for non-interactive mode');

  let pattern = args[0];

  if (!pattern) {
    pattern = await ui.prompt.text({
      message: 'File pattern (e.g., *.js, src/**/*.ts, **/*.test.js):',
      placeholder: '*.js',
    });

    if (pattern === null) return;
  }

  // Get files matching pattern
  let matchingFiles = [];
  try {
    const result = execSync(
      'git ls-files --others --exclude-standard --cached --modified --deleted',
      {
        encoding: 'utf8',
        cwd: process.cwd(),
      }
    );

    const allFiles = result.trim().split('\n').filter(Boolean);

    // Simple glob matching (basic implementation)
    const regexPattern = pattern
      .replace(/\*\*/g, '___DOUBLE_STAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DOUBLE_STAR___/g, '.*')
      .replace(/\?/g, '[^/]');

    const regex = new RegExp(`^${regexPattern}$`);
    matchingFiles = allFiles.filter((file) => regex.test(file));
  } catch (error) {
    ui.error(`Failed to find files matching pattern: ${error.message}`, { exit: true });
  }

  if (matchingFiles.length === 0) {
    ui.warn(`No files found matching pattern: ${pattern}`);
    return;
  }

  // Show matching files
  const theme = getTheme();
  console.log(theme.primary(`\nFound ${matchingFiles.length} file(s) matching "${pattern}":`));
  matchingFiles.slice(0, 20).forEach((file) => {
    console.log(theme.dim(`  - ${file}`));
  });
  if (matchingFiles.length > 20) {
    console.log(theme.dim(`  ... and ${matchingFiles.length - 20} more`));
  }

  // Confirm
  const { promptConfirm } = require('../../utils/command-helpers');
  const confirmed = await promptConfirm(`Stage ${matchingFiles.length} file(s)?`, true);

  if (!confirmed) {
    return;
  }

  // Stage files
  await execGitWithSpinner(`add ${matchingFiles.join(' ')}`, {
    spinnerText: `Staging ${matchingFiles.length} file(s)`,
    successMessage: `Staged ${matchingFiles.length} file(s) matching "${pattern}"`,
    errorMessage: 'Failed to stage files',
  });
};

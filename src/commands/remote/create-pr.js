const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader } = require('../../utils/commands');
const { getCurrentBranch, execGit } = require('../../core/git');
const { getPRUrl, detectCIPlatform } = require('../../utils/git');
const { createLink } = require('../../utils/ui');
const { getTheme } = require('../../utils/ui');

/**
 * Create PR/MR command
 */
module.exports = async (args) => {
  showCommandHeader('CREATE-PR', 'Create Pull Request');

  const branch = getCurrentBranch();
  const theme = getTheme();
  if (!branch) {
    ui.error('Not in a git repository', { exit: true });
  }

  const platform = detectCIPlatform();
  if (!platform) {
    ui.warn('Could not detect CI/CD platform');
    ui.info('Supported platforms: GitHub, GitLab');
    return;
  }

  const prUrl = getPRUrl(branch);
  if (!prUrl) {
    ui.error('Could not generate PR URL', { exit: true });
  }

  console.log();
  console.log(theme.primary(`Creating PR for branch: ${theme.bold(branch)}`));
  console.log();

  const link = createLink('Open in browser', prUrl);
  console.log(theme.success(`✓ ${link}`));
  console.log(theme.dim(`  ${prUrl}`));

  // Try to open in browser
  const { execSync } = require('node:child_process');
  try {
    if (process.platform === 'win32') {
      execSync(`start ${prUrl}`, { stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
      execSync(`open ${prUrl}`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open ${prUrl}`, { stdio: 'ignore' });
    }
    ui.note('Opened in browser');
  } catch (error) {
    // Silently fail if browser can't be opened
  }

  ui.success('PR creation link ready');
};

const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader } = require('../../utils/command-helpers');
const { getCurrentBranch, execGit } = require('../../core/git');
const { getPRUrl, detectCIPlatform } = require('../../utils/ci-status');
const { createLink } = require('../../utils/terminal-link');

/**
 * Create PR/MR command
 */
module.exports = async (args) => {
  showCommandHeader('CREATE-PR', 'Create Pull Request');

  const branch = getCurrentBranch();
  if (!branch) {
    clack.cancel(chalk.red('Not in a git repository'));
    return;
  }

  const platform = detectCIPlatform();
  if (!platform) {
    clack.cancel(chalk.yellow('Could not detect CI/CD platform'));
    console.log(chalk.dim('Supported platforms: GitHub, GitLab'));
    return;
  }

  const prUrl = getPRUrl(branch);
  if (!prUrl) {
    clack.cancel(chalk.red('Could not generate PR URL'));
    return;
  }

  console.log();
  console.log(chalk.cyan(`Creating PR for branch: ${chalk.bold(branch)}`));
  console.log();

  const link = createLink('Open in browser', prUrl);
  console.log(chalk.green(`✓ ${link}`));
  console.log(chalk.dim(`  ${prUrl}`));

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
    clack.note('Opened in browser', chalk.dim('Browser'));
  } catch (error) {
    // Silently fail if browser can't be opened
  }

  clack.outro(chalk.green.bold('PR creation link ready'));
};

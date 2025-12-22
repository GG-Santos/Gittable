const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');
const prompts = require('../ui/prompts');

/**
 * Run post-commit hooks
 */
async function runPostCommitHooks(options = {}) {
  const { runTests = false, sendNotifications = false, updateIssueTrackers = false } = options;

  const hooks = [];

  // Check for package.json to determine project type
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const hasPackageJson = fs.existsSync(packageJsonPath);

  if (hasPackageJson) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      // Check for test script
      if (runTests && scripts.test) {
        hooks.push({
          name: 'Tests',
          command: 'npm test',
          script: 'test',
        });
      }

      // Check for post-commit script
      if (scripts['post-commit']) {
        hooks.push({
          name: 'Post-commit script',
          command: 'npm run post-commit',
          script: 'post-commit',
        });
      }
    } catch (error) {
      // Ignore package.json parse errors
    }
  }

  // Check for git post-commit hook
  const { hookExists, runHook } = require('./git-hooks');
  if (hookExists('post-commit')) {
    hooks.push({
      name: 'Git post-commit hook',
      command: 'git hook post-commit',
      isGitHook: true,
    });
  }

  if (hooks.length === 0) {
    return { success: true, skipped: true };
  }

  const results = [];

  for (const hook of hooks) {
    const spinner = prompts.spinner();
    spinner.start(`Running ${hook.name}...`);

    try {
      if (hook.isGitHook) {
        const hookResult = runHook('post-commit');
        spinner.stop();
        results.push({
          name: hook.name,
          success: hookResult.success,
          error: hookResult.error,
        });
        if (hookResult.success) {
          prompts.note(`${hook.name} passed`, chalk.green('Post-commit'));
        } else {
          prompts.cancel(chalk.red(`${hook.name} failed`));
        }
      } else {
        execSync(hook.command, {
          stdio: 'pipe',
          cwd: process.cwd(),
        });
        spinner.stop();
        results.push({
          name: hook.name,
          success: true,
        });
        prompts.note(`${hook.name} passed`, chalk.green('Post-commit'));
      }
    } catch (error) {
      spinner.stop();
      results.push({
        name: hook.name,
        success: false,
        error: error.message,
      });
      prompts.cancel(chalk.red(`${hook.name} failed`));
    }
  }

  return { success: results.every((r) => r.success), results };
}

/**
 * Send notification (if enabled)
 */
function sendNotification(title, message, options = {}) {
  const { type = 'info' } = options;

  // Check if notifications are enabled
  const { getPreference } = require('./user-preferences');
  const notificationsEnabled = getPreference('notifications.enabled', false);

  if (!notificationsEnabled) {
    return;
  }

  // Try to use system notification
  try {
    // For Windows
    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')"`,
        { stdio: 'ignore' }
      );
    }
    // For macOS
    else if (process.platform === 'darwin') {
      execSync(`osascript -e 'display notification "${message}" with title "${title}"'`, {
        stdio: 'ignore',
      });
    }
    // For Linux
    else if (process.platform === 'linux') {
      execSync(`notify-send "${title}" "${message}"`, { stdio: 'ignore' });
    }
  } catch (error) {
    // Silently fail if notifications aren't available
  }
}

module.exports = {
  runPostCommitHooks,
  sendNotification,
};

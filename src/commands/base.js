const chalk = require('chalk');
const ui = require('../ui/framework');
const { isGitRepo } = require('../core/git/executor');
const { showBanner } = require('../ui/banner');
const { getTheme } = require('../utils/color-theme');

/**
 * Base command helper with common functionality
 */
class BaseCommand {
  /**
   * Check if TTY is available
   */
  static requireTTY(helpText = null) {
    if (!process.stdin.isTTY) {
      ui.error('Interactive mode required', {
        suggestion: helpText ? (Array.isArray(helpText) ? helpText : [helpText]) : undefined,
        exit: true,
      });
    }
    return true;
  }

  /**
   * Check if git repo exists
   */
  static requireGitRepo() {
    if (!isGitRepo()) {
      ui.error('Not a git repository', {
        suggestion: [
          'Initialize a new repository with:',
          '  gittable init',
          '',
          'Or clone an existing repository with:',
          '  gittable clone <url>',
        ],
        exit: true,
      });
    }
  }

  /**
   * Show command header
   */
  static showHeader(commandName, title) {
    const theme = getTheme();
    showBanner(commandName);
    console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary(title))}`);
  }
}

module.exports = BaseCommand;

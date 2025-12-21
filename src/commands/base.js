const clack = require('@clack/prompts');
const chalk = require('chalk');
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
   * Check if git repo exists
   */
  static requireGitRepo() {
    if (!isGitRepo()) {
      clack.cancel(chalk.red('Not a git repository'));
      console.log();
      console.log(`${chalk.gray('├')}  ${chalk.yellow('Tip:')}`);
      console.log(`${chalk.gray('│')}  ${chalk.gray('Initialize a new repository with:')}`);
      console.log(`${chalk.gray('│')}  ${chalk.cyan('  gittable init')}`);
      console.log(chalk.gray('│'));
      console.log(`${chalk.gray('└')}  ${chalk.gray('Or clone an existing repository with:')}`);
      console.log(chalk.gray('    ') + chalk.cyan('  gittable clone <url>'));
      console.log();
      process.exit(1);
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

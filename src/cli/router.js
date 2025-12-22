const prompts = require('../ui/prompts');
const chalk = require('chalk');
const registry = require('../commands/registry');
const { isGitRepo } = require('../core/git');
const { showBanner } = require('../ui/components');
const { saveToHistory } = require('../utils/commands');
const { getTheme } = require('../utils/ui');

/**
 * CLI Router
 * Handles command routing and execution
 */
class Router {
  constructor() {
    this.registry = registry;
  }

  /**
   * Resolve command name to handler
   */
  resolve(commandName) {
    return this.registry.get(commandName);
  }

  /**
   * Check if command exists
   */
  hasCommand(commandName) {
    return this.registry.has(commandName);
  }

  /**
   * Execute a command
   */
  async execute(commandName, args = [], context = {}) {
    const command = this.resolve(commandName);

    if (!command) {
      this.showUnknownCommand(commandName);
      return false;
    }

    // Check if command is enabled based on config (enabledCommands array only)
    try {
      const readConfigFile = require('../core/config/loader');
      const config = readConfigFile();
      if (config) {
        const { isCommandEnabled } = require('../core/config/mode-filter');
        if (!isCommandEnabled(commandName, config)) {
          prompts.cancel(chalk.red(`Command "${commandName}" is not enabled`));
          console.log(chalk.yellow('Edit .gittable.js to enable this command in enabledCommands array.'));
          return false;
        }
      }
    } catch (error) {
      // If config loading fails, continue (backward compatibility)
      // This allows commands to work even without config file
    }

    // Check git repo requirement (except for init, uninit, clone, and internal commands)
    const { NO_REPO_COMMANDS, NO_HISTORY_COMMANDS } = require('../core/constants');
    if (!NO_REPO_COMMANDS.includes(commandName) && !isGitRepo()) {
      this.showNotGitRepo();
      return false;
    }

    try {
      // Save to history (except for help, history itself, and internal commands)
      if (!NO_HISTORY_COMMANDS.includes(commandName) && !commandName.startsWith('__')) {
        saveToHistory(commandName, args);
      }

      // Execute command handler
      await command.handler(args, context);
      return true;
    } catch (error) {
      // Use centralized error handler
      const { handleError } = require('../core/errors');
      const exitCode = handleError(error, { exitCode: 1 });
      return exitCode === 0;
    }
  }

  /**
   * Execute command chain
   */
  async executeChain(commands) {
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      const cmdName = cmd.args[0]?.toLowerCase();
      const cmdArgs = cmd.args.slice(1);

      if (!cmdName) {
        continue;
      }

      const success = await this.execute(cmdName, cmdArgs);

      // For && operator, stop on failure
      if (cmd.operator === '&&' && !success && i < commands.length - 1) {
        prompts.cancel(chalk.red(`Command chain stopped at: ${cmdName}`));
        return false;
      }

      // For | operator, continue even on error
    }

    return true;
  }

  /**
   * Show unknown command error
   */
  showUnknownCommand(commandName) {
    showBanner('GITTABLE', { version: require('../../package.json').version });
    console.log();
    prompts.cancel(chalk.red(`Unknown command: ${chalk.bold(commandName)}`));
    console.log();
    console.log(`${chalk.gray('├')}  ${chalk.yellow('Available commands:')}`);
    console.log(chalk.gray('│'));

    // Show some common commands as suggestions
    const { COMMAND_SUGGESTIONS_LIMIT } = require('../core/constants');
    const theme = getTheme();
    const suggestions = this.registry.getAll().slice(0, COMMAND_SUGGESTIONS_LIMIT);
    for (const cmd of suggestions) {
      console.log(`${chalk.gray('│')}  ${theme.primary(`  ${cmd.name}`)}`);
    }

    console.log(chalk.gray('│'));
    console.log(
      `${chalk.gray('└')}  ${chalk.gray('Run "gittable --help" for full usage information')}`
    );
    console.log();
  }

  /**
   * Show not git repo error
   */
  showNotGitRepo() {
    const theme = getTheme();
    showBanner('GITTABLE', { version: require('../../package.json').version });
    console.log();
    prompts.cancel(chalk.red('Not a git repository'));
    console.log();
    console.log(`${chalk.gray('├')}  ${chalk.yellow('Tip:')}`);
    console.log(`${chalk.gray('│')}  ${chalk.gray('Initialize a new repository with:')}`);
    console.log(`${chalk.gray('│')}  ${theme.primary('  gittable init')}`);
    console.log(chalk.gray('│'));
    console.log(`${chalk.gray('└')}  ${chalk.gray('Or clone an existing repository with:')}`);
    console.log(chalk.gray('    ') + theme.primary('  gittable clone <url>'));
    console.log();
  }
}

/**
 * Singleton Pattern
 * 
 * The Router is exported as a singleton instance to ensure:
 * - Single command routing system across the application
 * - Consistent command execution and error handling
 * - Shared registry access for all routing operations
 * 
 * This singleton is created at module load time and shared across all imports.
 * For testing, consider creating a factory function if fresh instances are needed.
 */
module.exports = new Router();

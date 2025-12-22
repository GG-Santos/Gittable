const prompts = require('../ui/prompts');
const chalk = require('chalk');
const { getTheme } = require('./color-theme');
const { showCommandHeader, requireTTY } = require('./command-helpers');

/**
 * Create an action router for commands with multiple sub-actions
 * This pattern is used in branch.js, remote.js, config.js, etc.
 * @param {object} config - Router configuration
 * @param {string} config.commandName - Command name for banner
 * @param {Array} config.actions - Array of action definitions
 * @param {Function} config.defaultAction - Default action handler (optional)
 * @param {string} config.helpText - Help text for non-TTY mode (optional)
 * @returns {Function} - Command handler function
 */
function createActionRouter(config) {
  const { commandName, actions, defaultAction = null, helpText = null } = config;

  return async (args) => {
    const action = args[0];

    // If no action provided, show interactive menu
    if (!action) {
      showCommandHeader(commandName, `${commandName} Management`);

      if (!process.stdin.isTTY) {
        requireTTY(
          helpText || [
            'This command requires interactive input.',
            'Available actions:',
            ...actions.map((a) => `  - gittable ${commandName.toLowerCase()} ${a.value}`),
          ]
        );
      }

      const selectedAction = await prompts.select({
        message: getTheme().primary('What would you like to do?'),
        options: actions,
      });

      if (prompts.isCancel(selectedAction)) {
        prompts.cancel(chalk.yellow('Cancelled'));
        return;
      }

      // Recursively call with the selected action
      return createActionRouter(config)([selectedAction, ...args.slice(1)]);
    }

    // Find matching action
    const actionDef = actions.find((a) => a.value === action || a.aliases?.includes(action));

    if (actionDef?.handler) {
      if (actionDef.title) {
        showCommandHeader(commandName, actionDef.title);
      }
      await actionDef.handler(args.slice(1));
      if (actionDef.showOutro !== false) {
        prompts.outro(chalk.green.bold('Done'));
      }
      return;
    }

    // Try default action if provided
    if (defaultAction) {
      await defaultAction(args);
      return;
    }

    // Unknown action
    showCommandHeader(commandName, 'Help');
    prompts.cancel(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.yellow('\nAvailable actions:'));
    const theme = getTheme();
    actions.forEach((a) => {
      const aliases = a.aliases ? `, ${a.aliases.join(', ')}` : '';
      console.log(theme.primary(`  ${a.value}${aliases}    - ${a.label}`));
    });
    process.exit(1);
  };
}

module.exports = {
  createActionRouter,
};

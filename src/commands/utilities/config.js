const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/table');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const getScopeFlag = (scope) => {
  return scope === 'global' ? '--global' : scope === 'system' ? '--system' : '--local';
};

const listConfig = (scope = 'local') => {
  const scopeFlag = getScopeFlag(scope);
  const result = execGit(`config ${scopeFlag} --list`, { silent: true });

  if (!result.success || !result.output.trim()) {
    console.log(chalk.dim('No configuration found'));
    return;
  }

  const lines = result.output.trim().split('\n').filter(Boolean);
  const configs = lines.map((line) => {
    const [key, ...valueParts] = line.split('=');
    return {
      key,
      value: valueParts.join('='),
    };
  });

  const rows = configs.map((config) => [chalk.cyan(config.key), config.value]);

  console.log(createTable(['Key', 'Value'], rows));
};

const getConfig = async (args, scope = 'local') => {
  let key = args[0];

  if (!key) {
    const theme = getTheme();
    key = await clack.text({
      message: theme.primary('Config key:'),
      placeholder: 'user.name',
    });

    if (handleCancel(key)) return;
  }

  const scopeFlag = getScopeFlag(scope);
  const result = execGit(`config ${scopeFlag} --get ${key}`, { silent: true });

  if (result.success) {
    console.log(chalk.green(result.output.trim()));
  } else {
    clack.cancel(chalk.yellow(`Config key "${key}" not found`));
  }
};

const setConfig = async (args, scope = 'local') => {
  let key = args[0];
  let value = args[1];

  if (!key) {
    const theme = getTheme();
    key = await clack.text({
      message: theme.primary('Config key:'),
      placeholder: 'user.name',
    });

    if (handleCancel(key)) return;
  }

  if (!value) {
    const theme = getTheme();
    value = await clack.text({
      message: theme.primary('Config value:'),
      placeholder: 'John Doe',
    });

    if (handleCancel(value)) return;
  }

  const scopeFlag = getScopeFlag(scope);
  await execGitWithSpinner(`config ${scopeFlag} ${key} "${value}"`, {
    spinnerText: `Setting config ${key}`,
    successMessage: `Config ${key} set to ${value}`,
    errorMessage: 'Failed to set config',
    silent: true,
  });
};

const unsetConfig = async (args, scope = 'local') => {
  let key = args[0];

  if (!key) {
    const theme = getTheme();
    key = await clack.text({
      message: theme.primary('Config key to unset:'),
      placeholder: 'user.name',
    });

    if (handleCancel(key)) return;
  }

  const confirmed = await promptConfirm(`Unset config ${key}?`, false);
  if (!confirmed) return;

  const scopeFlag = getScopeFlag(scope);
  await execGitWithSpinner(`config ${scopeFlag} --unset ${key}`, {
    spinnerText: `Unsetting config ${key}`,
    successMessage: `Config ${key} unset`,
    errorMessage: 'Failed to unset config',
    silent: true,
  });
};

module.exports = async (args) => {
  const action = args[0];
  const global = args.includes('--global') || args.includes('-g');
  const system = args.includes('--system') || args.includes('-s');
  let scope = global ? 'global' : system ? 'system' : 'local';

  // If action looks like a key=value, treat as set
  if (action?.includes('=')) {
    const [key, ...valueParts] = action.split('=');
    showCommandHeader('CONFIG', 'Set Config');
    await setConfig([key, valueParts.join('=')], scope);
    return;
  }

  // Interactive mode: if no action provided, prompt for action and scope
  // Only go interactive if no action is provided (not if 'list' is explicitly given)
  if (!action) {
    // Show interactive menu only if no scope flags are provided
    if (!global && !system) {
      showCommandHeader('CONFIG', 'Git Configuration');

      // First, ask for action
      const theme = getTheme();
      const selectedAction = await clack.select({
        message: theme.primary('What would you like to do?'),
        options: [
          {
            value: 'list',
            label: chalk.green('List') + chalk.gray(' - Show all config settings'),
          },
          {
            value: 'get',
            label: chalk.blue('Get') + chalk.gray(' - Get a specific config value'),
          },
          {
            value: 'set',
            label: chalk.yellow('Set') + chalk.gray(' - Set a config value'),
          },
          {
            value: 'unset',
            label: chalk.red('Unset') + chalk.gray(' - Remove a config setting'),
          },
        ],
      });

      if (handleCancel(selectedAction)) return;

      // Then, ask for scope
      const selectedScope = await clack.select({
        message: theme.primary('Select scope:'),
        options: [
          {
            value: 'local',
            label: chalk.green('Local') + chalk.gray(' - Repository-specific'),
            hint: 'Default',
          },
          {
            value: 'global',
            label: chalk.blue('Global') + chalk.gray(' - User-wide'),
          },
          {
            value: 'system',
            label: chalk.yellow('System') + chalk.gray(' - System-wide'),
          },
        ],
        initialValue: 'local',
      });

      if (handleCancel(selectedScope)) return;

      scope = selectedScope;

      // Execute the selected action
      if (selectedAction === 'list') {
        showCommandHeader('CONFIG', `Config List (${scope})`);
        listConfig(scope);
        clack.outro(chalk.green.bold('Done'));
        return;
      }

      if (selectedAction === 'get') {
        showCommandHeader('CONFIG', 'Get Config');
        await getConfig([], scope);
        clack.outro(chalk.green.bold('Done'));
        return;
      }

      if (selectedAction === 'set') {
        showCommandHeader('CONFIG', 'Set Config');
        await setConfig([], scope);
        return;
      }

      if (selectedAction === 'unset') {
        showCommandHeader('CONFIG', 'Unset Config');
        await unsetConfig([], scope);
        return;
      }
    } else {
      // Non-interactive: list with provided scope
      showCommandHeader('CONFIG', `Config List (${scope})`);
      listConfig(scope);
      clack.outro(chalk.green.bold('Done'));
      return;
    }
  }

  // Handle explicit 'list' or 'ls' action
  if (action === 'list' || action === 'ls') {
    showCommandHeader('CONFIG', `Config List (${scope})`);
    listConfig(scope);
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'get') {
    showCommandHeader('CONFIG', 'Get Config');
    await getConfig(args.slice(1), scope);
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'set') {
    showCommandHeader('CONFIG', 'Set Config');
    await setConfig(args.slice(1), scope);
    return;
  }

  if (action === 'unset' || action === 'remove' || action === 'rm') {
    showCommandHeader('CONFIG', 'Unset Config');
    await unsetConfig(args.slice(1), scope);
    return;
  }

  // Default: get config
  showCommandHeader('CONFIG', 'Get Config');
  await getConfig([action], scope);
  clack.outro(chalk.green.bold('Done'));
};

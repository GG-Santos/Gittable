const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/components');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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
    key = await ui.prompt.text({
      message: 'Config key:',
      placeholder: 'user.name',
    });

    if (key === null) return;
  }

  const scopeFlag = getScopeFlag(scope);
  const result = execGit(`config ${scopeFlag} --get ${key}`, { silent: true });

  if (result.success) {
    const theme = getTheme();
    console.log(theme.success(result.output.trim()));
  } else {
    ui.warn(`Config key "${key}" not found`);
  }
};

const setConfig = async (args, scope = 'local') => {
  let key = args[0];
  let value = args[1];

  if (!key) {
    key = await ui.prompt.text({
      message: 'Config key:',
      placeholder: 'user.name',
    });

    if (key === null) return;
  }

  if (!value) {
    value = await ui.prompt.text({
      message: 'Config value:',
      placeholder: 'John Doe',
    });

    if (value === null) return;
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
    key = await ui.prompt.text({
      message: 'Config key to unset:',
      placeholder: 'user.name',
    });

    if (key === null) return;
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
      const selectedAction = await ui.prompt.select({
        message: 'What would you like to do?',
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

      if (selectedAction === null) return;

      // Then, ask for scope
      const selectedScope = await ui.prompt.select({
        message: 'Select scope:',
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

      if (selectedScope === null) return;

      scope = selectedScope;

      // Execute the selected action
      if (selectedAction === 'list') {
        showCommandHeader('CONFIG', `Config List (${scope})`);
        listConfig(scope);
        ui.success('Done');
        return;
      }

      if (selectedAction === 'get') {
        showCommandHeader('CONFIG', 'Get Config');
        await getConfig([], scope);
        ui.success('Done');
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
      ui.success('Done');
      return;
    }
  }

  // Handle explicit 'list' or 'ls' action
  if (action === 'list' || action === 'ls') {
    showCommandHeader('CONFIG', `Config List (${scope})`);
    listConfig(scope);
    ui.success('Done');
    return;
  }

  if (action === 'get') {
    showCommandHeader('CONFIG', 'Get Config');
    await getConfig(args.slice(1), scope);
    ui.success('Done');
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
  ui.success('Done');
};

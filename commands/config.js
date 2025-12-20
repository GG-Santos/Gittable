const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showCommandHeader, execGitWithSpinner, handleCancel, promptConfirm } = require('../lib/utils/command-helpers');

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

  console.log(`\n${createTable(['Key', 'Value'], rows)}`);
};

const getConfig = async (args, scope = 'local') => {
  let key = args[0];
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
    key = await clack.text({
      message: chalk.cyan('Config key:'),
      placeholder: 'user.name',
    });

    if (handleCancel(key)) return;
  }

  if (!value) {
    value = await clack.text({
      message: chalk.cyan('Config value:'),
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
    key = await clack.text({
      message: chalk.cyan('Config key to unset:'),
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
  const scope = global ? 'global' : system ? 'system' : 'local';

  // If action looks like a key=value, treat as set
  if (action && action.includes('=')) {
    const [key, ...valueParts] = action.split('=');
    showCommandHeader('CONFIG', 'Set Config');
    await setConfig([key, valueParts.join('=')], scope);
    return;
  }

  if (!action || action === 'list' || action === 'ls') {
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

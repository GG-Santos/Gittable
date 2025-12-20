const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showBanner } = require('../lib/ui/banner');

const listConfig = (scope = 'local') => {
  const scopeFlag = scope === 'global' ? '--global' : scope === 'system' ? '--system' : '--local';
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

const getConfig = async (key, scope = 'local') => {
  const scopeFlag = scope === 'global' ? '--global' : scope === 'system' ? '--system' : '--local';
  const result = execGit(`config ${scopeFlag} --get ${key}`, { silent: true });

  if (result.success) {
    console.log(chalk.green(result.output.trim()));
  } else {
    clack.cancel(chalk.yellow(`Config key "${key}" not found`));
  }
};

const setConfig = async (key, value, scope = 'local') => {
  if (!key) {
    key = await clack.text({
      message: chalk.cyan('Config key:'),
      placeholder: 'user.name',
    });

    if (clack.isCancel(key)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  if (!value) {
    value = await clack.text({
      message: chalk.cyan('Config value:'),
      placeholder: 'John Doe',
    });

    if (clack.isCancel(value)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Setting config ${key}`);

  const scopeFlag = scope === 'global' ? '--global' : scope === 'system' ? '--system' : '--local';
  const result = execGit(`config ${scopeFlag} ${key} "${value}"`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Config ${key} set to ${value}`));
  } else {
    clack.cancel(chalk.red('Failed to set config'));
    console.error(result.error);
    process.exit(1);
  }
};

const unsetConfig = async (key, scope = 'local') => {
  if (!key) {
    key = await clack.text({
      message: chalk.cyan('Config key to unset:'),
      placeholder: 'user.name',
    });

    if (clack.isCancel(key)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const confirm = await clack.confirm({
    message: chalk.yellow(`Unset config ${key}?`),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Unsetting config ${key}`);

  const scopeFlag = scope === 'global' ? '--global' : scope === 'system' ? '--system' : '--local';
  const result = execGit(`config ${scopeFlag} --unset ${key}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Config ${key} unset`));
  } else {
    clack.cancel(chalk.red('Failed to unset config'));
    console.error(result.error);
    process.exit(1);
  }
};

module.exports = async (args) => {
  const action = args[0];
  const global = args.includes('--global') || args.includes('-g');
  const system = args.includes('--system') || args.includes('-s');
  const scope = global ? 'global' : system ? 'system' : 'local';

  if (!action || action === 'list' || action === 'ls') {
    showBanner('CONFIG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold(`Config List (${scope})`)}`);
    listConfig(scope);
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'get') {
    showBanner('CONFIG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Get Config')}`);
    await getConfig(args[1], scope);
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'set') {
    showBanner('CONFIG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Set Config')}`);
    await setConfig(args[1], args[2], scope);
    return;
  }

  if (action === 'unset' || action === 'remove' || action === 'rm') {
    showBanner('CONFIG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Unset Config')}`);
    await unsetConfig(args[1], scope);
    return;
  }

  // If action looks like a key=value, treat as set
  if (action.includes('=')) {
    const [key, ...valueParts] = action.split('=');
    showBanner('CONFIG');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Set Config')}`);
    await setConfig(key, valueParts.join('='), scope);
    return;
  }

  // Default: get config
  showBanner('CONFIG');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Get Config')}`);
  await getConfig(action, scope);
  clack.outro(chalk.green.bold('Done'));
};

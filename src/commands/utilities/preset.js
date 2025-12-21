const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader, handleCancel, promptConfirm } = require('../../utils/command-helpers');
const {
  listPresets,
  loadPreset,
  savePreset,
  deletePreset,
  getDefaultPresets,
} = require('../../utils/workflow-presets');
const { getTheme } = require('../../utils/color-theme');

/**
 * Preset management command
 */
module.exports = async (args) => {
  const action = args[0];

  if (!action || action === 'list' || action === 'ls') {
    showCommandHeader('PRESET', 'List Presets');
    const presets = listPresets();
    const defaults = getDefaultPresets();

    console.log(chalk.cyan('\nDefault presets:'));
    Object.keys(defaults).forEach((name) => {
      const preset = defaults[name];
      console.log(chalk.green(`  • ${name}`) + chalk.dim(` - ${preset.description}`));
    });

    if (presets.length > 0) {
      console.log(chalk.cyan('\nCustom presets:'));
      presets.forEach((name) => {
        const preset = loadPreset(name);
        if (preset) {
          console.log(chalk.green(`  • ${name}`) + chalk.dim(` - ${preset.commands.join(' → ')}`));
        }
      });
    } else {
      console.log(chalk.dim('\nNo custom presets saved'));
    }

    console.log(chalk.dim('\nCreate one with: gittable preset save <name>'));
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'save') {
    showCommandHeader('PRESET', 'Save Preset');
    let name = args[1];
    let commands = args.slice(2);

    if (!name) {
      const theme = getTheme();
      name = await clack.text({
        message: theme.primary('Preset name:'),
        placeholder: 'feature',
      });
      if (handleCancel(name)) return;
    }

    if (commands.length === 0) {
      const theme = getTheme();
      const commandInput = await clack.text({
        message: theme.primary('Commands (space-separated):'),
        placeholder: 'add commit push',
      });
      if (handleCancel(commandInput)) return;
      commands = commandInput.split(/\s+/).filter(Boolean);
    }

    if (commands.length === 0) {
      clack.cancel(chalk.red('No commands provided'));
      return;
    }

    savePreset(name, commands);
    clack.outro(chalk.green.bold(`Preset "${name}" saved`));
    return;
  }

  if (action === 'load' || action === 'get') {
    showCommandHeader('PRESET', 'Load Preset');
    let name = args[1];

    if (!name) {
      const presets = listPresets();
      const defaults = getDefaultPresets();
      const allPresets = [...Object.keys(defaults), ...presets];

      if (allPresets.length === 0) {
        clack.cancel(chalk.yellow('No presets available'));
        return;
      }

      const theme = getTheme();
      name = await clack.select({
        message: theme.primary('Select preset:'),
        options: allPresets.map((p) => ({ value: p, label: p })),
      });
      if (handleCancel(name)) return;
    }

    const preset = loadPreset(name);
    const defaults = getDefaultPresets();
    const defaultPreset = defaults[name];

    if (!preset && !defaultPreset) {
      clack.cancel(chalk.red(`Preset "${name}" not found`));
      return;
    }

    const selectedPreset = preset || defaultPreset;
    console.log(chalk.cyan(`\nPreset "${name}":`));
    console.log(chalk.green(`Commands: ${selectedPreset.commands.join(' → ')}`));
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'delete' || action === 'remove' || action === 'rm') {
    showCommandHeader('PRESET', 'Delete Preset');
    let name = args[1];

    if (!name) {
      const presets = listPresets();
      if (presets.length === 0) {
        clack.cancel(chalk.yellow('No custom presets available'));
        return;
      }

      const theme = getTheme();
      name = await clack.select({
        message: theme.primary('Select preset to delete:'),
        options: presets.map((p) => ({ value: p, label: p })),
      });
      if (handleCancel(name)) return;
    }

    const confirmed = await promptConfirm(`Delete preset "${name}"?`, false);
    if (!confirmed) return;

    if (deletePreset(name)) {
      clack.outro(chalk.green.bold(`Preset "${name}" deleted`));
    } else {
      clack.cancel(chalk.red(`Preset "${name}" not found`));
    }
    return;
  }

  if (action === 'run' || action === 'execute') {
    showCommandHeader('PRESET', 'Run Preset');
    let name = args[1];

    if (!name) {
      const presets = listPresets();
      const defaults = getDefaultPresets();
      const allPresets = [...Object.keys(defaults), ...presets];

      if (allPresets.length === 0) {
        clack.cancel(chalk.yellow('No presets available'));
        return;
      }

      const theme = getTheme();
      name = await clack.select({
        message: theme.primary('Select preset to run:'),
        options: allPresets.map((p) => ({ value: p, label: p })),
      });
      if (handleCancel(name)) return;
    }

    const preset = loadPreset(name);
    const defaults = getDefaultPresets();
    const defaultPreset = defaults[name];

    if (!preset && !defaultPreset) {
      clack.cancel(chalk.red(`Preset "${name}" not found`));
      return;
    }

    const selectedPreset = preset || defaultPreset;
    clack.note(`Running preset: ${chalk.cyan(name)}`, chalk.dim('Workflow'));
    console.log(chalk.dim(`Commands: ${selectedPreset.commands.join(' → ')}`));

    // Execute commands sequentially via gittable CLI
    const { execSync } = require('node:child_process');
    for (const cmd of selectedPreset.commands) {
      clack.note(`Executing: ${chalk.cyan(cmd)}`, chalk.dim('Step'));
      try {
        execSync(`gittable ${cmd}`, { stdio: 'inherit' });
      } catch (error) {
        clack.cancel(chalk.red(`Failed at step: ${cmd}`));
        return;
      }
    }

    clack.outro(chalk.green.bold(`Preset "${name}" completed`));
    return;
  }

  // Default: try to run preset
  showCommandHeader('PRESET', 'Run Preset');
  const preset = loadPreset(action);
  const defaults = getDefaultPresets();
  const defaultPreset = defaults[action];

  if (!preset && !defaultPreset) {
    clack.cancel(chalk.red(`Preset "${action}" not found`));
    return;
  }

  clack.note(
    `Preset "${action}" found. Use 'gittable preset run ${action}' to execute.`,
    chalk.dim('Info')
  );
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
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
    ui.success('Done');
    return;
  }

  if (action === 'save') {
    showCommandHeader('PRESET', 'Save Preset');
    let name = args[1];
    let commands = args.slice(2);

    if (!name) {
      name = await ui.prompt.text({
        message: 'Preset name:',
        placeholder: 'feature',
      });
      if (name === null) return;
    }

    if (commands.length === 0) {
      const commandInput = await ui.prompt.text({
        message: 'Commands (space-separated):',
        placeholder: 'add commit push',
      });
      if (commandInput === null) return;
      commands = commandInput.split(/\s+/).filter(Boolean);
    }

    if (commands.length === 0) {
      ui.error('No commands provided', { exit: true });
    }

    savePreset(name, commands);
    ui.success(`Preset "${name}" saved`);
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
        ui.warn('No presets available');
        return;
      }

      name = await ui.prompt.select({
        message: 'Select preset:',
        options: allPresets.map((p) => ({ value: p, label: p })),
      });
      if (name === null) return;
    }

    const preset = loadPreset(name);
    const defaults = getDefaultPresets();
    const defaultPreset = defaults[name];

    if (!preset && !defaultPreset) {
      ui.error(`Preset "${name}" not found`, { exit: true });
    }

    const selectedPreset = preset || defaultPreset;
    console.log(chalk.cyan(`\nPreset "${name}":`));
    console.log(chalk.green(`Commands: ${selectedPreset.commands.join(' → ')}`));
    ui.success('Done');
    return;
  }

  if (action === 'delete' || action === 'remove' || action === 'rm') {
    showCommandHeader('PRESET', 'Delete Preset');
    let name = args[1];

    if (!name) {
      const presets = listPresets();
      if (presets.length === 0) {
        ui.warn('No custom presets available');
        return;
      }

      name = await ui.prompt.select({
        message: 'Select preset to delete:',
        options: presets.map((p) => ({ value: p, label: p })),
      });
      if (name === null) return;
    }

    const confirmed = await promptConfirm(`Delete preset "${name}"?`, false);
    if (!confirmed) return;

    if (deletePreset(name)) {
      ui.success(`Preset "${name}" deleted`);
    } else {
      ui.error(`Preset "${name}" not found`, { exit: true });
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
        ui.warn('No presets available');
        return;
      }

      name = await ui.prompt.select({
        message: 'Select preset to run:',
        options: allPresets.map((p) => ({ value: p, label: p })),
      });
      if (name === null) return;
    }

    const preset = loadPreset(name);
    const defaults = getDefaultPresets();
    const defaultPreset = defaults[name];

    if (!preset && !defaultPreset) {
      ui.error(`Preset "${name}" not found`, { exit: true });
    }

    const selectedPreset = preset || defaultPreset;
    ui.info(`Running preset: ${name}`, 'Workflow');
    const theme = getTheme();
    console.log(theme.dim(`Commands: ${selectedPreset.commands.join(' → ')}`));

    // Execute commands sequentially via gittable CLI
    const { execSync } = require('node:child_process');
    for (const cmd of selectedPreset.commands) {
      ui.info(`Executing: ${cmd}`, 'Step');
      try {
        execSync(`gittable ${cmd}`, { stdio: 'inherit' });
      } catch (error) {
        ui.error(`Failed at step: ${cmd}`, { exit: true });
      }
    }

    ui.success(`Preset "${name}" completed`);
    return;
  }

  // Default: try to run preset
  showCommandHeader('PRESET', 'Run Preset');
  const preset = loadPreset(action);
  const defaults = getDefaultPresets();
  const defaultPreset = defaults[action];

  if (!preset && !defaultPreset) {
    ui.error(`Preset "${action}" not found`, { exit: true });
  }

  ui.info(
    `Preset "${action}" found. Use 'gittable preset run ${action}' to execute.`,
    'Info'
  );
};

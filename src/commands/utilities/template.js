const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader, handleCancel, promptConfirm } = require('../../utils/command-helpers');
const {
  listTemplates,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
} = require('../../utils/commit-templates');
const { getTheme } = require('../../utils/color-theme');

/**
 * Template management command
 */
module.exports = async (args) => {
  const action = args[0];

  if (!action || action === 'list' || action === 'ls') {
    showCommandHeader('TEMPLATE', 'List Templates');
    const templates = listTemplates();

    if (templates.length === 0) {
      console.log(chalk.dim('No templates saved'));
      console.log(chalk.dim('\nCreate one with: gittable template save <name>'));
      ui.success('Done');
      return;
    }

    console.log(chalk.cyan(`\nSaved templates (${templates.length}):`));
    templates.forEach((name) => {
      console.log(chalk.green(`  • ${name}`));
    });
    ui.success('Done');
    return;
  }

  if (action === 'save') {
    showCommandHeader('TEMPLATE', 'Save Template');
    let name = args[1];
    let content = args.slice(2).join(' ');

    if (!name) {
      name = await ui.prompt.text({
        message: 'Template name:',
        placeholder: 'feature',
      });
      if (name === null) return;
    }

    if (!content) {
      content = await ui.prompt.text({
        message: 'Template content:',
        placeholder: 'feat({scope}): {description}',
        initialValue: content || '',
      });
      if (content === null) return;
    }

    saveTemplate(name, content);
    ui.success(`Template "${name}" saved`);
    return;
  }

  if (action === 'load' || action === 'get') {
    showCommandHeader('TEMPLATE', 'Load Template');
    let name = args[1];

    if (!name) {
      const templates = listTemplates();
      if (templates.length === 0) {
        ui.warn('No templates available');
        return;
      }

      name = await ui.prompt.select({
        message: 'Select template:',
        options: templates.map((t) => ({ value: t, label: t })),
      });
      if (name === null) return;
    }

    const template = loadTemplate(name);
    if (!template) {
      ui.error(`Template "${name}" not found`, { exit: true });
    }

    console.log(chalk.cyan(`\nTemplate "${name}":`));
    console.log(chalk.green(template));
    ui.success('Done');
    return;
  }

  if (action === 'delete' || action === 'remove' || action === 'rm') {
    showCommandHeader('TEMPLATE', 'Delete Template');
    let name = args[1];

    if (!name) {
      const templates = listTemplates();
      if (templates.length === 0) {
        ui.warn('No templates available');
        return;
      }

      name = await ui.prompt.select({
        message: 'Select template to delete:',
        options: templates.map((t) => ({ value: t, label: t })),
      });
      if (name === null) return;
    }

    const confirmed = await promptConfirm(`Delete template "${name}"?`, false);
    if (!confirmed) return;

    if (deleteTemplate(name)) {
      ui.success(`Template "${name}" deleted`);
    } else {
      ui.error(`Template "${name}" not found`, { exit: true });
    }
    return;
  }

  // Default: try to load template
  showCommandHeader('TEMPLATE', 'Load Template');
  const template = loadTemplate(action);
  if (template) {
    console.log(chalk.cyan(`\nTemplate "${action}":`));
    console.log(chalk.green(template));
    ui.success('Done');
  } else {
    ui.error(`Template "${action}" not found`, { exit: true });
  }
};

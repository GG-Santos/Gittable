const clack = require('@clack/prompts');
const chalk = require('chalk');
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
      clack.outro(chalk.green.bold('Done'));
      return;
    }

    console.log(chalk.cyan(`\nSaved templates (${templates.length}):`));
    templates.forEach((name) => {
      console.log(chalk.green(`  • ${name}`));
    });
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'save') {
    showCommandHeader('TEMPLATE', 'Save Template');
    let name = args[1];
    let content = args.slice(2).join(' ');

    if (!name) {
      const theme = getTheme();
      name = await clack.text({
        message: theme.primary('Template name:'),
        placeholder: 'feature',
      });
      if (handleCancel(name)) return;
    }

    if (!content) {
      const theme = getTheme();
      content = await clack.text({
        message: theme.primary('Template content:'),
        placeholder: 'feat({scope}): {description}',
        initialValue: content || '',
      });
      if (handleCancel(content)) return;
    }

    saveTemplate(name, content);
    clack.outro(chalk.green.bold(`Template "${name}" saved`));
    return;
  }

  if (action === 'load' || action === 'get') {
    showCommandHeader('TEMPLATE', 'Load Template');
    let name = args[1];

    if (!name) {
      const templates = listTemplates();
      if (templates.length === 0) {
        clack.cancel(chalk.yellow('No templates available'));
        return;
      }

      const theme = getTheme();
      name = await clack.select({
        message: theme.primary('Select template:'),
        options: templates.map((t) => ({ value: t, label: t })),
      });
      if (handleCancel(name)) return;
    }

    const template = loadTemplate(name);
    if (!template) {
      clack.cancel(chalk.red(`Template "${name}" not found`));
      return;
    }

    console.log(chalk.cyan(`\nTemplate "${name}":`));
    console.log(chalk.green(template));
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'delete' || action === 'remove' || action === 'rm') {
    showCommandHeader('TEMPLATE', 'Delete Template');
    let name = args[1];

    if (!name) {
      const templates = listTemplates();
      if (templates.length === 0) {
        clack.cancel(chalk.yellow('No templates available'));
        return;
      }

      const theme = getTheme();
      name = await clack.select({
        message: theme.primary('Select template to delete:'),
        options: templates.map((t) => ({ value: t, label: t })),
      });
      if (handleCancel(name)) return;
    }

    const confirmed = await promptConfirm(`Delete template "${name}"?`, false);
    if (!confirmed) return;

    if (deleteTemplate(name)) {
      clack.outro(chalk.green.bold(`Template "${name}" deleted`));
    } else {
      clack.cancel(chalk.red(`Template "${name}" not found`));
    }
    return;
  }

  // Default: try to load template
  showCommandHeader('TEMPLATE', 'Load Template');
  const template = loadTemplate(action);
  if (template) {
    console.log(chalk.cyan(`\nTemplate "${action}":`));
    console.log(chalk.green(template));
    clack.outro(chalk.green.bold('Done'));
  } else {
    clack.cancel(chalk.red(`Template "${action}" not found`));
  }
};

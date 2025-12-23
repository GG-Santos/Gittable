const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showBanner } = require('../../ui/components/banner');
const { createLink, getTheme } = require('../../utils/ui');
const router = require('../../cli/router');
const readConfigFile = require('../../core/config/loader');
const { isCommandEnabled } = require('../../core/config/mode-filter');
const VERSION = require('../../../package.json').version;

/**
 * Command help system
 */
const COMMAND_HELP = {
  add: {
    description: 'Stage files for commit',
    usage: 'gittable add [files...]',
    aliases: [],
    examples: [
      'gittable add',
      'gittable add file1.js file2.js',
      'gittable add --all',
      'gittable add --unstage file1.js',
    ],
  },
  commit: {
    description: 'Create commits with conventional format (includes staging, preview, and push/sync options)',
    usage: 'gittable commit [options]',
    aliases: ['ci', 'save'],
    examples: ['gittable commit', 'gittable commit -a', 'gittable commit --amend'],
  },
  push: {
    description: 'Push to remote repository',
    usage: 'gittable push [remote] [branch]',
    aliases: ['ps', 'up'],
    examples: ['gittable push', 'gittable push origin main', 'gittable push --force'],
  },
  pull: {
    description: 'Fetch and merge from remote (use --rebase for rebase instead of merge)',
    usage: 'gittable pull [remote] [branch] [--rebase]',
    aliases: ['pl', 'down'],
    examples: ['gittable pull', 'gittable pull origin main', 'gittable pull --rebase'],
  },
  status: {
    description: 'Show repository status',
    usage: 'gittable status',
    aliases: ['st', 's'],
    examples: ['gittable status', 'gittable st'],
  },
  branch: {
    description: 'Branch management',
    usage: 'gittable branch [action] [name]',
    aliases: ['br'],
    examples: [
      'gittable branch',
      'gittable branch create feature/new',
      'gittable branch delete old-branch',
    ],
  },
  stash: {
    description: 'Stash management',
    usage: 'gittable stash [action]',
    aliases: [],
    examples: [
      'gittable stash',
      'gittable stash create "WIP: feature"',
      'gittable stash apply 0',
      'gittable stash pop',
    ],
  },
};

/**
 * Get workflow map - task-based organization
 * Maps commands to workflow groups and task-based subcategories
 */
function getWorkflowMap() {
  return {
    startingProject: {
      label: 'Starting a Project',
      description: 'Initialize repositories and configure Git',
      subcategories: {
        initialize: 'Initialize Repository',
        configuration: 'Configuration',
      },
    },
    dailyDevelopment: {
      label: 'Daily Development',
      description: 'Check status, stage files, and create commits',
      subcategories: {
        checkStatus: 'Check Status',
        stageFiles: 'Stage Files',
        createCommits: 'Create Commits',
        previewChanges: 'Preview Changes',
      },
    },
    collaboration: {
      label: 'Collaboration',
      description: 'Push, pull, sync, and manage branches',
      subcategories: {
        remoteOps: 'Remote Operations',
        branchManagement: 'Branch Management',
        advancedBranching: 'Advanced Branching',
      },
    },
    historyInspection: {
      label: 'History & Inspection',
      description: 'View history, search, and inspect repository',
      subcategories: {
        viewHistory: 'View History',
        searchAnalyze: 'Search & Analyze',
        repositoryState: 'Repository State',
      },
    },
    advancedOperations: {
      label: 'Advanced Operations',
      description: 'Undo, stash, merge conflicts, and debugging',
      subcategories: {
        undoRecovery: 'Undo & Recovery',
        stashOps: 'Stash Operations',
        mergeConflicts: 'Merge Conflicts',
        debugging: 'Debugging',
      },
    },
    maintenanceUtilities: {
      label: 'Maintenance & Utilities',
      description: 'File operations, repository management, and utilities',
      subcategories: {
        fileOps: 'File Operations',
        repoManagement: 'Repository Management',
        tagging: 'Tagging',
        quickActions: 'Quick Actions',
        undo: 'Undo & Recovery',
        inspection: 'Inspection',
      },
    },
    gittableSettings: {
      label: 'Gittable Settings',
      description: 'Configure Gittable appearance and behavior',
      subcategories: null,
    },
  };
}

/**
 * Map command from category/subcategory to workflow/subcategory
 */
function mapCommandToWorkflow(commandName, category, subcategory) {
  // Special handling for settings commands
  if (category === 'utilities' && subcategory === 'settings') {
    // Map all settings commands directly to gittableSettings workflow (no subcategory)
    return { workflow: 'gittableSettings', subcategory: null };
  }

  if (category === 'workflow') {
    if (subcategory === 'commit') {
      return { workflow: 'dailyDevelopment', subcategory: 'createCommits' };
    }
    if (subcategory === 'remote') {
      return { workflow: 'collaboration', subcategory: 'remoteOps' };
    }
    return { workflow: 'dailyDevelopment', subcategory: 'createCommits' };
  }

  if (category === 'utilities') {
    if (commandName === 'diff-preview' || commandName === 'preview-diff') {
      return { workflow: 'dailyDevelopment', subcategory: 'previewChanges' };
    }
    if (commandName === 'stash' || commandName === 'stash-all') {
      return { workflow: 'advancedOperations', subcategory: 'stashOps' };
    }
    if (commandName === 'bisect') {
      return { workflow: 'advancedOperations', subcategory: 'debugging' };
    }
    if (subcategory === 'undo') {
      return { workflow: 'advancedOperations', subcategory: 'undoRecovery' };
    }
    if (subcategory === 'fileOps') {
      return { workflow: 'maintenanceUtilities', subcategory: 'fileOps' };
    }
    if (subcategory === 'tagging') {
      return { workflow: 'maintenanceUtilities', subcategory: 'tagging' };
    }
    if (subcategory === 'inspection') {
      return { workflow: 'historyInspection', subcategory: 'repositoryState' };
    }
    if (subcategory === 'commit') {
      return { workflow: 'dailyDevelopment', subcategory: 'previewChanges' };
    }
    return { workflow: 'maintenanceUtilities', subcategory: 'quickActions' };
  }

  if (category === 'core') {
    if (subcategory === 'history') {
      if (commandName === 'log' || commandName === 'show') {
        return { workflow: 'historyInspection', subcategory: 'viewHistory' };
      }
      return { workflow: 'historyInspection', subcategory: 'viewHistory' };
    }
    if (subcategory === 'statusChanges') {
      return { workflow: 'dailyDevelopment', subcategory: 'checkStatus' };
    }
    if (subcategory === 'commit') {
      return { workflow: 'dailyDevelopment', subcategory: 'createCommits' };
    }
    return { workflow: 'dailyDevelopment', subcategory: 'checkStatus' };
  }

  if (category === 'branching') {
    if (commandName === 'mergetool' || commandName === 'merge-continue' || commandName === 'merge-abort') {
      return { workflow: 'advancedOperations', subcategory: 'mergeConflicts' };
    }
    if (subcategory === 'advancedBranching') {
      return { workflow: 'collaboration', subcategory: 'advancedBranching' };
    }
    return { workflow: 'collaboration', subcategory: 'branchManagement' };
  }

  if (category === 'remote') {
    return { workflow: 'collaboration', subcategory: 'remoteOps' };
  }

  if (category === 'history') {
    if (commandName === 'blame' || commandName === 'grep' || commandName === 'range-diff') {
      return { workflow: 'historyInspection', subcategory: 'searchAnalyze' };
    }
    return { workflow: 'historyInspection', subcategory: 'viewHistory' };
  }

  if (category === 'repository') {
    if (subcategory === 'repo') {
      return { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' };
    }
    return { workflow: 'startingProject', subcategory: 'initialize' };
  }

  return { workflow: 'maintenanceUtilities', subcategory: 'quickActions' };
}

/**
 * Get commands by workflow and subcategory, filtered by config
 */
function getCommandsByWorkflow(workflow, subcategory = null, config = null) {
  const allCommands = router.registry.getAll();
  const filtered = allCommands.filter((cmd) => {
    const mapping = mapCommandToWorkflow(cmd.name, cmd.category, cmd.subcategory);
    if (!mapping || mapping.workflow !== workflow) {
      return false;
    }

    // If subcategory is specified, only match commands with that subcategory
    // If subcategory is null, only match commands with null subcategory
    if (subcategory !== null) {
      if (mapping.subcategory !== subcategory) {
        return false;
      }
    } else {
      // When subcategory is null, only match commands that also have null subcategory
      if (mapping.subcategory !== null) {
        return false;
      }
    }

    if (config) {
      return isCommandEnabled(cmd.name, config);
    }

    return true;
  });

  return filtered;
}

/**
 * Check if a workflow has any enabled commands
 */
function hasEnabledWorkflowCommands(workflow, config, workflowMap) {
  const workflowInfo = workflowMap[workflow];
  if (!workflowInfo) return false;

  if (workflowInfo.subcategories) {
    for (const subKey of Object.keys(workflowInfo.subcategories)) {
      const commands = getCommandsByWorkflow(workflow, subKey, config);
      if (commands.length > 0) {
        return true;
      }
    }
  } else {
    const commands = getCommandsByWorkflow(workflow, null, config);
    if (commands.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Show help menu with workflow-based structure (list all commands)
 */
function showListCommands() {
  const config = readConfigFile();
  const workflowMap = getWorkflowMap();

  showBanner('GITTABLE', { version: VERSION });

  const theme = getTheme();
  const repoLink = createLink('GitHub', 'https://github.com/GG-Santos/Gittable');
  console.log(`${chalk.gray('├')}  ${chalk.dim(repoLink)}`);
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Modern Git CLI with Interactive Prompts'))}`);
  console.log(
    `${chalk.gray('├')}  ${chalk.yellow('Usage:')} ${chalk.white('gittable <command> [options]')}`
  );
  console.log(chalk.gray('│'));

  const workflowOrder = Object.keys(workflowMap);

  for (const workflowKey of workflowOrder) {
    const workflowInfo = workflowMap[workflowKey];
    if (!workflowInfo) continue;

    if (!hasEnabledWorkflowCommands(workflowKey, config, workflowMap)) {
      continue;
    }

    const workflowName = workflowInfo.label;
    const hasSubcategories = workflowInfo.subcategories != null && typeof workflowInfo.subcategories === 'object';

    if (hasSubcategories) {
      console.log(chalk.bold.cyan(`  ${workflowName}:`));
      if (workflowInfo.description) {
        console.log(chalk.gray(`    ${workflowInfo.description}`));
      }
      console.log();

      for (const [subKey, subLabel] of Object.entries(workflowInfo.subcategories)) {
        const commands = getCommandsByWorkflow(workflowKey, subKey, config);
        if (commands.length === 0) continue;

        console.log(chalk.bold.gray(`    ${subLabel}:`));
        for (const cmd of commands) {
          const cmdList = [cmd.name, ...cmd.aliases].join(', ');
          console.log(`      ${theme.primary(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
        }
        console.log();
      }
    } else {
      const commands = getCommandsByWorkflow(workflowKey, null, config);
      if (commands.length === 0) continue;

      console.log(chalk.bold(theme.primary(`  ${workflowName}:`)));
      if (workflowInfo.description) {
        console.log(chalk.gray(`    ${workflowInfo.description}`));
      }
      console.log();
      for (const cmd of commands) {
        const cmdList = [cmd.name, ...cmd.aliases].join(', ');
        console.log(`    ${theme.primary(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
      }
      console.log();
    }
  }
}

function showCommandHelp(commandName) {
  const help = COMMAND_HELP[commandName];

  if (!help) {
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    ui.error(`No help available for command: ${chalk.bold(commandName)}`);
    console.log();
    console.log(chalk.yellow('Available commands with help:'));
    console.log(chalk.gray(Object.keys(COMMAND_HELP).join(', ')));
    console.log();
    return;
  }

  showBanner('GITTABLE', { version: VERSION });
  console.log();
  console.log(chalk.bold.cyan(`Command: ${chalk.white(commandName)}`));
  if (help.aliases.length > 0) {
    console.log(chalk.dim(`Aliases: ${help.aliases.join(', ')}`));
  }
  console.log();
  console.log(chalk.bold('Description:'));
  console.log(`  ${help.description}`);
  console.log();
  console.log(chalk.bold('Usage:'));
  console.log(`  ${chalk.cyan(help.usage)}`);
  console.log();
  if (help.examples && help.examples.length > 0) {
    console.log(chalk.bold('Examples:'));
    help.examples.forEach((example) => {
      console.log(`  ${chalk.gray('$')} ${chalk.cyan(example)}`);
    });
    console.log();
  }
  ui.success('Help complete');
}

module.exports = async (args) => {
  const commandName = args[0];

  if (!commandName) {
    // Show list of all commands (merged functionality)
    showListCommands();
    return;
  }

  showCommandHelp(commandName.toLowerCase());
};

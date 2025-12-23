const prompts = require('../ui/prompts');
const chalk = require('chalk');
const router = require('./router');
const { showBanner } = require('../ui/components');
const { createLink, getTheme } = require('../utils/ui');
const readConfigFile = require('../core/config/loader');
const { sortCommandsByPriority, getQuickActions } = require('../utils/commands');
const { fuzzySearchCommands } = require('../utils/fuzzy-search');
const { INTERACTIVE_MARKERS } = require('../core/constants');

const VERSION = require('../../package.json').version;

// Cache config to prevent repeated "Using: .gittable.js" messages
let cachedConfig = null;
let configLoaded = false;

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
 * Uses direct category-to-workflow mapping based on folder structure
 * Returns { workflow, subcategory } or null if not found
 */
function mapCommandToWorkflow(commandName, category, subcategory) {
  // Special handling for settings commands (utilities category with settings subcategory)
  if (category === 'utilities' && subcategory === 'settings') {
    // Map all settings commands directly to gittableSettings workflow (no subcategory)
    return { workflow: 'gittableSettings', subcategory: null };
  }

  // Map workflow category based on subcategory
  if (category === 'workflow') {
    if (subcategory === 'commit') {
      return { workflow: 'dailyDevelopment', subcategory: 'createCommits' };
    }
    if (subcategory === 'remote') {
      return { workflow: 'collaboration', subcategory: 'remoteOps' };
    }
    return { workflow: 'dailyDevelopment', subcategory: 'createCommits' };
  }

  // Map utilities category based on subcategory
  if (category === 'utilities') {
    // Special handling for development-related utilities
    if (commandName === 'diff-preview' || commandName === 'preview-diff') {
      return { workflow: 'dailyDevelopment', subcategory: 'previewChanges' };
    }
    // Special handling for stash commands
    if (commandName === 'stash' || commandName === 'stash-all') {
      return { workflow: 'advancedOperations', subcategory: 'stashOps' };
    }
    // Special handling for bisect (debugging tool)
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
      // diff-preview and preview-diff already handled above, but fallback
      return { workflow: 'dailyDevelopment', subcategory: 'previewChanges' };
    }
    return { workflow: 'maintenanceUtilities', subcategory: 'quickActions' };
  }

  // Map core category
  if (category === 'core') {
    if (subcategory === 'history') {
      // History commands in core folder (log, show)
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

  // Map branching category
  if (category === 'branching') {
    // Special handling for merge conflict commands
    if (commandName === 'mergetool' || commandName === 'merge-continue' || commandName === 'merge-abort') {
      return { workflow: 'advancedOperations', subcategory: 'mergeConflicts' };
    }
    if (subcategory === 'advancedBranching') {
      return { workflow: 'collaboration', subcategory: 'advancedBranching' };
    }
    return { workflow: 'collaboration', subcategory: 'branchManagement' };
  }

  // Map remote category
  if (category === 'remote') {
    return { workflow: 'collaboration', subcategory: 'remoteOps' };
  }

  // Map history category
  if (category === 'history') {
    // Map history commands based on command name for better categorization
    if (commandName === 'blame' || commandName === 'grep' || commandName === 'range-diff') {
      return { workflow: 'historyInspection', subcategory: 'searchAnalyze' };
    }
    return { workflow: 'historyInspection', subcategory: 'viewHistory' };
  }

  // Map repository category
  if (category === 'repository') {
    if (subcategory === 'repo') {
      return { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' };
    }
    return { workflow: 'startingProject', subcategory: 'initialize' };
  }

  // Default fallback
  return { workflow: 'maintenanceUtilities', subcategory: 'quickActions' };
}

/**
 * Get config for filtering commands
 * Returns null if config doesn't exist (graceful handling)
 * Caches the config to prevent repeated loading and "Using:" messages
 */
function getConfig() {
  if (configLoaded) {
    return cachedConfig;
  }
  try {
    cachedConfig = readConfigFile();
    configLoaded = true;
    return cachedConfig; // Can be null if config doesn't exist
  } catch (error) {
    // If config loading fails, return null (will default to full mode)
    configLoaded = true;
    cachedConfig = null;
    return null;
  }
}

/**
 * Get commands by workflow and subcategory, filtered by config
 * Maps commands from old category system to new workflow system
 */
function getCommandsByWorkflow(workflow, subcategory = null, config = null) {
  const allCommands = router.registry.getAll();
  const filtered = allCommands.filter((cmd) => {
    // Map command to workflow
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

    // Filter by config if provided
    if (config) {
      const { isCommandEnabled } = require('../core/config/mode-filter');
      return isCommandEnabled(cmd.name, config);
    }

    return true;
  });

  return filtered;
}

/**
 * Get commands by category and subcategory
 * Uses workflow mapping internally
 */
function getCommandsByCategory(category, subcategory = null, config = null, prioritize = false) {
  const allCommands = router.registry.getAll();
  const filtered = allCommands.filter((cmd) => {
    // Match category
    if (cmd.category !== category) {
      return false;
    }

    // If subcategory is specified, only match commands with that subcategory
    if (subcategory !== null) {
      if (cmd.subcategory !== subcategory) {
        return false;
      }
    } else {
      // If no subcategory specified, only include commands without subcategory
      // (commands with subcategories should only appear when subcategory is selected)
      if (cmd.subcategory !== null && cmd.subcategory !== undefined) {
        return false;
      }
    }

    // Filter by config if provided
    if (config) {
      const { isCommandEnabled } = require('../core/config/mode-filter');
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
    // Check if any subcategory has commands
    for (const subKey of Object.keys(workflowInfo.subcategories)) {
      const commands = getCommandsByWorkflow(workflow, subKey, config);
      if (commands.length > 0) {
        return true;
      }
    }
  } else {
    // Check if workflow has commands (shouldn't happen with current structure)
    const commands = getCommandsByWorkflow(workflow, null, config);
    if (commands.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a category has any enabled commands
 */
function hasEnabledCommands(category, config, categoryMap) {
  const categoryInfo = categoryMap[category];
  if (!categoryInfo) return false;

  // Use original category for command lookup
  const originalCategory = categoryInfo.originalCategory || category;

  if (categoryInfo.subcategories) {
    // Check if any subcategory has commands
    for (const subKey of Object.keys(categoryInfo.subcategories)) {
      const commands = getCommandsByCategory(originalCategory, subKey, config);
      if (commands.length > 0) {
        return true;
      }
    }
  } else {
    // Check if category has commands
    const commands = getCommandsByCategory(originalCategory, null, config);
    if (commands.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Show help menu with workflow-based structure
 */
function showHelp() {
  const config = getConfig();
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

  // Display all workflows hierarchically
  const workflowOrder = Object.keys(workflowMap);

  for (const workflowKey of workflowOrder) {
    const workflowInfo = workflowMap[workflowKey];
    if (!workflowInfo) continue;

    // Skip empty workflows
    if (!hasEnabledWorkflowCommands(workflowKey, config, workflowMap)) {
      continue;
    }

    const workflowName = workflowInfo.label;
    const hasSubcategories = workflowInfo.subcategories != null && typeof workflowInfo.subcategories === 'object';

    if (hasSubcategories) {
      // Show workflow header
      console.log(chalk.bold.cyan(`  ${workflowName}:`));
      if (workflowInfo.description) {
        console.log(chalk.gray(`    ${workflowInfo.description}`));
      }
      console.log();

      // Show commands in each subcategory
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
      // Show commands directly under workflow (shouldn't happen with current structure)
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

/**
 * Search commands by name, alias, or description
 * Uses fuzzy search for better matching
 */
function searchCommands(query, config) {
  const allCommands = router.registry.getAll();

  // Filter by config if provided (enabledCommands array only)
  const filteredCommands = allCommands.filter((cmd) => {
    if (config) {
      const { isCommandEnabled } = require('../core/config/mode-filter');
      return isCommandEnabled(cmd.name, config);
    }
    return true;
  });

  // Use fuzzy search for better matching
  return fuzzySearchCommands(filteredCommands, query);
}

/**
 * Show subcategory menu (Level 2)
 * Level 2: Subcategories within a workflow
 */
async function showSubcategoryMenu(workflowKey, workflowInfo) {
  const config = getConfig();
  const theme = getTheme();

  // If workflow has no subcategories, show commands directly
  if (!workflowInfo.subcategories) {
    const commands = getCommandsByWorkflow(workflowKey, null, config);
    if (commands.length === 0) {
      prompts.cancel(chalk.yellow('No commands available in this workflow'));
      return showWorkflowMenu();
    }

    const commandOptions = commands.map((cmd) => {
      const aliases = cmd.aliases.length > 0 ? chalk.dim(` (${cmd.aliases.join(', ')})`) : '';
      return {
        value: cmd.name,
        label: `${theme.primary(cmd.name)}${aliases} ${chalk.gray(`- ${cmd.description}`)}`,
      };
    });

    commandOptions.push({
      value: INTERACTIVE_MARKERS.BACK,
      label: chalk.dim('← Previous Menu'),
    });

    const selectedCommand = await prompts.select({
      message: theme.primary(`Select a command from ${workflowInfo.label}:`),
      options: commandOptions,
    });

    if (prompts.isCancel(selectedCommand) || selectedCommand === INTERACTIVE_MARKERS.BACK) {
      return showWorkflowMenu();
    }

    // Execute the selected command
    const success = await router.execute(selectedCommand, []);
    if (!success) {
      const { CommandError } = require('../core/errors');
      throw new CommandError(`Command "${selectedCommand}" failed`, selectedCommand);
    }
    return;
  }

  const subcategoryOptions = [];
  const directCommandSubcategories = [];
  const regularSubcategories = [];
  
  for (const [subKey, subLabel] of Object.entries(workflowInfo.subcategories)) {
    const commands = getCommandsByWorkflow(workflowKey, subKey, config);
    if (commands.length === 0) continue;

    // If subcategory has 2 or fewer commands, skip subcategory and show commands directly
    if (commands.length <= 2) {
      directCommandSubcategories.push({ subKey, commands });
    } else {
      regularSubcategories.push({
        value: subKey,
        label: `${theme.primary(subLabel)} ${chalk.dim(`(${commands.length})`)}`,
      });
    }
  }

  // Add direct commands first (for better visibility)
  for (const { commands } of directCommandSubcategories) {
    for (const command of commands) {
      const aliases = command.aliases.length > 0 ? chalk.dim(` (${command.aliases.join(', ')})`) : '';
      subcategoryOptions.push({
        value: `${INTERACTIVE_MARKERS.DIRECT}${command.name}`,
        label: `${theme.primary(command.name)}${aliases} ${chalk.gray(`- ${command.description}`)}`,
      });
    }
  }

  // Then add regular subcategories
  subcategoryOptions.push(...regularSubcategories);

  if (subcategoryOptions.length === 0) {
    prompts.cancel(chalk.yellow('No commands available in this workflow'));
    return showWorkflowMenu();
  }

  subcategoryOptions.push({
    value: INTERACTIVE_MARKERS.BACK,
    label: chalk.dim('← Previous Menu'),
  });

  const subcategory = await prompts.select({
    message: theme.primary(`Select from ${workflowInfo.label}:`),
    options: subcategoryOptions,
  });

  if (prompts.isCancel(subcategory) || subcategory === INTERACTIVE_MARKERS.BACK) {
    return showWorkflowMenu();
  }

  // Handle direct command execution (for subcategories with 2 or fewer commands)
  if (subcategory.startsWith(INTERACTIVE_MARKERS.DIRECT)) {
    const commandName = subcategory.replace(INTERACTIVE_MARKERS.DIRECT, '');
    const success = await router.execute(commandName, []);
    if (!success) {
      const { CommandError } = require('../core/errors');
      throw new CommandError(`Command "${commandName}" failed`, commandName);
    }
    return;
  }

  // Navigate to Level 3: command selection
  return showCommandMenu(workflowKey, subcategory, workflowInfo);
}

/**
 * Show command menu (Level 3)
 * Level 3: Commands within a subcategory
 */
async function showCommandMenu(workflowKey, subcategory, workflowInfo) {
  const config = getConfig();
  const theme = getTheme();

  const commands = getCommandsByWorkflow(workflowKey, subcategory, config);
  if (commands.length === 0) {
    prompts.cancel(chalk.yellow('No commands available in this subcategory'));
    return showSubcategoryMenu(workflowKey, workflowInfo);
  }

  const commandOptions = commands.map((cmd) => {
    const aliases = cmd.aliases.length > 0 ? chalk.dim(` (${cmd.aliases.join(', ')})`) : '';
    return {
      value: cmd.name,
      label: `${theme.primary(cmd.name)}${aliases} ${chalk.gray(`- ${cmd.description}`)}`,
    };
  });

  commandOptions.push({
    value: INTERACTIVE_MARKERS.BACK,
    label: chalk.dim('← Previous Menu'),
  });

  const subcategoryLabel = workflowInfo.subcategories && workflowInfo.subcategories[subcategory] 
    ? workflowInfo.subcategories[subcategory] 
    : 'this subcategory';
  
  const selectedCommand = await prompts.select({
    message: theme.primary(
      `Select a command from ${subcategoryLabel}:`
    ),
    options: commandOptions,
  });

  if (prompts.isCancel(selectedCommand) || selectedCommand === INTERACTIVE_MARKERS.BACK) {
    return showSubcategoryMenu(workflowKey, workflowInfo);
  }

  // Execute the selected command
  const success = await router.execute(selectedCommand, []);
  if (!success) {
    const { CommandError } = require('../core/errors');
    throw new CommandError(`Command "${selectedCommand}" failed`, selectedCommand);
  }
}

/**
 * Show workflow-based menu with three-level navigation
 * Level 1: Workflow Groups → Level 2: Subcategories → Level 3: Commands
 */
async function showWorkflowMenu() {
  const config = getConfig();
  const workflowMap = getWorkflowMap();
  const theme = getTheme();

  showBanner('GITTABLE', { version: VERSION });

  // Build top-level options: Search + Workflows + Help + Exit
  const topLevelOptions = [];

  // Add search option first
  topLevelOptions.push({
    value: '__search__',
    label: chalk.yellow('Search Commands') + chalk.dim(' - Find commands quickly'),
  });

  // Add workflow groups
  for (const [workflowKey, workflowInfo] of Object.entries(workflowMap)) {
    if (!hasEnabledWorkflowCommands(workflowKey, config, workflowMap)) {
      continue;
    }

    // Count commands in this workflow
    let commandCount = 0;
    if (workflowInfo.subcategories) {
      for (const subKey of Object.keys(workflowInfo.subcategories)) {
        commandCount += getCommandsByWorkflow(workflowKey, subKey, config).length;
      }
    } else {
      commandCount = getCommandsByWorkflow(workflowKey, null, config).length;
    }

    const label =
      theme.primary(workflowInfo.label) +
      (commandCount > 0 ? chalk.dim(` (${commandCount})`) : '') +
      chalk.gray(` - ${workflowInfo.description}`);
    topLevelOptions.push({ value: workflowKey, label });
  }

  // Add exit
  topLevelOptions.push(
    { value: 'exit', label: chalk.red('Exit') }
  );

  // Level 1: Select workflow or search
  const selection = await prompts.select({
    message: theme.primary('Select a workflow or search:'),
    options: topLevelOptions,
  });

  if (prompts.isCancel(selection)) {
    prompts.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (selection === 'exit') {
    return;
  }

  // Handle search
  if (selection === '__search__') {
    const searchQuery = await prompts.text({
      message: theme.primary('Search commands (name, alias, or description):'),
      placeholder: 'e.g., commit, push, branch',
    });

    if (prompts.isCancel(searchQuery)) {
      return showWorkflowMenu();
    }

    if (!searchQuery || searchQuery.trim() === '') {
      prompts.cancel(chalk.yellow('Search query cannot be empty'));
      return showWorkflowMenu();
    }

    const results = searchCommands(searchQuery.trim(), config);

    if (results.length === 0) {
      prompts.cancel(chalk.yellow(`No commands found matching "${searchQuery}"`));
      return showWorkflowMenu();
    }

    // Group results by workflow
    const groupedResults = {};
    for (const cmd of results) {
      const mapping = mapCommandToWorkflow(cmd.name, cmd.category, cmd.subcategory);
      const workflowKey = mapping?.workflow || 'maintenanceUtilities';
      if (!groupedResults[workflowKey]) {
        groupedResults[workflowKey] = [];
      }
      groupedResults[workflowKey].push(cmd);
    }

    // Build search result options
    const searchOptions = [];
    for (const [workflowKey, commands] of Object.entries(groupedResults)) {
      const workflowInfo = workflowMap[workflowKey];
      if (workflowInfo) {
        searchOptions.push({
          value: `__group__${workflowKey}`,
          label: chalk.bold.gray(`  ${workflowInfo.label}:`),
          disabled: true,
        });
        for (const cmd of commands) {
          const aliases = cmd.aliases.length > 0 ? chalk.dim(` (${cmd.aliases.join(', ')})`) : '';
          searchOptions.push({
            value: cmd.name,
            label: `    ${theme.primary(cmd.name)}${aliases} ${chalk.gray(`- ${cmd.description}`)}`,
          });
        }
      }
    }

    searchOptions.push({
      value: INTERACTIVE_MARKERS.BACK,
      label: chalk.dim('← Previous Menu'),
    });

    const selectedCommand = await prompts.select({
      message: theme.primary(`Found ${results.length} command(s):`),
      options: searchOptions,
    });

    if (prompts.isCancel(selectedCommand) || selectedCommand === INTERACTIVE_MARKERS.BACK) {
      return showWorkflowMenu();
    }

    const success = await router.execute(selectedCommand, []);
    if (!success) {
      const { CommandError } = require('../core/errors');
      throw new CommandError(`Command "${selectedCommand}" failed`, selectedCommand);
    }
    return;
  }

  // Level 2: Navigate to subcategory menu
  const workflowInfo = workflowMap[selection];
  if (!workflowInfo) {
    prompts.cancel(chalk.yellow('Invalid workflow'));
    return showWorkflowMenu();
  }

  return showSubcategoryMenu(selection, workflowInfo);
}

/**
 * Show interactive menu with workflow-based structure
 */
async function showInteractiveMenu() {
  return showWorkflowMenu();
}



module.exports = {
  showHelp,
  showInteractiveMenu,
};

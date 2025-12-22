const prompts = require('../ui/prompts');
const chalk = require('chalk');
const router = require('./router');
const { showBanner } = require('../ui/components');
const { createLink } = require('../utils/terminal-link');
const readConfigFile = require('../core/config/loader');
const { sortCommandsByPriority, getQuickActions } = require('../utils/command-prioritizer');
const { fuzzySearchCommands } = require('../utils/fuzzy-search');
const { getTheme } = require('../utils/color-theme');

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
      description: 'File operations, repository management, and customization',
      subcategories: {
        fileOps: 'File Operations',
        repoManagement: 'Repository Management',
        tagging: 'Tagging',
        customization: 'Customization',
        helpLearning: 'Help & Learning',
        quickActions: 'Quick Actions',
      },
    },
  };
}

/**
 * Map command from old category/subcategory to new workflow/subcategory
 * Returns { workflow, subcategory } or null if not found
 */
function mapCommandToWorkflow(commandName, oldCategory, oldSubcategory) {
  // Command name to workflow mapping
  const commandMap = {
    // Starting a Project
    init: { workflow: 'startingProject', subcategory: 'initialize' },
    clone: { workflow: 'startingProject', subcategory: 'initialize' },
    config: { workflow: 'startingProject', subcategory: 'configuration' },
    notify: { workflow: 'startingProject', subcategory: 'configuration' },

    // Daily Development - Check Status
    status: { workflow: 'dailyDevelopment', subcategory: 'checkStatus' },
    'status-short': { workflow: 'dailyDevelopment', subcategory: 'checkStatus' },
    info: { workflow: 'dailyDevelopment', subcategory: 'checkStatus' },

    // Daily Development - Stage Files
    add: { workflow: 'dailyDevelopment', subcategory: 'stageFiles' },
    'add-pattern': { workflow: 'dailyDevelopment', subcategory: 'stageFiles' },

    // Daily Development - Create Commits
    commit: { workflow: 'dailyDevelopment', subcategory: 'createCommits' },
    'add-commit': { workflow: 'dailyDevelopment', subcategory: 'createCommits' },
    'commit-all': { workflow: 'dailyDevelopment', subcategory: 'createCommits' },

    // Daily Development - Preview Changes
    diff: { workflow: 'dailyDevelopment', subcategory: 'previewChanges' },
    'diff-preview': { workflow: 'dailyDevelopment', subcategory: 'previewChanges' },
    'preview-diff': { workflow: 'dailyDevelopment', subcategory: 'previewChanges' },

    // Collaboration - Remote Operations
    push: { workflow: 'collaboration', subcategory: 'remoteOps' },
    pull: { workflow: 'collaboration', subcategory: 'remoteOps' },
    fetch: { workflow: 'collaboration', subcategory: 'remoteOps' },
    sync: { workflow: 'collaboration', subcategory: 'remoteOps' },
    remote: { workflow: 'collaboration', subcategory: 'remoteOps' },
    'commit-push': { workflow: 'collaboration', subcategory: 'remoteOps' },
    'commit-sync': { workflow: 'collaboration', subcategory: 'remoteOps' },
    'remote-set-url': { workflow: 'collaboration', subcategory: 'remoteOps' },
    'create-pr': { workflow: 'collaboration', subcategory: 'remoteOps' },
    'clear-cache': { workflow: 'collaboration', subcategory: 'remoteOps' },

    // Collaboration - Branch Management
    branch: { workflow: 'collaboration', subcategory: 'branchManagement' },
    checkout: { workflow: 'collaboration', subcategory: 'branchManagement' },
    switch: { workflow: 'collaboration', subcategory: 'branchManagement' },
    merge: { workflow: 'collaboration', subcategory: 'branchManagement' },
    'branch-rename': { workflow: 'collaboration', subcategory: 'branchManagement' },
    'branch-compare': { workflow: 'collaboration', subcategory: 'branchManagement' },
    'branch-clean': { workflow: 'collaboration', subcategory: 'branchManagement' },

    // Collaboration - Advanced Branching
    rebase: { workflow: 'collaboration', subcategory: 'advancedBranching' },
    'cherry-pick': { workflow: 'collaboration', subcategory: 'advancedBranching' },
    'pull-rebase': { workflow: 'collaboration', subcategory: 'advancedBranching' },

    // History & Inspection - View History
    log: { workflow: 'historyInspection', subcategory: 'viewHistory' },
    show: { workflow: 'historyInspection', subcategory: 'viewHistory' },
    shortlog: { workflow: 'historyInspection', subcategory: 'viewHistory' },
    describe: { workflow: 'historyInspection', subcategory: 'viewHistory' },

    // History & Inspection - Search & Analyze
    blame: { workflow: 'historyInspection', subcategory: 'searchAnalyze' },
    grep: { workflow: 'historyInspection', subcategory: 'searchAnalyze' },
    'range-diff': { workflow: 'historyInspection', subcategory: 'searchAnalyze' },

    // History & Inspection - Repository State
    state: { workflow: 'historyInspection', subcategory: 'repositoryState' },
    hooks: { workflow: 'historyInspection', subcategory: 'repositoryState' },
    conflicts: { workflow: 'historyInspection', subcategory: 'repositoryState' },
    resolve: { workflow: 'historyInspection', subcategory: 'repositoryState' },

    // Advanced Operations - Undo & Recovery
    undo: { workflow: 'advancedOperations', subcategory: 'undoRecovery' },
    revert: { workflow: 'advancedOperations', subcategory: 'undoRecovery' },
    restore: { workflow: 'advancedOperations', subcategory: 'undoRecovery' },
    'restore-backup': { workflow: 'advancedOperations', subcategory: 'undoRecovery' },

    // Advanced Operations - Stash Operations
    stash: { workflow: 'advancedOperations', subcategory: 'stashOps' },
    'stash-all': { workflow: 'advancedOperations', subcategory: 'stashOps' },

    // Advanced Operations - Merge Conflicts
    mergetool: { workflow: 'advancedOperations', subcategory: 'mergeConflicts' },
    'merge-continue': { workflow: 'advancedOperations', subcategory: 'mergeConflicts' },
    'merge-abort': { workflow: 'advancedOperations', subcategory: 'mergeConflicts' },

    // Advanced Operations - Debugging
    bisect: { workflow: 'advancedOperations', subcategory: 'debugging' },

    // Maintenance & Utilities - File Operations
    rm: { workflow: 'maintenanceUtilities', subcategory: 'fileOps' },
    mv: { workflow: 'maintenanceUtilities', subcategory: 'fileOps' },
    clean: { workflow: 'maintenanceUtilities', subcategory: 'fileOps' },

    // Maintenance & Utilities - Repository Management
    archive: { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' },
    worktree: { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' },
    submodule: { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' },
    uninit: { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' },

    // Maintenance & Utilities - Tagging
    tag: { workflow: 'maintenanceUtilities', subcategory: 'tagging' },
    'tag-push': { workflow: 'maintenanceUtilities', subcategory: 'tagging' },
    'tag-delete': { workflow: 'maintenanceUtilities', subcategory: 'tagging' },

    // Maintenance & Utilities - Customization
    theme: { workflow: 'maintenanceUtilities', subcategory: 'customization' },
    template: { workflow: 'maintenanceUtilities', subcategory: 'customization' },
    preset: { workflow: 'maintenanceUtilities', subcategory: 'customization' },

    // Maintenance & Utilities - Help & Learning
    help: { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' },
    examples: { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' },
    tutorial: { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' },
    history: { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' },

    // Maintenance & Utilities - Quick Actions
    quick: { workflow: 'maintenanceUtilities', subcategory: 'quickActions' },
  };

  // First try direct command name mapping
  if (commandMap[commandName]) {
    return commandMap[commandName];
  }

  // Fallback: try to map based on old category/subcategory
  // This handles any commands not explicitly mapped above
  const categoryFallback = {
    gettingStarted: { workflow: 'startingProject', subcategory: 'initialize' },
    dailyWork: {
      statusChanges: { workflow: 'dailyDevelopment', subcategory: 'checkStatus' },
      commit: { workflow: 'dailyDevelopment', subcategory: 'createCommits' },
    },
    workingWithOthers: {
      remote: { workflow: 'collaboration', subcategory: 'remoteOps' },
      branching: { workflow: 'collaboration', subcategory: 'branchManagement' },
    },
    history: { workflow: 'historyInspection', subcategory: 'viewHistory' },
    advanced: {
      undo: { workflow: 'advancedOperations', subcategory: 'undoRecovery' },
      fileOps: { workflow: 'maintenanceUtilities', subcategory: 'fileOps' },
      advancedBranching: { workflow: 'collaboration', subcategory: 'advancedBranching' },
      tagging: { workflow: 'maintenanceUtilities', subcategory: 'tagging' },
      repo: { workflow: 'maintenanceUtilities', subcategory: 'repoManagement' },
      help: { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' },
      customization: { workflow: 'maintenanceUtilities', subcategory: 'customization' },
      inspection: { workflow: 'historyInspection', subcategory: 'repositoryState' },
      commandHistory: { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' },
    },
  };

  if (oldCategory && categoryFallback[oldCategory]) {
    if (oldSubcategory && categoryFallback[oldCategory][oldSubcategory]) {
      return categoryFallback[oldCategory][oldSubcategory];
    }
    if (typeof categoryFallback[oldCategory] === 'object' && categoryFallback[oldCategory].workflow) {
      return categoryFallback[oldCategory];
    }
  }

  // Default fallback to maintenance utilities
  return { workflow: 'maintenanceUtilities', subcategory: 'helpLearning' };
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
    if (subcategory !== null) {
      if (mapping.subcategory !== subcategory) {
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
 * Get commands by category and subcategory (legacy function for backward compatibility)
 * Now uses workflow mapping internally
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
 * Check if a category has any enabled commands (legacy function for backward compatibility)
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
    const hasSubcategories = workflowInfo.subcategories !== null;

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

  const subcategoryOptions = [];
  for (const [subKey, subLabel] of Object.entries(workflowInfo.subcategories)) {
    const commands = getCommandsByWorkflow(workflowKey, subKey, config);
    if (commands.length === 0) continue;

    subcategoryOptions.push({
      value: subKey,
      label: `${theme.primary(subLabel)} ${chalk.dim(`(${commands.length})`)}`,
    });
  }

  if (subcategoryOptions.length === 0) {
    prompts.cancel(chalk.yellow('No commands available in this workflow'));
    return showWorkflowMenu();
  }

  subcategoryOptions.push({
    value: '__back__',
    label: chalk.dim('← Previous Menu'),
  });

  const subcategory = await prompts.select({
    message: theme.primary(`Select from ${workflowInfo.label}:`),
    options: subcategoryOptions,
  });

  if (prompts.isCancel(subcategory) || subcategory === '__back__') {
    return showWorkflowMenu();
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
    value: '__back__',
    label: chalk.dim('← Previous Menu'),
  });

  const selectedCommand = await prompts.select({
    message: theme.primary(
      `Select a command from ${workflowInfo.subcategories[subcategory]}:`
    ),
    options: commandOptions,
  });

  if (prompts.isCancel(selectedCommand) || selectedCommand === '__back__') {
    return showSubcategoryMenu(workflowKey, workflowInfo);
  }

  // Execute the selected command
  const success = await router.execute(selectedCommand, []);
  if (!success) {
    process.exit(1);
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
    for (const subKey of Object.keys(workflowInfo.subcategories)) {
      commandCount += getCommandsByWorkflow(workflowKey, subKey, config).length;
    }

    const label =
      theme.primary(workflowInfo.label) +
      (commandCount > 0 ? chalk.dim(` (${commandCount})`) : '') +
      chalk.gray(` - ${workflowInfo.description}`);
    topLevelOptions.push({ value: workflowKey, label });
  }

  // Add help and exit
  topLevelOptions.push(
    { value: 'help', label: chalk.yellow('List Commands') },
    { value: 'exit', label: chalk.red('Exit') }
  );

  // Level 1: Select workflow or search
  const selection = await prompts.select({
    message: theme.primary('Select a workflow or search:'),
    options: topLevelOptions,
  });

  if (prompts.isCancel(selection) || selection === 'exit') {
    prompts.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (selection === 'help') {
    showHelp();
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
      value: '__back__',
      label: chalk.dim('← Previous Menu'),
    });

    const selectedCommand = await prompts.select({
      message: theme.primary(`Found ${results.length} command(s):`),
      options: searchOptions,
    });

    if (prompts.isCancel(selectedCommand) || selectedCommand === '__back__') {
      return showWorkflowMenu();
    }

    const success = await router.execute(selectedCommand, []);
    if (!success) {
      process.exit(1);
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

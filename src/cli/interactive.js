const clack = require('@clack/prompts');
const chalk = require('chalk');
const router = require('./router');
const { showBanner } = require('../ui/banner');
const { createLink } = require('../utils/terminal-link');
const readConfigFile = require('../core/config/loader');
const { sortCommandsByPriority, getQuickActions } = require('../utils/command-prioritizer');
const { fuzzySearchCommands } = require('../utils/fuzzy-search');
const { getTheme } = require('../utils/color-theme');

const VERSION = require('../../package.json').version;

/**
 * Get category map based on mode
 * Basic mode: Task-oriented, beginner-friendly names
 * Full mode: Technical, expert-oriented names
 */
function getCategoryMap(mode) {
  if (mode === 'basic') {
    return {
      gettingStarted: {
        label: 'First Steps',
        description: 'Initialize repositories and configure Git',
        subcategories: null,
        originalCategory: 'gettingStarted',
      },
      dailyWork: {
        label: 'Your Daily Workflow',
        description: 'Check status, stage files, and create commits',
        subcategories: {
          status: 'Status',
          changes: 'Changes',
          commit: 'Commit',
        },
        originalCategory: 'dailyWork',
      },
      workingWithOthers: {
        label: 'Sharing Your Work',
        description: 'Push, pull, and manage branches',
        subcategories: {
          remote: 'Remote',
          branching: 'Branching',
        },
        originalCategory: 'workingWithOthers',
      },
      history: {
        label: 'View History',
        description: 'See past changes and commits',
        subcategories: null,
        originalCategory: 'history',
      },
    };
  }
  return {
    gettingStarted: {
      label: 'Repository Setup',
      description: 'Initialize and configure repositories',
      subcategories: null,
      originalCategory: 'gettingStarted',
    },
    dailyWork: {
      label: 'Working Tree',
      description: 'Status, staging, and commits',
      subcategories: {
        statusChanges: 'Status & Changes',
        commit: 'Commit',
      },
      originalCategory: 'dailyWork',
    },
    workingWithOthers: {
      label: 'Remote & Collaboration',
      description: 'Push, pull, sync, and branch management',
      subcategories: {
        remote: 'Remote',
        branching: 'Branching',
      },
      originalCategory: 'workingWithOthers',
    },
    history: {
      label: 'History & Inspection',
      description: 'Log, show, blame, and inspection tools',
      subcategories: null,
      originalCategory: 'history',
    },
    advanced: {
      label: 'Advanced',
      description: 'Advanced Git operations and utilities',
      subcategories: {
        undo: 'Undo & Recovery',
        fileOps: 'File Operations',
        advancedBranching: 'Advanced Branching',
        tagging: 'Tagging',
        repo: 'Repository',
        help: 'Help & Documentation',
        customization: 'Customization',
        inspection: 'Repository Inspection',
        commandHistory: 'Command History',
      },
      originalCategory: 'advanced',
    },
  };
}

/**
 * Get config for filtering commands
 * Returns null if config doesn't exist (graceful handling)
 */
function getConfig() {
  try {
    const config = readConfigFile();
    return config; // Can be null if config doesn't exist
  } catch (error) {
    // If config loading fails, return null (will default to full mode)
    return null;
  }
}

/**
 * Get commands by category and subcategory, filtered by config
 * Returns sorted commands (prioritized for basic mode)
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

    // Filter by mode if config exists
    if (config) {
      const { isCommandEnabled } = require('../core/config/mode-filter');
      return isCommandEnabled(cmd.name, config);
    }

    return true;
  });

  // Sort by priority if requested (for basic mode)
  if (prioritize) {
    return sortCommandsByPriority(filtered);
  }

  return filtered;
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
 * Show help menu with mode-specific formatting
 */
function showHelp() {
  const config = getConfig();
  const mode = config?.mode || 'full';
  const modeLabel = mode === 'basic' ? 'Basic' : 'Full';
  const categoryMap = getCategoryMap(mode);

  showBanner('GITTABLE', { version: VERSION });

  const theme = getTheme();
  const repoLink = createLink('GitHub', 'https://github.com/GG-Santos/Gittable');
  console.log(`${chalk.gray('├')}  ${chalk.dim(repoLink)}`);
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Modern Git CLI with Interactive Prompts'))}`);
  console.log(
    `${chalk.gray('├')}  ${chalk.yellow('Usage:')} ${chalk.white('gittable <command> [options]')}`
  );
  if (config) {
    console.log(`${chalk.gray('├')}  ${chalk.yellow('Mode:')} ${chalk.white(modeLabel)}`);
  }
  console.log(chalk.gray('│'));

  // Display all categories hierarchically
  const categoryOrder = Object.keys(categoryMap);

  for (const categoryKey of categoryOrder) {
    const categoryInfo = categoryMap[categoryKey];
    if (!categoryInfo) continue;

    // Skip empty categories
    if (!hasEnabledCommands(categoryKey, config, categoryMap)) {
      continue;
    }

    const categoryName = categoryInfo.label;
    const hasSubcategories = categoryInfo.subcategories !== null;
    const originalCategory = categoryInfo.originalCategory || categoryKey;

    if (hasSubcategories) {
      // Show category header
      console.log(chalk.bold.cyan(`  ${categoryName}:`));
      if (mode === 'basic' && categoryInfo.description) {
        console.log(chalk.gray(`    ${categoryInfo.description}`));
      }
      console.log();

      // Show commands in each subcategory
      // For basic mode dailyWork, we need to map statusChanges to status/changes
      if (mode === 'basic' && originalCategory === 'dailyWork') {
        // Map statusChanges commands to status or changes
        const statusCommands = ['status', 'status-short', 'info'];
        const changesCommands = ['diff'];

        const statusChangesCommands = getCommandsByCategory(
          originalCategory,
          'statusChanges',
          config
        );
        const commitCommands = getCommandsByCategory(originalCategory, 'commit', config);

        // Split statusChanges into status and changes
        const statusCmds = statusChangesCommands.filter((cmd) => statusCommands.includes(cmd.name));
        const changesCmds = statusChangesCommands.filter((cmd) =>
          changesCommands.includes(cmd.name)
        );

        const theme = getTheme();
        // Show Status subcategory
        if (statusCmds.length > 0) {
          const sortedStatus = mode === 'basic' ? sortCommandsByPriority(statusCmds) : statusCmds;
          console.log(chalk.bold.gray('    Status:'));
          for (const cmd of sortedStatus) {
            const cmdList = [cmd.name, ...cmd.aliases].join(', ');
            console.log(`      ${theme.primary(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
          }
          console.log();
        }

        // Show Changes subcategory
        if (changesCmds.length > 0) {
          const sortedChanges =
            mode === 'basic' ? sortCommandsByPriority(changesCmds) : changesCmds;
          console.log(chalk.bold.gray('    Changes:'));
          for (const cmd of sortedChanges) {
            const cmdList = [cmd.name, ...cmd.aliases].join(', ');
            console.log(`      ${theme.primary(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
          }
          console.log();
        }

        // Show Commit subcategory
        if (commitCommands.length > 0) {
          const sortedCommit =
            mode === 'basic' ? sortCommandsByPriority(commitCommands) : commitCommands;
          console.log(chalk.bold.gray('    Commit:'));
          for (const cmd of sortedCommit) {
            const cmdList = [cmd.name, ...cmd.aliases].join(', ');
            console.log(`      ${theme.primary(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
          }
          console.log();
        }
      } else {
        // Regular subcategory handling
        for (const [subKey, subLabel] of Object.entries(categoryInfo.subcategories)) {
          let commands = getCommandsByCategory(originalCategory, subKey, config);
          if (mode === 'basic') {
            commands = sortCommandsByPriority(commands);
          }
          if (commands.length === 0) continue;

          console.log(chalk.bold.gray(`    ${subLabel}:`));
          for (const cmd of commands) {
            const cmdList = [cmd.name, ...cmd.aliases].join(', ');
            console.log(`      ${theme.primary(cmdList.padEnd(20))} ${chalk.gray(cmd.description)}`);
          }
          console.log();
        }
      }
    } else {
      // Show commands directly under category
      let commands = getCommandsByCategory(originalCategory, null, config);
      if (mode === 'basic') {
        commands = sortCommandsByPriority(commands);
      }
      if (commands.length === 0) continue;

      const theme = getTheme();
      console.log(chalk.bold(theme.primary(`  ${categoryName}:`)));
      if (mode === 'basic' && categoryInfo.description) {
        console.log(chalk.gray(`    ${categoryInfo.description}`));
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
 * Search commands by name, alias, or description (for full mode)
 * Uses fuzzy search for better matching
 */
function searchCommands(query, config) {
  const allCommands = router.registry.getAll();

  // Filter by mode if config exists
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
 * Show basic mode menu with task-oriented UI
 */
async function showBasicModeMenu() {
  const config = getConfig();
  const categoryMap = getCategoryMap('basic');

  showBanner('GITTABLE', { version: VERSION });

  const modeColor = chalk.green;
  console.log(
    chalk.gray('Mode: ') +
      modeColor.bold('Basic') +
      chalk.gray(' - Essential commands for beginners')
  );
  console.log();

  // Get all enabled commands for quick actions
  const allEnabledCommands = router.registry.getAll().filter((cmd) => {
    const { isCommandEnabled } = require('../core/config/mode-filter');
    return isCommandEnabled(cmd.name, config);
  });
  const quickActions = getQuickActions(allEnabledCommands, 5);

  // Build category options
  const categoryOptions = [];

  // Add Quick Actions if available
  if (quickActions.length > 0) {
    categoryOptions.push({
      value: '__quick__',
      label: chalk.yellow.bold('Quick Actions') + chalk.gray(' - Most used commands'),
    });
  }

  const theme = getTheme();
  for (const [key, info] of Object.entries(categoryMap)) {
    // Skip empty categories
    if (!hasEnabledCommands(key, config, categoryMap)) {
      continue;
    }

    const label = theme.primary(info.label) + chalk.gray(` - ${info.description}`);
    categoryOptions.push({ value: key, label });
  }

  // Add help and exit options
  categoryOptions.push(
    { value: 'help', label: chalk.yellow('List Commands') },
    { value: 'exit', label: chalk.red('Exit') }
  );

  const category = await clack.select({
    message: theme.primary('What do you want to accomplish?'),
    options: categoryOptions,
  });

  if (clack.isCancel(category) || category === 'exit') {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (category === 'help') {
    showHelp();
    return;
  }

  // Handle Quick Actions
  if (category === '__quick__') {
    const quickOptions = quickActions.map((cmd) => ({
      value: cmd.name,
      label: `${chalk.bold(theme.primary(cmd.name))} ${chalk.gray(`- ${cmd.description}`)}`,
    }));

    quickOptions.push({
      value: '__back__',
      label: chalk.dim('← Previous Menu'),
    });

    const selectedCommand = await clack.select({
      message: theme.primary('Select a quick action:'),
      options: quickOptions,
    });

    if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
      return showBasicModeMenu();
    }

    const success = await router.execute(selectedCommand, []);
    if (!success) {
      process.exit(1);
    }
    return;
  }

  const categoryInfo = categoryMap[category];
  if (!categoryInfo) {
    clack.cancel(chalk.yellow('Invalid category'));
    return showBasicModeMenu();
  }

  const originalCategory = categoryInfo.originalCategory || category;

  // In Basic mode, show subcategories for better organization
  if (categoryInfo.subcategories) {
    // Map subcategories for basic mode
    // For dailyWork, we need to map statusChanges to status/changes
    const subcategoryMap = {};
    if (originalCategory === 'dailyWork') {
      // Map statusChanges commands to status or changes
      const statusCommands = ['status', 'status-short', 'info'];
      const changesCommands = ['diff'];

      // Get all commands from statusChanges subcategory
      const statusChangesCommands = getCommandsByCategory(
        originalCategory,
        'statusChanges',
        config,
        true
      );
      const commitCommands = getCommandsByCategory(originalCategory, 'commit', config, true);

      // Split statusChanges into status and changes
      const statusCmds = statusChangesCommands.filter((cmd) => statusCommands.includes(cmd.name));
      const changesCmds = statusChangesCommands.filter((cmd) => changesCommands.includes(cmd.name));

      subcategoryMap.status = statusCmds;
      subcategoryMap.changes = changesCmds;
      subcategoryMap.commit = commitCommands;
    } else {
      // For other categories, use existing subcategories
      for (const subKey of Object.keys(categoryInfo.subcategories)) {
        subcategoryMap[subKey] = getCommandsByCategory(originalCategory, subKey, config, true);
      }
    }

    // Show subcategory selection
    const subcategoryOptions = [];

    for (const [subKey, subLabel] of Object.entries(categoryInfo.subcategories)) {
      const commands = subcategoryMap[subKey] || [];
      if (commands.length === 0) continue;

      subcategoryOptions.push({
        value: subKey,
        label: `${theme.primary(subLabel)} ${chalk.dim(`(${commands.length})`)}`,
      });
    }

    if (subcategoryOptions.length === 0) {
      clack.cancel(chalk.yellow('No commands available in this category'));
      return showBasicModeMenu();
    }

    subcategoryOptions.push({
      value: '__back__',
      label: chalk.dim('← Previous Menu'),
    });

    const subcategory = await clack.select({
      message: theme.primary(`Select from ${categoryInfo.label}:`),
      options: subcategoryOptions,
    });

    if (clack.isCancel(subcategory) || subcategory === '__back__') {
      return showBasicModeMenu();
    }

    // Show commands from selected subcategory
    const commands = subcategoryMap[subcategory] || [];
    if (commands.length === 0) {
      clack.cancel(chalk.yellow('No commands available in this subcategory'));
      return showBasicModeMenu();
    }

    const commandOptions = commands.map((cmd) => ({
      value: cmd.name,
      label: `${theme.primary(cmd.name)} ${chalk.gray(`- ${cmd.description}`)}`,
    }));

    commandOptions.push({
      value: '__back__',
      label: chalk.dim('← Previous Menu'),
    });

    const selectedCommand = await clack.select({
      message: theme.primary(`Select a command from ${categoryInfo.subcategories[subcategory]}:`),
      options: commandOptions,
    });

    if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
      return showBasicModeMenu();
    }

    // Execute the selected command
    const success = await router.execute(selectedCommand, []);
    if (!success) {
      process.exit(1);
    }
    return;
  }
  // No subcategories, show commands directly
  const commands = getCommandsByCategory(originalCategory, null, config, true);
  if (commands.length === 0) {
    clack.cancel(chalk.yellow('No commands available in this category'));
    return showBasicModeMenu();
  }

  const commandOptions = commands.map((cmd) => ({
    value: cmd.name,
    label: `${theme.primary(cmd.name)} ${chalk.gray(`- ${cmd.description}`)}`,
  }));

  commandOptions.push({
    value: '__back__',
    label: chalk.dim('← Previous Menu'),
  });

  const selectedCommand = await clack.select({
    message: theme.primary(`Select a command from ${categoryInfo.label}:`),
    options: commandOptions,
  });

  if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
    return showBasicModeMenu();
  }

  // Execute the selected command
  const success = await router.execute(selectedCommand, []);
  if (!success) {
    process.exit(1);
  }
}

/**
 * Show full mode menu with search and technical UI
 */
async function showFullModeMenu() {
  const config = getConfig();
  const categoryMap = getCategoryMap('full');
  const theme = getTheme();

  showBanner('GITTABLE', { version: VERSION });

  const modeColor = chalk.blue;
  console.log(
    chalk.gray('Mode: ') + modeColor.bold('Full') + chalk.gray(' - All commands available')
  );
  console.log();

  // Build category options
  const categoryOptions = [];

  // Add search option
  categoryOptions.push({
    value: '__search__',
    label: chalk.yellow('Search Commands') + chalk.dim(' - Find commands quickly'),
  });

  for (const [key, info] of Object.entries(categoryMap)) {
    // Skip empty categories
    if (!hasEnabledCommands(key, config, categoryMap)) {
      continue;
    }

    let count = 0;
    if (info.subcategories) {
      const originalCategory = info.originalCategory || key;
      for (const subKey of Object.keys(info.subcategories)) {
        count += getCommandsByCategory(originalCategory, subKey, config).length;
      }
    } else {
      const originalCategory = info.originalCategory || key;
      count = getCommandsByCategory(originalCategory, null, config).length;
    }

    const label = theme.primary(info.label) + (count > 0 ? chalk.dim(` (${count})`) : '');
    categoryOptions.push({ value: key, label });
  }

  // Add help and exit options
  categoryOptions.push(
    { value: 'help', label: chalk.yellow('List Commands') },
    { value: 'exit', label: chalk.red('Exit') }
  );

  const category = await clack.select({
    message: theme.primary('Select a category:'),
    options: categoryOptions,
  });

  if (clack.isCancel(category) || category === 'exit') {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (category === 'help') {
    showHelp();
    return;
  }

  // Handle search
  if (category === '__search__') {
    const searchQuery = await clack.text({
      message: theme.primary('Search commands (name, alias, or description):'),
      placeholder: 'e.g., commit, push, branch',
    });

    if (clack.isCancel(searchQuery)) {
      return showFullModeMenu();
    }

    if (!searchQuery || searchQuery.trim() === '') {
      clack.cancel(chalk.yellow('Search query cannot be empty'));
      return showFullModeMenu();
    }

    const results = searchCommands(searchQuery.trim(), config);

    if (results.length === 0) {
      clack.cancel(chalk.yellow(`No commands found matching "${searchQuery}"`));
      return showFullModeMenu();
    }

    const searchOptions = results.map((cmd) => {
      const aliases = cmd.aliases.length > 0 ? chalk.dim(` (${cmd.aliases.join(', ')})`) : '';
      return {
        value: cmd.name,
        label: `${theme.primary(cmd.name)}${aliases} ${chalk.gray(`- ${cmd.description}`)}`,
      };
    });

    searchOptions.push({
      value: '__back__',
      label: chalk.dim('← Previous Menu'),
    });

    const selectedCommand = await clack.select({
      message: theme.primary(`Found ${results.length} command(s):`),
      options: searchOptions,
    });

    if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
      return showFullModeMenu();
    }

    const success = await router.execute(selectedCommand, []);
    if (!success) {
      process.exit(1);
    }
    return;
  }

  const categoryInfo = categoryMap[category];
  if (!categoryInfo) {
    clack.cancel(chalk.yellow('Invalid category'));
    return showFullModeMenu();
  }

  const originalCategory = categoryInfo.originalCategory || category;

  // Full mode: Show hierarchical navigation with subcategories
  // For advanced category, use lazy loading with fuzzy search
  if (categoryInfo.subcategories) {
    // Special handling for advanced category with lazy loading
    if (originalCategory === 'advanced') {
      // Show search option first for advanced category
      const subcategoryOptions = [
        {
          value: '__search_advanced__',
          label:
            chalk.yellow('Search Commands') + chalk.dim(' - Fuzzy search all advanced commands'),
        },
      ];

      // Lazy load subcategories - only show if they have commands
      for (const [key, label] of Object.entries(categoryInfo.subcategories)) {
        const commands = getCommandsByCategory(originalCategory, key, config);
        if (commands.length === 0) continue;

        subcategoryOptions.push({
          value: key,
          label: `${theme.primary(label)} ${chalk.dim(`(${commands.length})`)}`,
        });
      }

      if (subcategoryOptions.length === 1) {
        // Only search option, no subcategories
        clack.cancel(chalk.yellow('No commands available in this category'));
        return showFullModeMenu();
      }

      subcategoryOptions.push({
        value: '__back__',
        label: chalk.dim('← Previous Menu'),
      });

      const subcategory = await clack.select({
        message: theme.primary(`Select from ${categoryInfo.label}:`),
        options: subcategoryOptions,
      });

      if (clack.isCancel(subcategory) || subcategory === '__back__') {
        return showFullModeMenu();
      }

      // Handle fuzzy search for advanced category
      if (subcategory === '__search_advanced__') {
        const searchQuery = await clack.text({
          message: theme.primary('Search advanced commands (fuzzy search):'),
          placeholder: 'e.g., undo, stash, rebase',
        });

        if (clack.isCancel(searchQuery)) {
          return showFullModeMenu();
        }

        if (!searchQuery || searchQuery.trim() === '') {
          clack.cancel(chalk.yellow('Search query cannot be empty'));
          return showFullModeMenu();
        }

        // Get all advanced commands
        const allAdvancedCommands = [];
        for (const subKey of Object.keys(categoryInfo.subcategories)) {
          const commands = getCommandsByCategory(originalCategory, subKey, config);
          allAdvancedCommands.push(...commands);
        }

        // Use fuzzy search
        const results = fuzzySearchCommands(allAdvancedCommands, searchQuery.trim());

        if (results.length === 0) {
          clack.cancel(chalk.yellow(`No commands found matching "${searchQuery}"`));
          return showFullModeMenu();
        }

        const searchOptions = results.map((cmd) => {
          const aliases = cmd.aliases.length > 0 ? chalk.dim(` (${cmd.aliases.join(', ')})`) : '';
          return {
            value: cmd.name,
            label: `${theme.primary(cmd.name)}${aliases} ${chalk.gray(`- ${cmd.description}`)}`,
          };
        });

        searchOptions.push({
          value: '__back__',
          label: chalk.dim('← Previous Menu'),
        });

        const selectedCommand = await clack.select({
          message: theme.primary(`Found ${results.length} command(s) (most similar first):`),
          options: searchOptions,
        });

        if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
          return showFullModeMenu();
        }

        const success = await router.execute(selectedCommand, []);
        if (!success) {
          process.exit(1);
        }
        return;
      }

      // Regular subcategory selection
      const commands = getCommandsByCategory(originalCategory, subcategory, config);
      if (commands.length === 0) {
        clack.cancel(chalk.yellow('No commands available in this subcategory'));
        return showFullModeMenu();
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

      const selectedCommand = await clack.select({
        message: theme.primary(`Select a command from ${categoryInfo.subcategories[subcategory]}:`),
        options: commandOptions,
      });

      if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
        return showFullModeMenu();
      }

      // Execute the selected command
      const success = await router.execute(selectedCommand, []);
      if (!success) {
        process.exit(1);
      }
    } else {
      // Regular category handling (non-advanced)
      const subcategoryOptions = [];

      for (const [key, label] of Object.entries(categoryInfo.subcategories)) {
        const commands = getCommandsByCategory(originalCategory, key, config);
        if (commands.length === 0) continue;

        subcategoryOptions.push({
          value: key,
          label: `${theme.primary(label)} ${chalk.dim(`(${commands.length})`)}`,
        });
      }

      if (subcategoryOptions.length === 0) {
        clack.cancel(chalk.yellow('No commands available in this category'));
        return showFullModeMenu();
      }

      subcategoryOptions.push({
        value: '__back__',
        label: chalk.dim('← Previous Menu'),
      });

      const subcategory = await clack.select({
        message: theme.primary(`Select from ${categoryInfo.label}:`),
        options: subcategoryOptions,
      });

      if (clack.isCancel(subcategory) || subcategory === '__back__') {
        return showFullModeMenu();
      }

      // Third level: Select command from subcategory
      const commands = getCommandsByCategory(originalCategory, subcategory, config);
      if (commands.length === 0) {
        clack.cancel(chalk.yellow('No commands available in this subcategory'));
        return showFullModeMenu();
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

      const selectedCommand = await clack.select({
        message: theme.primary(`Select a command from ${categoryInfo.subcategories[subcategory]}:`),
        options: commandOptions,
      });

      if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
        return showFullModeMenu();
      }

      // Execute the selected command
      const success = await router.execute(selectedCommand, []);
      if (!success) {
        process.exit(1);
      }
    }
  } else {
    // No subcategories, show commands directly
    const commands = getCommandsByCategory(originalCategory, null, config);
    if (commands.length === 0) {
      clack.cancel(chalk.yellow('No commands available in this category'));
      return showFullModeMenu();
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

    const selectedCommand = await clack.select({
      message: theme.primary(`Select a command from ${categoryInfo.label}:`),
      options: commandOptions,
    });

    if (clack.isCancel(selectedCommand) || selectedCommand === '__back__') {
      return showFullModeMenu();
    }

    // Execute the selected command
    const success = await router.execute(selectedCommand, []);
    if (!success) {
      process.exit(1);
    }
  }
}

/**
 * Show interactive menu with mode-appropriate UI
 */
async function showInteractiveMenu() {
  const config = getConfig();
  const mode = config?.mode || 'full';

  if (mode === 'basic') {
    return showBasicModeMenu();
  }
  return showFullModeMenu();
}

module.exports = {
  showHelp,
  showInteractiveMenu,
};

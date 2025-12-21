const chalk = require('chalk');
const { getTheme } = require('./color-theme');

/**
 * Parse common git errors and provide actionable suggestions
 */
function parseGitError(error, command) {
  const errorStr = error.toString().toLowerCase();
  const suggestions = [];

  // Common error patterns
  if (errorStr.includes('not a git repository')) {
    return {
      message: 'Not a git repository',
      suggestion: 'Initialize a repository with: gittable init',
      solution: 'gittable init',
    };
  }

  if (errorStr.includes('nothing to commit')) {
    return {
      message: 'No changes to commit',
      suggestion: 'Stage files first with: gittable add',
      solution: 'gittable add',
    };
  }

  if (errorStr.includes('no changes added to commit')) {
    return {
      message: 'No changes staged for commit',
      suggestion: 'Stage files with: gittable add',
      solution: 'gittable add',
    };
  }

  if (errorStr.includes('updates were rejected')) {
    return {
      message: 'Push rejected - branch is behind remote',
      suggestion: 'Pull changes first: gittable pull or gittable sync',
      solution: 'gittable pull',
    };
  }

  if (errorStr.includes('merge conflict')) {
    return {
      message: 'Merge conflict detected',
      suggestion: 'Resolve conflicts manually or use: gittable mergetool',
      solution: 'gittable mergetool',
    };
  }

  if (errorStr.includes('branch') && errorStr.includes('not found')) {
    return {
      message: 'Branch not found',
      suggestion: 'List branches with: gittable branch',
      solution: 'gittable branch',
    };
  }

  if (errorStr.includes('remote') && errorStr.includes('not found')) {
    return {
      message: 'Remote not found',
      suggestion: 'Add remote with: gittable remote add <name> <url>',
      solution: 'gittable remote add',
    };
  }

  if (errorStr.includes('permission denied')) {
    return {
      message: 'Permission denied',
      suggestion: 'Check your SSH keys or credentials',
      solution: null,
    };
  }

  if (errorStr.includes('authentication failed')) {
    return {
      message: 'Authentication failed',
      suggestion: 'Check your credentials or use SSH keys',
      solution: null,
    };
  }

  // Default error
  return {
    message: error.toString().split('\n')[0] || 'Operation failed',
    suggestion: 'Check the error message above for details',
    solution: null,
  };
}

/**
 * Display enhanced error message with suggestions
 */
function displayEnhancedError(error, command = null) {
  const parsed = parseGitError(error, command);

  console.log();
  console.log(chalk.red.bold('Error:'), chalk.red(parsed.message));

  if (parsed.suggestion) {
    console.log(chalk.yellow('💡 Suggestion:'), chalk.gray(parsed.suggestion));
  }

  if (parsed.solution) {
    const theme = getTheme();
    console.log(theme.primary('→ Try:'), chalk.bold(theme.primary(parsed.solution)));
  }

  console.log();
}

module.exports = {
  parseGitError,
  displayEnhancedError,
};

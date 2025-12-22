const path = require('node:path');
const fs = require('node:fs');
const findConfig = require('find-config');
const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { getTheme } = require('../../utils/color-theme');

const CONFIG_NAMES = ['.gittable.js', '.gittable.json'];
const EXAMPLE_CONFIG = '.gittable.example.js';

/**
 * Find the git root directory
 */
function findGitRoot(startPath = process.cwd()) {
  let current = path.resolve(startPath);
  const root = path.parse(current).root;

  while (current !== root) {
    const gitDir = path.join(current, '.git');
    if (fs.existsSync(gitDir)) {
      return current;
    }
    current = path.dirname(current);
  }

  return null;
}

/**
 * Check if config file exists
 */
function configExists() {
  // Try .gittable.js
  const jsConfig = findConfig(CONFIG_NAMES[0], { home: false });
  if (jsConfig) {
    return true;
  }

  // Try .gittable.json
  const jsonConfig = findConfig(CONFIG_NAMES[1], { home: false });
  if (jsonConfig) {
    return true;
  }

  return false;
}

/**
 * Find the directory where config should be created
 */
function findConfigDirectory() {
  // First, try to find git root
  const gitRoot = findGitRoot();
  if (gitRoot) {
    return gitRoot;
  }

  // Otherwise, use current directory
  return process.cwd();
}

/**
 * Find the example config file
 */
function findExampleConfig() {
  // Try to find .gittable.example.js in current directory or git root
  const gitRoot = findGitRoot();
  const searchPaths = [process.cwd()];
  if (gitRoot) {
    searchPaths.push(gitRoot);
  }

  for (const searchPath of searchPaths) {
    const examplePath = path.join(searchPath, EXAMPLE_CONFIG);
    if (fs.existsSync(examplePath)) {
      return examplePath;
    }
  }

  // Try to find in package directory (works for both installed package and source)
  try {
    // First try as installed package
    const packagePath = require.resolve('@gg-santos/gittable/package.json');
    const packageDir = path.dirname(packagePath);
    const examplePath = path.join(packageDir, EXAMPLE_CONFIG);
    if (fs.existsSync(examplePath)) {
      return examplePath;
    }
  } catch (error) {
    // Package not found as installed package, try source location
    try {
      // Try to find from current file location (when running from source)
      const currentFileDir = __dirname;
      // Go up from src/core/config to project root
      const projectRoot = path.resolve(currentFileDir, '../../../');
      const examplePath = path.join(projectRoot, EXAMPLE_CONFIG);
      if (fs.existsSync(examplePath)) {
        return examplePath;
      }
    } catch (sourceError) {
      // Continue to next attempt
    }
  }

  return null;
}

/**
 * Run first-time setup
 */
async function runSetup() {
  // Check if config already exists
  if (configExists()) {
    return null; // No setup needed
  }

  // Only run setup in interactive mode (TTY)
  if (!process.stdin.isTTY) {
    // Non-interactive mode, skip setup
    return null;
  }

  // Show welcome message
  const { showBanner } = require('../../ui/banner');
  showBanner('GITTABLE', { version: require('../../../package.json').version });
  const theme = getTheme();
  console.log();
  console.log(chalk.bold(theme.primary('Welcome to Gittable!')));
  console.log();

  // Find where to create config
  const configDir = findConfigDirectory();
  const configPath = path.join(configDir, CONFIG_NAMES[0]);

  // Find example config
  const examplePath = findExampleConfig();
  if (!examplePath) {
    prompts.cancel(chalk.red('Could not find .gittable.example.js'));
    console.log(chalk.yellow('Please ensure .gittable.example.js exists in the project.'));
    return null;
  }

  // Read example config
  let configContent;
  try {
    configContent = fs.readFileSync(examplePath, 'utf8');
  } catch (error) {
    prompts.cancel(chalk.red('Failed to read example config'));
    console.error(error);
    return null;
  }

  // Remove mode setting from config (mode system has been removed)
  // Comment out or remove mode line if present
  configContent = configContent.replace(
    /mode:\s*['"]\w+['"],?\s*\/\/.*/g,
    "// mode: 'full', // Deprecated - no longer used"
  );
  configContent = configContent.replace(/mode:\s*['"]\w+['"],?/g, "// mode: 'full', // Deprecated");

  // Write config file
  try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    prompts.log.success(chalk.green(`Configuration created: ${configPath}`));
    prompts.log.info(chalk.gray('All commands are now available (mode system removed)'));
    console.log();
    return { path: configPath };
  } catch (error) {
    prompts.cancel(chalk.red('Failed to create config file'));
    console.error(error);
    return null;
  }
}

module.exports = {
  runSetup,
  configExists,
  findConfigDirectory,
};

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { execGit } = require('../core/git');
const chalk = require('chalk');

/**
 * Check if git hooks directory exists
 */
function getHooksDir() {
  const result = execGit('rev-parse --git-dir', { silent: true });
  if (!result.success) {
    return null;
  }

  const gitDir = result.output.trim();
  return path.join(gitDir, 'hooks');
}

/**
 * List available git hooks
 */
function listHooks() {
  const hooksDir = getHooksDir();
  if (!hooksDir || !fs.existsSync(hooksDir)) {
    return [];
  }

  const hooks = [];
  const hookFiles = fs.readdirSync(hooksDir);

  for (const file of hookFiles) {
    const filePath = path.join(hooksDir, file);
    if (fs.statSync(filePath).isFile() && !file.endsWith('.sample')) {
      hooks.push({
        name: file,
        path: filePath,
        executable: !!(fs.statSync(filePath).mode & 0o111),
      });
    }
  }

  return hooks;
}

/**
 * Check if a specific hook exists
 */
function hookExists(hookName) {
  const hooksDir = getHooksDir();
  if (!hooksDir) {
    return false;
  }

  const hookPath = path.join(hooksDir, hookName);
  return fs.existsSync(hookPath);
}

/**
 * Run a git hook and return result
 */
function runHook(hookName, args = []) {
  const hooksDir = getHooksDir();
  if (!hooksDir) {
    return { success: true, output: '', error: null }; // No hooks dir, skip
  }

  const hookPath = path.join(hooksDir, hookName);
  if (!fs.existsSync(hookPath)) {
    return { success: true, output: '', error: null }; // Hook doesn't exist, skip
  }

  const startTime = Date.now();

  try {
    const result = execSync(`"${hookPath}" ${args.join(' ')}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const duration = Date.now() - startTime;
    return {
      success: true,
      output: result.toString(),
      error: null,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const stderr = error.stderr?.toString() || '';
    const stdout = error.stdout?.toString() || '';

    return {
      success: false,
      output: stdout,
      error: stderr || error.message,
      duration,
    };
  }
}

/**
 * Check pre-commit hook before committing
 */
async function checkPreCommitHook() {
  if (!hookExists('pre-commit')) {
    return { exists: false, shouldRun: false };
  }

  const { promptConfirm } = require('./command-helpers');
  const clack = require('@clack/prompts');

  const runHook = await promptConfirm('Run pre-commit hook?', true);

  if (!runHook) {
    const skipHook = await promptConfirm('Skip pre-commit hook? (Use --no-verify to skip)', false);
    return { exists: true, shouldRun: !skipHook, skip: skipHook };
  }

  return { exists: true, shouldRun: true };
}

module.exports = {
  getHooksDir,
  listHooks,
  hookExists,
  runHook,
  checkPreCommitHook,
};

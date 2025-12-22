const { execSync } = require('node:child_process');
const chalk = require('chalk');
const prompts = require('../../ui/prompts');

/**
 * Run pre-commit validation (tests, linting, etc.)
 */
async function runPreCommitValidation(options = {}) {
  const { runTests = false, runLint = false, skipOnError = false } = options;

  const validations = [];

  // Check for package.json to determine project type
  const fs = require('node:fs');
  const path = require('node:path');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const hasPackageJson = fs.existsSync(packageJsonPath);

  if (hasPackageJson) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      // Check for test script
      if (runTests && scripts.test) {
        validations.push({
          name: 'Tests',
          command: 'npm test',
          script: 'test',
        });
      }

      // Check for lint script
      if (runLint && scripts.lint) {
        validations.push({
          name: 'Linting',
          command: 'npm run lint',
          script: 'lint',
        });
      }
    } catch (error) {
      // Ignore package.json parse errors
    }
  }

  if (validations.length === 0) {
    return { success: true, skipped: true };
  }

  const results = [];

  for (const validation of validations) {
    const spinner = prompts.spinner();
    spinner.start(`Running ${validation.name}...`);

    try {
      execSync(validation.command, {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      spinner.stop();
      results.push({
        name: validation.name,
        success: true,
      });
      prompts.note(`${validation.name} passed`, chalk.green('Validation'));
    } catch (error) {
      spinner.stop();
      results.push({
        name: validation.name,
        success: false,
        error: error.message,
      });

      if (skipOnError) {
        prompts.cancel(chalk.red(`${validation.name} failed`));
        return { success: false, results };
      }

      const { promptConfirm } = require('./command-helpers');
      const continueAnyway = await promptConfirm(
        `${validation.name} failed. Continue with commit anyway?`,
        false
      );

      if (!continueAnyway) {
        prompts.cancel(chalk.red('Commit cancelled'));
        return { success: false, cancelled: true, results };
      }
    }
  }

  return { success: true, results };
}

module.exports = {
  runPreCommitValidation,
};

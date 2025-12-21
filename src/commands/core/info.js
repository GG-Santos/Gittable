const clack = require('@clack/prompts');
const chalk = require('chalk');
const {
  getStatus,
  getCurrentBranch,
  getLog,
  getStashList,
  remoteExists,
} = require('../../core/git');
const { showCommandHeader } = require('../../utils/command-helpers');

/**
 * Info command - Quick repository overview
 */
module.exports = async (_args) => {
  showCommandHeader('INFO', 'Repository Information');

  const branch = getCurrentBranch();
  const status = getStatus();
  const lastCommit = getLog(1)[0];
  const stashes = getStashList();
  const hasRemote = remoteExists();

  console.log();
  console.log(chalk.bold.cyan('Branch:'));
  console.log(`  ${chalk.cyan(branch || 'unknown')}`);

  if (hasRemote && status) {
    console.log();
    console.log(chalk.bold.cyan('Remote Status:'));
    if (status.ahead > 0) {
      console.log(`  ${chalk.yellow(`↑ ${status.ahead} commit(s) ahead`)}`);
    }
    if (status.behind > 0) {
      console.log(`  ${chalk.yellow(`↓ ${status.behind} commit(s) behind`)}`);
    }
    if (status.diverged) {
      console.log(`  ${chalk.red('⚠ Diverged from remote')}`);
    }
    if (status.ahead === 0 && status.behind === 0 && !status.diverged) {
      console.log(`  ${chalk.green('✓ Up to date')}`);
    }

    // Show CI/CD and PR links if available
    const { getCIStatusUrl, getPRUrl } = require('../../utils/ci-status');
    const ciUrl = getCIStatusUrl(branch);
    const prUrl = getPRUrl(branch);

    if (ciUrl || prUrl) {
      console.log();
      console.log(chalk.bold.cyan('Links:'));
      if (ciUrl) {
        console.log(`  ${chalk.blue('CI/CD:')} ${chalk.dim(ciUrl)}`);
      }
      if (prUrl) {
        console.log(`  ${chalk.blue('Create PR:')} ${chalk.dim(prUrl)}`);
      }
    }
  }

  if (status) {
    console.log();
    console.log(chalk.bold.cyan('Changes:'));
    if (status.staged.length > 0) {
      console.log(`  ${chalk.green(`+ ${status.staged.length} staged`)}`);
    }
    if (status.unstaged.length > 0) {
      console.log(`  ${chalk.yellow(`M ${status.unstaged.length} modified`)}`);
    }
    if (status.untracked.length > 0) {
      console.log(`  ${chalk.cyan(`? ${status.untracked.length} untracked`)}`);
    }
    if (
      status.staged.length === 0 &&
      status.unstaged.length === 0 &&
      status.untracked.length === 0
    ) {
      console.log(`  ${chalk.gray('No changes')}`);
    }
  }

  if (lastCommit) {
    console.log();
    console.log(chalk.bold.cyan('Last Commit:'));
    console.log(`  ${chalk.dim(lastCommit.hash)} ${lastCommit.message}`);
    console.log(`  ${chalk.dim(`${lastCommit.author}, ${lastCommit.date}`)}`);
  }

  if (stashes.length > 0) {
    console.log();
    console.log(chalk.bold.cyan('Stashes:'));
    console.log(`  ${chalk.yellow(`${stashes.length} stash(es)`)}`);
  }

  console.log();
  clack.outro(chalk.green.bold('Info complete'));
};

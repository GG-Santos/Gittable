const chalk = require('chalk');
const ui = require('../../ui/framework');
const {
  getStatus,
  getCurrentBranch,
  getLog,
  getStashList,
  remoteExists,
} = require('../../core/git');
const { showCommandHeader } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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
  const theme = getTheme();

  console.log();
  console.log(theme.primary(chalk.bold('Branch:')));
  console.log(`  ${theme.primary(branch || 'unknown')}`);

  if (hasRemote && status) {
    console.log();
    console.log(theme.primary(chalk.bold('Remote Status:')));
    if (status.ahead > 0) {
      console.log(`  ${theme.warning(`↑ ${status.ahead} commit(s) ahead`)}`);
    }
    if (status.behind > 0) {
      console.log(`  ${theme.warning(`↓ ${status.behind} commit(s) behind`)}`);
    }
    if (status.diverged) {
      console.log(`  ${theme.error('⚠ Diverged from remote')}`);
    }
    if (status.ahead === 0 && status.behind === 0 && !status.diverged) {
      console.log(`  ${theme.success('✓ Up to date')}`);
    }

    // Show CI/CD and PR links if available
    const { getCIStatusUrl, getPRUrl } = require('../../utils/git');
    const ciUrl = getCIStatusUrl(branch);
    const prUrl = getPRUrl(branch);

    if (ciUrl || prUrl) {
      console.log();
      console.log(theme.primary(chalk.bold('Links:')));
      if (ciUrl) {
        console.log(`  ${theme.info('CI/CD:')} ${theme.dim(ciUrl)}`);
      }
      if (prUrl) {
        console.log(`  ${theme.info('Create PR:')} ${theme.dim(prUrl)}`);
      }
    }
  }

  if (status) {
    console.log();
    console.log(theme.primary(chalk.bold('Changes:')));
    if (status.staged.length > 0) {
      console.log(`  ${theme.success(`+ ${status.staged.length} staged`)}`);
    }
    if (status.unstaged.length > 0) {
      console.log(`  ${theme.warning(`M ${status.unstaged.length} modified`)}`);
    }
    if (status.untracked.length > 0) {
      console.log(`  ${theme.info(`? ${status.untracked.length} untracked`)}`);
    }
    if (
      status.staged.length === 0 &&
      status.unstaged.length === 0 &&
      status.untracked.length === 0
    ) {
      console.log(`  ${theme.dim('No changes')}`);
    }
  }

  if (lastCommit) {
    console.log();
    console.log(theme.primary(chalk.bold('Last Commit:')));
    console.log(`  ${theme.dim(lastCommit.hash)} ${lastCommit.message}`);
    console.log(`  ${theme.dim(`${lastCommit.author}, ${lastCommit.date}`)}`);
  }

  if (stashes.length > 0) {
    console.log();
    console.log(theme.primary(chalk.bold('Stashes:')));
    console.log(`  ${theme.warning(`${stashes.length} stash(es)`)}`);
  }

  ui.success('Info complete');
};

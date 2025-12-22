const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  showBanner('CHERRY-PICK');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Cherry-pick Commit')}`);

  let commit = args[0];
  const noCommit = args.includes('--no-commit') || args.includes('-n');
  const continuePick = args.includes('--continue');
  const abortPick = args.includes('--abort');

  if (continuePick) {
    const spinner = ui.prompt.spinner();
    spinner.start('Continuing cherry-pick');
    const result = execGit('cherry-pick --continue', { silent: false });
    spinner.stop();

    if (result.success) {
      ui.success('Cherry-pick continued');
    } else {
      ui.error('Cherry-pick continue failed', {
        suggestion: result.error,
        exit: true,
      });
    }
    return;
  }

  if (abortPick) {
    if (!process.stdin.isTTY) {
      ui.error('Interactive mode required', {
        suggestion: 'This command requires interactive confirmation.',
        exit: true,
      });
    }

    const confirm = await ui.prompt.confirm({
      message: 'Abort cherry-pick? This will lose any progress.',
      initialValue: false,
    });

    if (!confirm) {
      return;
    }

    const spinner = ui.prompt.spinner();
    spinner.start('Aborting cherry-pick');
    const result = execGit('cherry-pick --abort', { silent: true });
    spinner.stop();

    if (result.success) {
      ui.success('Cherry-pick aborted');
    } else {
      ui.error('Failed to abort cherry-pick', {
        suggestion: result.error,
        exit: true,
      });
    }
    return;
  }

  if (!commit) {
    if (!process.stdin.isTTY) {
      ui.error('Interactive mode required', {
        suggestion: 'Please provide a commit hash: gittable cherry-pick <commit>',
        exit: true,
      });
    }

    commit = await ui.prompt.text({
      message: 'Commit hash to cherry-pick:',
      placeholder: 'abc1234',
    });

    if (commit === null) return;
  }

  const spinner = ui.prompt.spinner();
  spinner.start(`Cherry-picking commit ${commit}`);

  let command = 'cherry-pick';
  if (noCommit) {
    command += ' --no-commit';
  }
  command += ` ${commit}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success(`Cherry-picked commit ${commit}`);
  } else {
    ui.error('Cherry-pick failed', {
      suggestion: result.error,
    });
    ui.warn('You may need to resolve conflicts manually');
    ui.info('Use "gittable cherry-pick --continue" to continue after resolving');
    ui.info('Use "gittable cherry-pick --abort" to abort');
    const { GitError } = require('../../core/errors');
    throw new GitError('Cherry-pick failed', 'cherry-pick', {
      suggestion: result.error || 'Resolve conflicts and continue',
    });
  }
};

const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getCurrentBranch } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/commands');
const { ensureRemoteExists, getValidBranch } = require('../../utils/git');
const prompts = require('../../ui/prompts');

module.exports = async (args) => {
  showCommandHeader('PUSH', 'Push to Remote');

  const branch = getCurrentBranch();
  const remote = args[0] || 'origin';
  let branchName = args[1] || branch;
  const force = args.includes('--force') || args.includes('-f');
  const forceWithLease = args.includes('--force-with-lease') || args.includes('--lease');
  const pushTags = args.includes('--tags') || args.includes('-t');
  const pushAll = args.includes('--all') || args.includes('-a');
  const setUpstream = args.includes('--set-upstream') || args.includes('-u') || args.includes('--upstream');

  // Validate branch exists
  branchName = getValidBranch(branchName, 'pushing');

  // Ensure remote exists (prompts to add if missing)
  await ensureRemoteExists(remote);

  // Determine push type from flags first, or show interactive menu if no flags
  let pushType = null;
  
  // Check flags first (flags take priority)
  if (force) {
    pushType = 'force';
  } else if (forceWithLease) {
    pushType = 'force-with-lease';
  } else if (pushTags) {
    pushType = 'tags';
  } else if (pushAll) {
    pushType = 'all';
  } else if (setUpstream) {
    pushType = 'upstream';
  }
  
  // If no push type specified via flags and TTY, show interactive menu
  if (!pushType && process.stdin.isTTY) {
    const action = await prompts.select({
      message: 'How would you like to push?',
      options: [
        { 
          value: 'normal', 
          label: chalk.green('Normal Push') + chalk.dim(' - Standard push (default)') 
        },
        { 
          value: 'upstream', 
          label: chalk.cyan('Set Upstream & Push') + chalk.dim(' - Push and set upstream tracking') 
        },
        { 
          value: 'force-with-lease', 
          label: chalk.yellow('Force Push (Lease)') + chalk.dim(' - Safer force push') 
        },
        { 
          value: 'force', 
          label: chalk.red('Force Push') + chalk.dim(' - Overwrite remote (dangerous)') 
        },
        { 
          value: 'tags', 
          label: chalk.blue('Push Tags') + chalk.dim(' - Push all tags') 
        },
        { 
          value: 'all', 
          label: chalk.magenta('Push All Branches') + chalk.dim(' - Push all branches') 
        },
      ],
    });

    if (prompts.isCancel(action)) {
      prompts.cancel(chalk.yellow('Cancelled'));
      return;
    }

    pushType = action;
  }
  
  // Default to normal push if nothing specified
  if (!pushType) {
    pushType = 'normal';
  }

  // Check branch protection
  const { checkBranchProtection } = require('../../utils/git');
  const protection = checkBranchProtection(branchName, (pushType === 'force' || pushType === 'force-with-lease') ? 'force' : 'push');

  if (protection.isProtected) {
    ui.warn(protection.warning, {
      action: protection.message,
    });
    if (protection.suggestion) {
      ui.info(protection.suggestion);
    }

    const proceed = await promptConfirm('Proceed anyway?', false);
    if (!proceed) {
      return;
    }
  }

  // Handle force push confirmation
  if (pushType === 'force' || pushType === 'force-with-lease') {
    requireTTY([
      'Force push requires confirmation.',
      'Please use: gittable push <remote> <branch> --force or --force-with-lease (with confirmation)',
    ]);

    const warning = pushType === 'force-with-lease'
      ? 'Force push with lease? This will overwrite remote history only if remote hasn\'t changed since last fetch (safer).'
      : 'Force push? This can overwrite remote history.';

    const confirmed = await promptConfirm(warning, false);
    if (!confirmed) return;
  }

  // Execute push with spinner
  let command = 'push';
  
  if (pushType === 'tags') {
    command += ` ${remote} --tags`;
  } else if (pushType === 'all') {
    command += ` ${remote} --all`;
  } else {
    command += ` ${remote} ${branchName}`;
    if (pushType === 'upstream') {
      command += ' --set-upstream';
    } else if (pushType === 'force-with-lease') {
      command += ' --force-with-lease';
    } else if (pushType === 'force') {
      command += ' --force';
    }
  }

  const spinnerText = pushType === 'tags' 
    ? `Pushing tags to ${remote}`
    : pushType === 'all'
    ? `Pushing all branches to ${remote}`
    : `Pushing to ${remote}/${branchName}`;

  const result = await execGitWithSpinner(command, {
    spinnerText,
    silent: true, // Capture output to format it nicely
    successMessage: null, // We'll format it ourselves
    errorMessage: 'Push failed',
    onSuccess: async (result) => {
      // Format and display git output nicely
      // Git push writes output to stderr (not stdout), so check stderr first
      const pushOutput = result.stderr || result.output || '';
      
      if (pushOutput.trim()) {
        const outputLines = pushOutput.trim().split('\n');
        outputLines.forEach(line => {
          const trimmed = line.trim();
          // Filter out warnings and empty lines
          if (trimmed && 
              !trimmed.includes('CRLF') && 
              !trimmed.includes('LF') &&
              !trimmed.includes('warning:')) {
            // Format git push output with proper indentation
            console.log(`   ${chalk.dim(trimmed)}`);
          }
        });
      }
      
      ui.success('Push completed');
      // Suggest creating PR after successful push
      if (process.stdin.isTTY && branchName !== 'main' && branchName !== 'master') {
        const { getPRUrl, detectCIPlatform } = require('../../utils/git');
        const platform = detectCIPlatform();
        if (platform) {
          const { showSmartSuggestion } = require('../../utils/commands');
          const nextAction = await showSmartSuggestion(
            'Push successful. What would you like to do next?',
            [
              {
                value: 'create-pr',
                label: chalk.cyan('Create PR') + chalk.dim(' - Open PR creation page'),
              },
              { value: 'skip', label: chalk.gray('Skip') },
            ]
          );

          if (nextAction && nextAction !== 'skip') {
            const router = require('../../cli/router');
            await router.execute(nextAction, []);
          }
        }
      }
    },
    onError: async (errorResult) => {
      // Smart suggestion: offer to pull or force push if push fails due to being behind
      if (errorResult.error?.includes('Updates were rejected')) {
        const { showSmartSuggestion } = require('../../utils/commands');
        if (process.stdin.isTTY) {
          const nextAction = await showSmartSuggestion(
            'Push failed. Your branch may be behind. What would you like to do?',
            [
              {
                value: 'pull',
                label: chalk.green('Pull') + chalk.dim(' - Pull and merge changes'),
              },
              {
                value: 'pull-rebase',
                label: chalk.cyan('Pull & Rebase') + chalk.dim(' - Pull and rebase'),
              },
              {
                value: 'sync',
                label: chalk.cyan('Sync') + chalk.dim(' - Fetch, rebase, and push'),
              },
              {
                value: 'force-with-lease',
                label: chalk.yellow('Force Push (Lease)') + chalk.dim(' - Safer force push'),
              },
              {
                value: 'force',
                label: chalk.red('Force Push') + chalk.dim(' - Overwrite remote (dangerous)'),
              },
              { value: 'skip', label: chalk.gray('Skip') },
            ]
          );

          if (nextAction && nextAction !== 'skip') {
            const router = require('../../cli/router');
            // Handle pull-rebase by redirecting to pull with --rebase flag
            if (nextAction === 'pull-rebase') {
              await router.execute('pull', remote ? [remote, '--rebase'] : ['--rebase']);
            } else if (nextAction === 'force' || nextAction === 'force-with-lease') {
              // Handle force push options
              const forceArgs = remote ? [remote, branchName, `--${nextAction}`] : [branchName, `--${nextAction}`];
              await router.execute('push', forceArgs);
            } else {
              await router.execute(nextAction, remote ? [remote] : []);
            }
          }
        }
      }
    },
  });

  return result;
};

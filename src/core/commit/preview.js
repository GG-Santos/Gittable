/**
 * Commit preview module
 * Handles displaying commit previews and message editing
 */

const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { getStagedFilesInfo } = require('./validation');

/**
 * Show commit preview with staged files info
 */
function showCommitPreview(message, options = {}) {
  const { showStagedFiles = true } = options;

  if (showStagedFiles) {
    const stagedInfo = getStagedFilesInfo();
    if (stagedInfo.count > 0) {
      const filesPreview = stagedInfo.files.join(', ');
      const moreText = stagedInfo.hasMore ? ` and ${stagedInfo.count - 10} more` : '';
      prompts.note(
        `${stagedInfo.count} file(s) staged: ${filesPreview}${moreText}`,
        chalk.dim('Staged Files')
      );
    }
  }

  prompts.note(message, chalk.bold('Commit Preview'));
}

/**
 * Review and optionally edit commit message
 */
async function reviewCommitMessage(message, options = {}) {
  const { showStagedFiles = true } = options;
  let proceedWithCommit = false;
  let finalMessage = message;

  while (!proceedWithCommit) {
    const action = await prompts.select({
      message: chalk.yellow('Review commit message'),
      options: [
        { value: 'commit', label: chalk.green('✓ Commit') + chalk.dim(' - Proceed with this message') },
        { value: 'edit', label: chalk.cyan('✎ Edit') + chalk.dim(' - Edit the commit message') },
        { value: 'view-full', label: chalk.blue('👁 View Full') + chalk.dim(' - View complete message') },
        { value: 'cancel', label: chalk.red('✖ Cancel') },
      ],
    });

    if (prompts.isCancel(action) || action === 'cancel') {
      return { cancelled: true, message: null };
    }

    if (action === 'commit') {
      proceedWithCommit = true;
      finalMessage = message;
      break;
    }

    if (action === 'view-full') {
      console.log('\n' + chalk.bold('Full Commit Message:'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(finalMessage);
      console.log(chalk.gray('─'.repeat(60)) + '\n');
      continue;
    }

    if (action === 'edit') {
      // Allow editing the commit message
      const editedMessage = await prompts.text({
        message: 'Edit commit message:',
        placeholder: message.split('\n')[0],
        initialValue: message,
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Commit message cannot be empty';
          }
          return null;
        },
      });

      if (prompts.isCancel(editedMessage)) {
        continue; // Go back to action selection
      }

      if (editedMessage && editedMessage.trim()) {
        finalMessage = editedMessage.trim();
        message = finalMessage;
        // Show updated preview
        showCommitPreview(finalMessage, { showStagedFiles });
      }
    }
  }

  return { cancelled: false, message: finalMessage };
}

module.exports = {
  showCommitPreview,
  reviewCommitMessage,
};


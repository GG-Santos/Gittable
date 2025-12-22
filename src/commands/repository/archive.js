const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  showCommandHeader('ARCHIVE', 'Create Archive');

  requireTTY(
    'Please use: git archive --format=<format> --output=<file> <tree-ish> for non-interactive mode'
  );

  // Parse arguments
  const format =
    args.find((arg) => arg.startsWith('--format='))?.split('=')[1] ||
    args.find((arg) => arg === '--tar' || arg === '--zip')?.replace('--', '') ||
    null;

  const output =
    args.find((arg) => arg.startsWith('--output='))?.split('=')[1] ||
    args.find((arg) => arg.startsWith('-o='))?.split('=')[1] ||
    null;

  const treeish = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-')) || 'HEAD';
  const prefix = args.find((arg) => arg.startsWith('--prefix='))?.split('=')[1] || null;

  // Interactive prompts if needed
  let selectedFormat = format;
  if (!selectedFormat) {
    selectedFormat = await ui.prompt.select({
      message: 'Archive format:',
      options: [
        { value: 'tar', label: 'TAR (.tar)' },
        { value: 'tar.gz', label: 'TAR GZIP (.tar.gz)' },
        { value: 'zip', label: 'ZIP (.zip)' },
      ],
    });
    if (selectedFormat === null) return;
  }

  let outputFile = output;
  if (!outputFile) {
    const defaultName = `archive-${treeish.replace(/[^a-zA-Z0-9]/g, '-')}.${selectedFormat === 'tar.gz' ? 'tar.gz' : selectedFormat}`;
    outputFile = await ui.prompt.text({
      message: 'Output file:',
      placeholder: defaultName,
      initialValue: defaultName,
    });
    if (outputFile === null) return;
  }

  // Build command
  if (selectedFormat === 'tar.gz') {
    // For tar.gz, we need to pipe through gzip
    const { execSync } = require('node:child_process');
    const fs = require('node:fs');
    const zlib = require('node:zlib');
    const spinner = ui.prompt.spinner();
    spinner.start(`Creating archive ${outputFile}`);

    try {
      let gitCommand = `archive --format=tar ${treeish}`;
      if (prefix) {
        gitCommand += ` --prefix=${prefix}`;
      }

      const gitResult = execSync(`git ${gitCommand}`, {
        encoding: 'buffer',
      });
      const gzipped = zlib.gzipSync(gitResult);
      fs.writeFileSync(outputFile, gzipped);
      spinner.stop();
      ui.success(`Archive created: ${outputFile}`);
    } catch (error) {
      spinner.stop();
      ui.error('Failed to create archive', {
        suggestion: error.message,
        exit: true,
      });
    }
  } else {
    let command = `archive --format=${selectedFormat} --output=${outputFile}`;
    if (prefix) {
      command += ` --prefix=${prefix}`;
    }
    command += ` ${treeish}`;

    await execGitWithSpinner(command, {
      spinnerText: `Creating archive ${outputFile}`,
      successMessage: `Archive created: ${outputFile}`,
      errorMessage: 'Failed to create archive',
      silent: true,
    });
  }
};

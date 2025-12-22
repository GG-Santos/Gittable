/**
 * Enhanced diff display module
 * Provides improved formatting, colors, and interactive options for viewing diffs
 */

const chalk = require('chalk');
const prompts = require('../../ui/framework/prompts');
const promptsHelpers = require('../../ui/prompts');
const { getTheme } = require('../../utils/ui');
const { execGit } = require('../git');

/**
 * Parse git diff --stat output
 * Returns array of file change objects
 */
function parseDiffStat(statOutput) {
  if (!statOutput || !statOutput.trim()) {
    return [];
  }

  const lines = statOutput.trim().split('\n');
  const files = [];
  let totalInsertions = 0;
  let totalDeletions = 0;

  // Last line is usually the summary: "25 files changed, 1171 insertions(+), 1918 deletions(-)"
  // But if there's only one file, there might not be a summary line
  const lastLine = lines[lines.length - 1];
  const hasSummary = lastLine.includes('files changed') || lastLine.includes('file changed');
  
  let fileLinesEnd = hasSummary ? lines.length - 1 : lines.length;

  // Try to extract totals from summary line
  if (hasSummary) {
    const insertionsMatch = lastLine.match(/(\d+)\s+insertions?/);
    const deletionsMatch = lastLine.match(/(\d+)\s+deletions?/);
    totalInsertions = insertionsMatch ? parseInt(insertionsMatch[1], 10) : 0;
    totalDeletions = deletionsMatch ? parseInt(deletionsMatch[1], 10) : 0;
  }

  // Parse file lines (everything except the last summary line if it exists)
  for (let i = 0; i < fileLinesEnd; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Format: "file/path.js                    | 123 +-"
    // or: "file/path.js                    | 123 +-"
    // or binary: "file.bin                    | Bin 0 -> 1234 bytes"
    const match = line.match(/^(.+?)\s+\|\s+(\d+)\s+([+-]+)$/);
    if (match) {
      const [, filePath, changes, indicators] = match;
      const insertions = (indicators.match(/\+/g) || []).length;
      const deletions = (indicators.match(/-/g) || []).length;
      
      files.push({
        file: filePath.trim(),
        changes: parseInt(changes, 10),
        insertions,
        deletions,
      });
    } else {
      // Handle binary files: "file.bin                    | Bin 0 -> 1234 bytes"
      const binaryMatch = line.match(/^(.+?)\s+\|\s+Bin\s+(\d+)\s+->\s+(\d+)\s+bytes$/);
      if (binaryMatch) {
        const [, filePath, oldSize, newSize] = binaryMatch;
        files.push({
          file: filePath.trim(),
          changes: 0,
          insertions: 0,
          deletions: 0,
          binary: true,
          oldSize: parseInt(oldSize, 10),
          newSize: parseInt(newSize, 10),
        });
      } else {
        // Handle renamed files: "old.js => new.js                    | 0"
        const renameMatch = line.match(/^(.+?)\s+=>\s+(.+?)\s+\|\s+(\d+)/);
        if (renameMatch) {
          const [, oldFile, newFile, changes] = renameMatch;
          files.push({
            file: `${oldFile.trim()} => ${newFile.trim()}`,
            changes: parseInt(changes, 10),
            insertions: 0,
            deletions: 0,
            renamed: true,
          });
        } else {
          // Fallback: just extract filename
          const fileMatch = line.match(/^(.+?)\s+\|/);
          if (fileMatch) {
            files.push({
              file: fileMatch[1].trim(),
              changes: 0,
              insertions: 0,
              deletions: 0,
            });
          }
        }
      }
    }
  }

  // If we didn't get totals from summary line, calculate from individual files
  if (!hasSummary || (totalInsertions === 0 && totalDeletions === 0)) {
    totalInsertions = files.reduce((sum, f) => sum + f.insertions, 0);
    totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  }

  return {
    files,
    summary: {
      totalFiles: files.length,
      totalInsertions,
      totalDeletions,
    },
  };
}

/**
 * Format file change line with dim colors (similar to staged files)
 */
function formatFileLine(file) {
  let fileDisplay = file.file;
  
  // Truncate long file paths if needed
  const maxWidth = 60;
  if (fileDisplay.length > maxWidth) {
    const start = fileDisplay.substring(0, Math.floor(maxWidth / 2) - 3);
    const end = fileDisplay.substring(fileDisplay.length - Math.floor(maxWidth / 2) + 3);
    fileDisplay = `${start}...${end}`;
  }

  // Use dim colors for all files (less colorful)
  let changesStr = '';
  if (file.binary) {
    changesStr = chalk.dim(` | Bin ${file.oldSize} -> ${file.newSize} bytes`);
  } else if (file.changes > 0) {
    changesStr = chalk.dim(` | ${file.changes} ${file.insertions > 0 ? `+${file.insertions}` : ''} ${file.deletions > 0 ? `-${file.deletions}` : ''}`);
  } else if (file.renamed) {
    changesStr = chalk.dim(' | renamed');
  } else {
    changesStr = chalk.dim(' | 0');
  }

  return chalk.dim(`  ${fileDisplay}${changesStr}`);
}

/**
 * Display formatted diff summary with boxed borders (similar to staged files)
 */
function displayDiffSummary(diffData) {
  const { files, summary } = diffData;

  if (files.length === 0) {
    promptsHelpers.note('(no changes)', chalk.dim('Staged Changes'));
    return;
  }

  // Format files list similar to staged files display
  const filesList = files.map(file => formatFileLine(file)).join('\n');
  
  // Create summary text
  const summaryText = `${summary.totalFiles} file${summary.totalFiles !== 1 ? 's' : ''} changed, ` +
    `${summary.totalInsertions} insertion${summary.totalInsertions !== 1 ? 's' : ''}(+), ` +
    `${summary.totalDeletions} deletion${summary.totalDeletions !== 1 ? 's' : ''}(-)`;

  // Display in boxed format like staged files
  const content = `${filesList}\n\n${chalk.dim(summaryText)}`;
  promptsHelpers.note(content, chalk.dim('Staged Changes'));
}

/**
 * Display full diff for a specific file with boxed format
 */
function displayFileDiff(filePath, staged = true) {
  const command = staged ? `diff --cached ${filePath}` : `diff ${filePath}`;
  const result = execGit(command, { silent: true });

  if (!result.success || !result.output.trim()) {
    promptsHelpers.note(`(no changes in ${filePath})`, chalk.dim('File Diff'));
    return;
  }

  // Display in boxed format
  promptsHelpers.note(result.output, chalk.dim(`File: ${filePath}`));
}

/**
 * Interactive diff viewer
 */
async function showInteractiveDiff(options = {}) {
  const { staged = true, skipPrompt = false } = options;
  const theme = getTheme();

  // Get diff stats
  const command = staged ? 'diff --cached --stat' : 'diff --stat';
  const statResult = execGit(command, { silent: true });

  if (!statResult.success || !statResult.output.trim()) {
    console.log(chalk.dim('  (no staged changes)'));
    return { cancelled: false };
  }

  // Parse diff stat
  const diffData = parseDiffStat(statResult.output);

  if (diffData.files.length === 0) {
    console.log(chalk.dim('  (no changes)'));
    return { cancelled: false };
  }

  // Display summary
  displayDiffSummary(diffData);

  // Ask what to do next
  if (skipPrompt) {
    return { cancelled: false };
  }

  const action = await prompts.select({
    message: theme.primary('What would you like to do?'),
    options: [
      {
        value: 'view-all',
        label: chalk.dim('View all changes') + chalk.dim(' - Show full diff for all files'),
      },
      {
        value: 'view-file',
        label: chalk.dim('View specific file') + chalk.dim(' - Choose a file to view'),
      },
      {
        value: 'continue',
        label: chalk.dim('Continue') + chalk.dim(' - Proceed with commit'),
      },
      {
        value: 'skip',
        label: chalk.dim('Skip diff') + chalk.dim(' - Don\'t show diff'),
      },
    ],
  });

  if (prompts.isCancel(action)) {
    return { cancelled: true };
  }

  if (action === 'view-all') {
    // Show full diff for all files
    const fullCommand = staged ? 'diff --cached' : 'diff';
    const fullResult = execGit(fullCommand, { silent: true });
    
    if (fullResult.success && fullResult.output.trim()) {
      promptsHelpers.note(fullResult.output, chalk.dim('Full Diff'));
    } else {
      promptsHelpers.note('(no changes)', chalk.dim('Full Diff'));
    }

    // Ask to continue
    const continueAfterView = await prompts.confirm({
      message: 'Continue with commit?',
      initialValue: true,
    });

    if (prompts.isCancel(continueAfterView) || !continueAfterView) {
      return { cancelled: true };
    }

    return { cancelled: false };
  }

  if (action === 'view-file') {
    // Let user select a file to view
    const fileOptions = diffData.files.map((file, index) => ({
      value: index.toString(),
      label: formatFileLine(file),
    }));

    fileOptions.push({
      value: 'back',
      label: chalk.dim('← Back to menu'),
    });

    let viewingFiles = true;
    while (viewingFiles) {
      const selectedFile = await prompts.select({
        message: theme.primary('Select a file to view:'),
        options: fileOptions,
      });

      if (prompts.isCancel(selectedFile) || selectedFile === 'back') {
        // Go back to main menu
        return await showInteractiveDiff({ staged, skipPrompt: false });
      }

      const fileIndex = parseInt(selectedFile, 10);
      if (fileIndex >= 0 && fileIndex < diffData.files.length) {
        const selectedFileData = diffData.files[fileIndex];
        const selectedFilePath = selectedFileData.file;
        
        // Handle renamed files - git diff --cached works with the new path
        let actualPath = selectedFilePath;
        if (selectedFileData.renamed && selectedFilePath.includes(' => ')) {
          actualPath = selectedFilePath.split(' => ')[1].trim();
        }
        
        displayFileDiff(actualPath, staged);

        // Ask what to do next
        const nextAction = await prompts.select({
          message: theme.primary('What next?'),
          options: [
            { value: 'another', label: chalk.dim('View another file') },
            { value: 'all', label: chalk.dim('View all changes') },
            { value: 'continue', label: chalk.dim('Continue with commit') },
            { value: 'cancel', label: chalk.dim('Cancel') },
          ],
        });

        if (prompts.isCancel(nextAction) || nextAction === 'cancel') {
          return { cancelled: true };
        }

        if (nextAction === 'all') {
          // Show all diffs
          const fullCommand = staged ? 'diff --cached' : 'diff';
          const fullResult = execGit(fullCommand, { silent: true });
          
          if (fullResult.success && fullResult.output.trim()) {
            promptsHelpers.note(fullResult.output, chalk.dim('Full Diff'));
          } else {
            promptsHelpers.note('(no changes)', chalk.dim('Full Diff'));
          }

          const continueAfterView = await prompts.confirm({
            message: 'Continue with commit?',
            initialValue: true,
          });

          if (prompts.isCancel(continueAfterView) || !continueAfterView) {
            return { cancelled: true };
          }

          return { cancelled: false };
        }

        if (nextAction === 'continue') {
          return { cancelled: false };
        }
        // Otherwise loop back to file selection
      }
    }
  }

  // Continue or skip both proceed with commit
  return { cancelled: false };
}

module.exports = {
  showInteractiveDiff,
  displayDiffSummary,
  displayFileDiff,
  parseDiffStat,
};


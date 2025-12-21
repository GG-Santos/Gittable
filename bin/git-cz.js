#!/usr/bin/env node

const path = require('node:path');
const {
  loadCommitizenConfig,
  resolveAdapterPath,
  getPrompter,
  findGitRoot,
} = require('../src/core/commitizen/config-loader');
const { commit } = require('../src/core/commitizen/git-commit');
const {
  loadCommitCache,
  saveCommitCache,
  clearCommitCache,
} = require('../src/core/commitizen/commit-cache');

/**
 * Main git-cz entry point
 * This replaces commitizen's git-cz command
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const allowEmpty = args.includes('--allow-empty');
  const amend = args.includes('--amend') || args.includes('--no-edit');
  const all = args.includes('-a') || args.includes('--all');
  const retry = args.includes('--retry');
  const noVerify = args.includes('--no-verify');
  const noGpgSign = args.includes('--no-gpg-sign');

  // Load commitizen config
  const config = loadCommitizenConfig();
  if (!config) {
    console.error('Error: No commitizen configuration found.');
    console.error('Add a "config.commitizen.path" to your package.json or create a .czrc file.');
    process.exit(1);
  }

  // Resolve adapter path
  const adapterPath = resolveAdapterPath(config.path, config.root);
  if (!adapterPath) {
    console.error(`Error: Could not resolve adapter path: ${config.path}`);
    process.exit(1);
  }

  // Get git root
  const gitRoot = findGitRoot();
  if (!gitRoot) {
    console.error('Error: Not in a git repository.');
    process.exit(1);
  }

  // Handle retry - load from cache
  if (retry) {
    const cached = loadCommitCache(gitRoot);
    if (cached?.message) {
      console.log('Retrying last commit attempt...\n');
      const result = commit(gitRoot, cached.message, {
        allowEmpty: cached.options?.allowEmpty || allowEmpty,
        amend: cached.options?.amend || amend,
        all: cached.options?.all || all,
        noVerify: cached.options?.noVerify || noVerify,
        noGpgSign: cached.options?.noGpgSign || noGpgSign,
      });

      if (result.success) {
        console.log('Commit created successfully');
        clearCommitCache(gitRoot);
        process.exit(0);
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    } else {
      console.error('Error: No previous commit attempt found in cache.');
      process.exit(1);
    }
    return;
  }

  // Get prompter function
  let prompter;
  try {
    prompter = getPrompter(adapterPath);
  } catch (error) {
    console.error(`Error loading adapter: ${error.message}`);
    process.exit(1);
  }

  // Create commit callback with caching
  const commitCallback = (message) => {
    // Save to cache before attempting commit
    saveCommitCache(gitRoot, {
      message,
      options: {
        allowEmpty,
        amend,
        all,
        noVerify,
        noGpgSign,
      },
    });

    const result = commit(gitRoot, message, {
      allowEmpty,
      amend,
      all,
      noVerify,
      noGpgSign,
    });

    if (result.success) {
      // Clear cache on success
      clearCommitCache(gitRoot);
    } else {
      // Keep cache on failure for retry
      throw new Error(result.error);
    }
  };

  // Call the prompter
  // The prompter signature is: prompter(inquirer, commit)
  // Our adapter uses async/await, so we need to handle promises
  try {
    const prompterResult = prompter(null, commitCallback);

    // If it returns a promise, wait for it
    if (prompterResult && typeof prompterResult.then === 'function') {
      await prompterResult;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error.message);
  process.exit(1);
});

// Run main
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { main };

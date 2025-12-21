const { getCurrentBranch } = require('../core/git');
const chalk = require('chalk');

/**
 * Protected branch names
 */
const PROTECTED_BRANCHES = ['main', 'master', 'develop', 'dev', 'production', 'prod', 'release'];

/**
 * Check if branch is protected
 */
function isProtectedBranch(branchName = null) {
  const branch = branchName || getCurrentBranch();
  if (!branch) {
    return false;
  }

  return PROTECTED_BRANCHES.some(protected => 
    branch.toLowerCase() === protected.toLowerCase() ||
    branch.toLowerCase().startsWith(`${protected.toLowerCase()}/`)
  );
}

/**
 * Get protection warning message
 */
function getProtectionWarning(branchName = null, operation = 'push') {
  const branch = branchName || getCurrentBranch();
  
  if (!isProtectedBranch(branch)) {
    return null;
  }

  const operationMessages = {
    push: 'Pushing to a protected branch',
    force: 'Force pushing to a protected branch',
    delete: 'Deleting a protected branch',
    rebase: 'Rebasing a protected branch',
  };

  return {
    warning: `${operationMessages[operation] || 'Modifying'} "${branch}"`,
    message: 'This branch is protected. Consider creating a feature branch instead.',
    suggestion: 'Create feature branch: gittable branch create feature/your-feature',
  };
}

/**
 * Check and warn about protected branch operations
 */
function checkBranchProtection(branchName = null, operation = 'push') {
  const protection = getProtectionWarning(branchName, operation);
  
  if (!protection) {
    return { isProtected: false };
  }

  return {
    isProtected: true,
    ...protection,
  };
}

module.exports = {
  isProtectedBranch,
  getProtectionWarning,
  checkBranchProtection,
  PROTECTED_BRANCHES,
};


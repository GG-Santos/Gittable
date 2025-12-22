const { showCommandHeader } = require('../../utils/commands');
const router = require('../../cli/router');

/**
 * Pull + Rebase command
 * Redirects to pull command with --rebase flag
 */
module.exports = async (args) => {
  showCommandHeader('PULL-REBASE', 'Pull and Rebase');
  await router.execute('pull', [...args, '--rebase']);
};

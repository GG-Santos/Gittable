// Workflow commands - streamlined redirects to enhanced core commands
module.exports = [
  {
    name: 'commit-push',
    aliases: ['cp'],
    description: 'Commit and push using enhanced commit command',
    category: 'workflow',
    subcategory: 'remote',
    handler: require('./commit-push'),
  },
  {
    name: 'commit-sync',
    aliases: ['cs'],
    description: 'Commit and sync using enhanced commit command',
    category: 'workflow',
    subcategory: 'remote',
    handler: require('./commit-sync'),
  },
  {
    name: 'pull-rebase',
    aliases: [],
    description: 'Pull with rebase (redirects to pull --rebase)',
    category: 'workflow',
    subcategory: 'remote',
    handler: require('./pull-rebase'),
  },
];

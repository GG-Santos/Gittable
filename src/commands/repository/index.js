// Repository management commands
module.exports = [
  {
    name: 'init',
    aliases: [],
    description: 'Initialize a new repository',
    category: 'repository',
    handler: require('./init'),
  },
  {
    name: 'clone',
    aliases: [],
    description: 'Clone a repository',
    category: 'repository',
    handler: require('./clone'),
  },
  {
    name: 'uninit',
    aliases: ['deinit'],
    description: 'Remove git repository (clear history)',
    category: 'repository',
    subcategory: 'repo',
    handler: require('./uninit'),
  },
  {
    name: 'archive',
    aliases: [],
    description: 'Create archive from repository',
    category: 'repository',
    subcategory: 'repo',
    handler: require('./archive'),
  },
  {
    name: 'worktree',
    aliases: ['wt'],
    description: 'Manage multiple working trees',
    category: 'repository',
    subcategory: 'repo',
    handler: require('./worktree'),
  },
  {
    name: 'submodule',
    aliases: ['sub'],
    description: 'Manage submodules',
    category: 'repository',
    subcategory: 'repo',
    handler: require('./submodule'),
  },
];

// History & inspection commands
module.exports = [
  {
    name: 'blame',
    aliases: [],
    description: 'Show who last modified each line',
    category: 'history',
    handler: require('./blame'),
  },
  {
    name: 'grep',
    aliases: [],
    description: 'Search in repository',
    category: 'history',
    handler: require('./grep'),
  },
  {
    name: 'shortlog',
    aliases: [],
    description: 'Summarize commit log by author',
    category: 'history',
    handler: require('./shortlog'),
  },
  {
    name: 'describe',
    aliases: [],
    description: 'Describe a commit using nearest tag',
    category: 'history',
    handler: require('./describe'),
  },
  {
    name: 'range-diff',
    aliases: [],
    description: 'Compare two commit ranges',
    category: 'history',
    handler: require('./range-diff'),
  },
];

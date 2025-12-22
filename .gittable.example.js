module.exports = {
  // Mode system has been removed - all commands are always available
  // Use enabledCommands array below to manually filter commands if needed
  // mode: 'full', // Deprecated - no longer used

  // Command filtering (leave empty for all commands, or specify array of command names)
  enabledCommands: [], // If empty, all commands enabled

  types: [
    { value: 'feat', name: 'New Feature' },
    { value: 'fix', name: 'Bug Fix' },
    { value: 'docs', name: 'Documentation' },
    { value: 'style', name: 'Code Style' },
    { value: 'refactor', name: 'Code Refactoring' },
    { value: 'perf', name: 'Performance Improvement' },
    { value: 'test', name: 'Adding Tests' },
    { value: 'build', name: 'Build System Changes' },
    { value: 'ci', name: 'CI Configuration' },
    { value: 'chore', name: 'Maintenance Tasks' },
    { value: 'revert', name: 'Revert Commit' },
    { value: 'wip', name: 'Work In Progress' },
  ],

  scopes: [
    // UI & Components
    { name: 'components' },
    { name: 'ui' },
    { name: 'styles' },
    { name: 'theme' },

    // Business Logic
    { name: 'hooks' },
    { name: 'utils' },
    { name: 'helpers' },
    { name: 'types' },
    { name: 'models' },

    // Data & API
    { name: 'api' },
    { name: 'services' },
    { name: 'auth' },
    { name: 'db' },
    { name: 'database' },
    { name: 'cache' },
    { name: 'storage' },

    // Configuration & Environment
    { name: 'config' },
    { name: 'env' },
    { name: 'settings' },

    // Development & Testing
    { name: 'test' },
    { name: 'tests' },
    { name: 'logging' },
    { name: 'debug' },

    // Infrastructure & Deployment
    { name: 'infra' },
    { name: 'deploy' },
    { name: 'build' },
    { name: 'ci' },
  ],

  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: 'TICKET-',
  ticketNumberSuffix: '',
  ticketNumberRegExp: '\\d{1,5}',

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],

  skipQuestions: ['body'],

  subjectLimit: 100,
  subjectSeparator: ': ',
  breaklineChar: '|',

  upperCaseSubject: false,
  usePreparedCommit: false,
  askForBreakingChangeFirst: false,
};
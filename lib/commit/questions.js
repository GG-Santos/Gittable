const clack = require('@clack/prompts');
const chalk = require('chalk');
const _fs = require('node:fs');
const getPreviousCommit = require('./get-previous-commit');

// Constants
const SCOPE_CATEGORIES = {
  'Core App Structure': ['app', 'routing', 'layout', 'middleware'],

  'Rendering & Runtime': ['rsc', 'client', 'server'],

  'UI & Shared Logic': ['components', 'styles', 'hooks', 'utils', 'types'],

  'Data & API': ['api', 'auth', 'db', 'cache'],

  'Dev & Tooling': ['config', 'logging', 'test'],

  Infrastructure: ['infra', 'env'],
};

const categorizeScopesOptimized = (scopes) => {
  const result = {};
  const uncategorized = [];

  // Initialize categories
  for (const cat of Object.keys(SCOPE_CATEGORIES)) {
    result[cat] = [];
  }

  // Build lookup map for O(1) categorization
  const lookup = new Map();
  for (const [cat, scopeNames] of Object.entries(SCOPE_CATEGORIES)) {
    for (const name of scopeNames) {
      lookup.set(name, cat);
    }
  }

  // Categorize scopes
  for (const scope of scopes) {
    const name = typeof scope === 'string' ? scope : scope.name;
    const category = lookup.get(name);

    if (category) {
      result[category].push(scope);
    } else {
      uncategorized.push(scope);
    }
  }

  if (uncategorized.length > 0) {
    result.Other = uncategorized;
  }

  // Remove empty categories
  return Object.fromEntries(Object.entries(result).filter(([_, scopes]) => scopes.length > 0));
};

const handleCancel = () => {
  clack.cancel(chalk.yellow('Operation cancelled'));
  process.exit(0);
};

const createValidator = (config, field) => {
  const validators = {
    ticket: (value) => {
      if (!value && config.isTicketNumberRequired && !config.fallbackTicketNumber) {
        return 'Ticket number is required';
      }
      if (value && config.ticketNumberRegExp) {
        const regex = new RegExp(config.ticketNumberRegExp);
        if (!regex.test(value)) {
          return `Must match pattern: ${config.ticketNumberRegExp}`;
        }
      }
    },
    subject: (value) => {
      if (!value) return 'Subject is required';
      const limit = config.subjectLimit || 100;
      if (value.length > limit) {
        return chalk.red(`Exceeds ${limit} chars (current: ${value.length})`);
      }
    },
  };

  return validators[field];
};

// Main prompt function
async function promptQuestions(config) {
  // Optimize scope handling
  const scopes = config.scopeOverrides || config.scopes || [];
  const categorizedScopes = scopes.length ? categorizeScopesOptimized(scopes) : null;

  // Use clack.group for better performance and UX
  const answers = await clack.group(
    {
      type: () =>
        clack.select({
          message: chalk.cyan('Select commit type:'),
          options: config.types.map((t) => ({
            value: t.value,
            label: t.name,
            hint: t.value,
          })),
        }),

      scopeCategory: ({ results }) => {
        if (!categorizedScopes || results.type === 'wip') return Promise.resolve(null);

        const categories = Object.keys(categorizedScopes);
        const options = categories.map((cat) => ({
          value: cat,
          label: cat,
          hint: `${categorizedScopes[cat].length} scopes`,
        }));

        options.push(
          { value: '__empty__', label: chalk.dim('No scope') },
          { value: '__custom__', label: chalk.dim('Custom scope') }
        );

        return clack.select({
          message: chalk.cyan('Select scope category:'),
          options,
        });
      },

      scope: ({ results }) => {
        if (!results.scopeCategory || results.scopeCategory === '__empty__') {
          return Promise.resolve(null);
        }

        if (results.scopeCategory === '__custom__') {
          return clack.text({
            message: chalk.cyan('Enter custom scope:'),
            placeholder: 'e.g., auth, api, ui',
          });
        }

        const categoryScopes = categorizedScopes[results.scopeCategory];
        return clack.select({
          message: chalk.cyan('Select scope:'),
          options: categoryScopes.map((s) => {
            const name = typeof s === 'string' ? s : s.name;
            return { value: name, label: name };
          }),
        });
      },

      ticketNumber: () => {
        if (!config.allowTicketNumber) return Promise.resolve('');

        return clack.text({
          message: chalk.cyan('Ticket number:'),
          placeholder: config.ticketNumberPrefix || 'TICKET-',
          defaultValue: config.fallbackTicketNumber || '',
          validate: createValidator(config, 'ticket'),
        });
      },

      subject: () => {
        const previous = getPreviousCommit();
        const defaultValue = (config.usePreparedCommit && previous?.[0]) || '';

        return clack.text({
          message: chalk.cyan('Commit message:'),
          placeholder: 'add user authentication',
          defaultValue,
          validate: createValidator(config, 'subject'),
        });
      },

      body: () => {
        if (config.skipQuestions?.includes('body')) return Promise.resolve('');

        const previous = getPreviousCommit();
        const defaultValue =
          config.usePreparedCommit && previous?.length > 1 ? previous.slice(1).join('|') : '';

        return clack.text({
          message: chalk.cyan('Extended description (optional):'),
          placeholder: 'Use "|" for new lines',
          defaultValue,
        });
      },

      breaking: ({ results }) => {
        const shouldAsk =
          config.askForBreakingChangeFirst || config.allowBreakingChanges?.includes(results.type);

        if (!shouldAsk) return Promise.resolve('');

        return clack.text({
          message: chalk.red('Breaking changes (optional):'),
          placeholder: 'Describe breaking changes',
        });
      },

      footer: ({ results }) => {
        if (results.type === 'wip' || config.skipQuestions?.includes('footer')) {
          return Promise.resolve('');
        }

        return clack.text({
          message: chalk.cyan('Issues closed (optional):'),
          placeholder: '#31, #34',
        });
      },
    },
    {
      onCancel: handleCancel,
    }
  );

  // Process subject casing
  if (answers.subject) {
    const shouldUpperCase = config.upperCaseSubject || false;
    answers.subject = shouldUpperCase
      ? answers.subject.charAt(0).toUpperCase() + answers.subject.slice(1)
      : answers.subject.charAt(0).toLowerCase() + answers.subject.slice(1);
  }

  return answers;
}

module.exports = { promptQuestions };

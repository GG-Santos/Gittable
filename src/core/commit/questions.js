const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { getTheme } = require('../../utils/color-theme');
const _fs = require('node:fs');
const getPreviousCommit = require('./get-previous-commit');

// Custom error for cancellation
class CancelError extends Error {
  constructor(message = 'Operation cancelled') {
    super(message);
    this.name = 'CancelError';
    this.isCancel = true;
  }
}

// Constants - Framework agnostic scope categories
const SCOPE_CATEGORIES = {
  'UI & Components': ['components', 'ui', 'styles', 'theme'],

  'Business Logic': ['hooks', 'utils', 'helpers', 'types', 'models'],

  'Data & API': ['api', 'services', 'auth', 'db', 'database', 'cache', 'storage'],

  Configuration: ['config', 'env', 'settings'],

  'Development & Testing': ['test', 'tests', 'logging', 'debug'],

  Infrastructure: ['infra', 'deploy', 'build', 'ci'],
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
  prompts.cancel(chalk.yellow('Operation cancelled'));
  throw new CancelError('Operation cancelled by user');
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

// Custom error for going back
class GoBackError extends Error {
  constructor(steps = 1) {
    super('Go back to previous question');
    this.name = 'GoBackError';
    this.steps = steps;
    this.isGoBack = true;
  }
}

// Main prompt function with go back support
async function promptQuestions(config) {
  // Optimize scope handling
  const scopes = config.scopeOverrides || config.scopes || [];
  const categorizedScopes = scopes.length ? categorizeScopesOptimized(scopes) : null;

  const answers = {};
  let currentStep = 0;
  const stepHistory = [];

  // Define all prompt steps
  const steps = [
    {
      name: 'type',
      prompt: () => {
        const theme = getTheme();
        return prompts.select({
          message: theme.primary('Select commit type:'),
          options: [
            ...config.types.map((t) => ({
              value: t.value,
              label: t.name,
              hint: t.value,
            })),
            { value: '__back__', label: chalk.dim('← Previous Menu'), hint: 'Return to start' },
          ],
        });
      },
    },
    {
      name: 'scopeCategory',
      condition: ({ results }) => categorizedScopes && results.type !== 'wip',
      prompt: ({ results }) => {
        const categories = Object.keys(categorizedScopes);
        const options = categories.map((cat) => ({
          value: cat,
          label: cat,
          hint: `${categorizedScopes[cat].length} scopes`,
        }));

        options.push(
          { value: '__empty__', label: chalk.dim('No scope') },
          { value: '__custom__', label: chalk.dim('Custom scope') },
          { value: '__back__', label: chalk.dim('← Previous Menu'), hint: 'Previous question' }
        );

        const theme = getTheme();
        return prompts.select({
          message: theme.primary('Select scope category:'),
          options,
        });
      },
    },
    {
      name: 'scope',
      condition: ({ results }) =>
        results.scopeCategory &&
        results.scopeCategory !== '__empty__' &&
        results.scopeCategory !== '__back__',
      prompt: ({ results }) => {
        const theme = getTheme();
        if (results.scopeCategory === '__custom__') {
          return prompts.text({
            message: theme.primary('Enter custom scope:'),
            placeholder: 'e.g., auth, api, ui (or press Ctrl+C to go back)',
          });
        }

        const categoryScopes = categorizedScopes[results.scopeCategory];
        const options = categoryScopes.map((s) => {
          const name = typeof s === 'string' ? s : s.name;
          return { value: name, label: name };
        });
        options.push({
          value: '__back__',
          label: chalk.dim('← Previous Menu'),
          hint: 'Previous question',
        });

        return prompts.select({
          message: theme.primary('Select scope:'),
          options,
        });
      },
    },
    {
      name: 'ticketNumber',
      condition: () => config.allowTicketNumber,
      prompt: () => {
        const theme = getTheme();
        return prompts.text({
          message: theme.primary('Ticket number:'),
          placeholder: config.ticketNumberPrefix || 'TICKET-',
          defaultValue: config.fallbackTicketNumber || '',
          validate: (value) => {
            if (value === '__back__') return null;
            return createValidator(config, 'ticket')(value);
          },
        });
      },
    },
    {
      name: 'subject',
      prompt: async () => {
        const previous = getPreviousCommit();
        const defaultValue = (config.usePreparedCommit && previous?.[0]) || '';

        // Offer to use template
        const {
          listTemplates,
          loadTemplate,
          expandTemplate,
        } = require('../../utils/commit-templates');
        const templates = listTemplates();

        const theme = getTheme();
        if (templates.length > 0 && process.stdin.isTTY) {
          const useTemplate = await prompts.confirm({
            message: theme.primary('Use commit template?'),
            initialValue: false,
          });

          if (useTemplate && !prompts.isCancel(useTemplate)) {
            const selectedTemplate = await prompts.select({
              message: theme.primary('Select template:'),
              options: [
                ...templates.map((t) => ({ value: t, label: t })),
                { value: '__custom__', label: chalk.dim('Enter custom message') },
                { value: '__back__', label: chalk.dim('← Previous Menu') },
              ],
            });

            if (prompts.isCancel(selectedTemplate) || selectedTemplate === '__back__') {
              // Go back to previous step
              return '__back__';
            }

            if (selectedTemplate && selectedTemplate !== '__custom__') {
              const template = loadTemplate(selectedTemplate);
              if (template) {
                const expanded = expandTemplate(template);
                prompts.note(
                  `Using template: ${theme.primary(selectedTemplate)}`,
                  chalk.dim('Template')
                );
                return expanded;
              }
            }
          }
        }

        // Offer to select from recent commits
        const { createRecentMessageOptions } = require('./recent-messages');
        const recentOptions = createRecentMessageOptions(5);

        if (recentOptions.length > 0 && process.stdin.isTTY) {
          const useRecent = await prompts.confirm({
            message: theme.primary('Use recent commit message?'),
            initialValue: false,
          });

          if (useRecent && !prompts.isCancel(useRecent)) {
            const selected = await prompts.select({
              message: theme.primary('Select recent commit message:'),
              options: [
                ...recentOptions,
                { value: '__custom__', label: chalk.dim('Enter custom message') },
                { value: '__back__', label: chalk.dim('← Previous Menu') },
              ],
            });

            if (prompts.isCancel(selected) || selected === '__back__') {
              // Go back to previous step
              return '__back__';
            }

            if (selected && selected !== '__custom__') {
              return selected;
            }
          }
        }

        return prompts.text({
          message: theme.primary('Commit message:'),
          placeholder: 'add user authentication',
          defaultValue,
          validate: (value) => {
            if (value === '__back__') return null;
            return createValidator(config, 'subject')(value);
          },
        });
      },
    },
    {
      name: 'body',
      condition: ({ results }) => !config.skipQuestions?.includes('body'),
      prompt: () => {
        const theme = getTheme();
        const previous = getPreviousCommit();
        const defaultValue =
          config.usePreparedCommit && previous?.length > 1 ? previous.slice(1).join('|') : '';

        return prompts.text({
          message: theme.primary('Extended description (optional):'),
          placeholder: 'Use "|" for new lines',
          defaultValue,
          validate: (value) => {
            if (value === '__back__') return null;
            return null;
          },
        });
      },
    },
    {
      name: 'breaking',
      condition: ({ results }) =>
        config.askForBreakingChangeFirst || config.allowBreakingChanges?.includes(results.type),
      prompt: () =>
        prompts.text({
          message: chalk.red('Breaking changes (optional):'),
          placeholder: 'Describe breaking changes',
          validate: (value) => {
            if (value === '__back__') return null;
            return null;
          },
        }),
    },
    {
      name: 'footer',
      condition: ({ results }) =>
        results.type !== 'wip' && !config.skipQuestions?.includes('footer'),
      prompt: async () => {
        // Suggest issue number from branch name
        const { suggestIssueNumber, formatIssueReference } = require('../../utils/issue-tracker');
        const suggestedIssue = suggestIssueNumber();
        const defaultValue = suggestedIssue ? formatIssueReference(suggestedIssue) : '';

        const theme = getTheme();
        return prompts.text({
          message: theme.primary('Issues closed (optional):'),
          placeholder: suggestedIssue ? `#${suggestedIssue} (from branch)` : '#31, #34',
          defaultValue,
          validate: (value) => {
            if (value === '__back__') return null;
            return null;
          },
        });
      },
    },
  ];

  // Execute prompts sequentially with go back support
  while (currentStep < steps.length) {
    const step = steps[currentStep];
    const shouldSkip = step.condition && !step.condition({ results: answers });

    if (shouldSkip) {
      currentStep++;
      continue;
    }

    try {
      const result = await step.prompt({ results: answers });

      if (prompts.isCancel(result)) {
        handleCancel();
      }

      // Handle go back
      if (result === '__back__' || (typeof result === 'string' && result.trim() === '__back__')) {
        if (currentStep > 0) {
          // Find the previous non-skipped step
          let prevStep = currentStep - 1;
          while (prevStep >= 0) {
            const prev = steps[prevStep];
            const prevShouldSkip = prev.condition && !prev.condition({ results: answers });
            if (!prevShouldSkip) {
              // Remove answers from this step and any steps after
              for (let i = prevStep + 1; i < steps.length; i++) {
                delete answers[steps[i].name];
              }
              // Clean up step history
              while (stepHistory.length > prevStep) {
                stepHistory.pop();
              }
              currentStep = prevStep;
              break;
            }
            prevStep--;
          }
          continue;
        }
        // Already at first step, treat as cancel
        handleCancel();
      }

      // Store answer
      if (result !== null && result !== undefined && result !== '' && result !== '__back__') {
        answers[step.name] = result;
        if (!stepHistory.includes(step.name)) {
          stepHistory.push(step.name);
        }
      }

      currentStep++;
    } catch (error) {
      if (error instanceof CancelError || error.isCancel) {
        throw error;
      }
      throw error;
    }
  }

  // Process subject casing
  if (answers.subject) {
    const shouldUpperCase = config.upperCaseSubject || false;
    answers.subject = shouldUpperCase
      ? answers.subject.charAt(0).toUpperCase() + answers.subject.slice(1)
      : answers.subject.charAt(0).toLowerCase() + answers.subject.slice(1);
  }

  // Set defaults for skipped fields
  if (!answers.scopeCategory) answers.scopeCategory = null;
  if (!answers.scope) answers.scope = null;
  if (!answers.ticketNumber) answers.ticketNumber = '';
  if (!answers.body) answers.body = '';
  if (!answers.breaking) answers.breaking = '';
  if (!answers.footer) answers.footer = '';

  return answers;
}

module.exports = { promptQuestions, CancelError };

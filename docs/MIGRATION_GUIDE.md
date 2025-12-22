# Framework Migration Guide

This guide explains how to migrate existing commands to use the new UI/UX framework.

## Quick Migration Pattern

### Before (Old Pattern)
```javascript
const clack = require('@clack/prompts');
const chalk = require('chalk');

// Error messages
clack.cancel(chalk.red('Operation failed'));

// Success messages
clack.outro(chalk.green.bold('Success!'));

// Prompts
const value = await clack.text({
  message: 'Enter value',
});
```

### After (New Framework)
```javascript
const ui = require('../../ui/framework');

// Error messages
ui.error('Operation failed', { exit: true });

// Success messages
ui.success('Success!');

// Prompts
const value = await ui.prompt.text({
  message: 'Enter value',
});
```

## Step-by-Step Migration

### 1. Replace Imports

**Before:**
```javascript
const clack = require('@clack/prompts');
const chalk = require('chalk');
```

**After:**
```javascript
const ui = require('../../ui/framework');
const chalk = require('chalk'); // Keep if needed for formatting
```

### 2. Replace Error Messages

**Before:**
```javascript
clack.cancel(chalk.red('Operation failed'));
process.exit(1);
```

**After:**
```javascript
ui.error('Operation failed', { exit: true });
```

**With suggestions:**
```javascript
ui.error('Operation failed', {
  suggestion: 'Try running: git status',
  solution: 'gittable status',
  exit: true
});
```

### 3. Replace Success Messages

**Before:**
```javascript
clack.outro(chalk.green.bold('Success!'));
```

**After:**
```javascript
ui.success('Success!');
```

**With details:**
```javascript
ui.success('Commit created', {
  details: ['3 files changed', '15 insertions']
});
```

### 4. Replace Warning Messages

**Before:**
```javascript
console.log(chalk.yellow('⚠ Warning message'));
```

**After:**
```javascript
ui.warn('Warning message');
```

### 5. Replace Info Messages

**Before:**
```javascript
console.log(chalk.blue('ℹ Info message'));
```

**After:**
```javascript
ui.info('Info message');
```

### 6. Replace Prompts

**Text Prompt:**
```javascript
// Before
const value = await clack.text({
  message: 'Enter value',
});

// After
const value = await ui.prompt.text({
  message: 'Enter value',
});
```

**Confirm Prompt:**
```javascript
// Before
const confirmed = await clack.confirm({
  message: 'Continue?',
});

// After
const confirmed = await ui.prompt.confirm({
  message: 'Continue?',
});
```

**Select Prompt:**
```javascript
// Before
const selected = await clack.select({
  message: 'Choose option',
  options: [...]
});

// After
const selected = await ui.prompt.select({
  message: 'Choose option',
  options: [...]
});
```

**Multiselect Prompt:**
```javascript
// Before
const selected = await clack.multiselect({
  message: 'Choose options',
  options: [...]
});

// After
const selected = await ui.prompt.multiselect({
  message: 'Choose options',
  options: [...]
});
```

### 7. Replace Spinners

**Before:**
```javascript
const spinner = clack.spinner();
spinner.start('Processing...');
// ... do work
spinner.stop();
```

**After:**
```javascript
const spinner = ui.prompt.spinner();
spinner.start('Processing...');
// ... do work
spinner.stop();
```

### 8. Replace Cancellation Handling

**Before:**
```javascript
if (clack.isCancel(value)) {
  clack.cancel(chalk.yellow('Cancelled'));
  return;
}
```

**After:**
```javascript
if (ui.prompt.isCancel(value)) {
  ui.prompt.handleCancel(value, 'Cancelled');
  return;
}
```

Or use the built-in handling:
```javascript
const value = await ui.prompt.text({...});
// Framework automatically handles cancellation
if (value === null) {
  return; // User cancelled
}
```

### 9. Replace Tables

**Before:**
```javascript
const { createTable } = require('../../ui/table');
const table = createTable(['Header1', 'Header2'], rows);
```

**After:**
```javascript
const ui = require('../../ui/framework');
const table = ui.table.create({
  headers: ['Header1', 'Header2'],
  rows: rows,
  options: {
    align: 'left',
    truncate: true
  }
});
```

### 10. Replace Banners

**Before:**
```javascript
const { showBanner } = require('../../ui/banner');
showBanner('COMMAND');
```

**After:**
```javascript
const ui = require('../../ui/framework');
ui.layout.showBanner('COMMAND', {
  subtitle: 'Optional subtitle'
});
```

Or continue using the helper (already migrated):
```javascript
const { showBanner } = require('../../ui/banner');
showBanner('COMMAND'); // Now uses framework internally
```

## Common Patterns

### Command with Error Handling

**Before:**
```javascript
const result = execGit('status');
if (!result.success) {
  clack.cancel(chalk.red('Failed'));
  process.exit(1);
}
```

**After:**
```javascript
const result = execGit('status');
if (!result.success) {
  ui.error('Failed', {
    suggestion: 'Check git repository',
    exit: true
  });
}
```

### Command with Success Message

**Before:**
```javascript
await execGit('add file.js');
clack.outro(chalk.green.bold('File staged'));
```

**After:**
```javascript
await execGit('add file.js');
ui.success('File staged');
```

### Interactive Command

**Before:**
```javascript
const name = await clack.text({
  message: 'Enter name',
});
if (clack.isCancel(name)) {
  clack.cancel(chalk.yellow('Cancelled'));
  return;
}
```

**After:**
```javascript
const name = await ui.prompt.text({
  message: 'Enter name',
});
if (name === null) {
  return; // Cancelled
}
```

## Using Command Helpers

Many commands already use `command-helpers.js` which has been migrated. These commands automatically benefit from the framework:

- `showCommandHeader()` - Uses framework banners
- `execGitWithSpinner()` - Uses framework messages
- `promptConfirm()` - Uses framework prompts
- `showSmartSuggestion()` - Uses framework prompts
- `handleCancel()` - Uses framework cancellation

## Testing Migration

After migrating a command:

1. Test the command in interactive mode
2. Test cancellation (Ctrl+C)
3. Test error cases
4. Verify output matches framework standards
5. Check that colors and spacing are consistent

## Benefits of Migration

1. **Consistency**: All commands use the same UI patterns
2. **Theming**: Automatic theme support
3. **Accessibility**: Built-in accessibility features
4. **Maintainability**: Centralized UI code
5. **Standards**: Enforced UI/UX standards

## Backward Compatibility

The framework maintains backward compatibility where possible:
- Old `banner.js` and `table.js` modules still work (they use framework internally)
- `command-helpers.js` functions maintain their API
- Direct Clack usage still works but should be migrated

## Questions?

See `docs/UI_STANDARDS.md` for complete UI/UX standards documentation.



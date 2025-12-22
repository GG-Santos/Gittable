# UI/UX Standards Documentation

This document defines the UI/UX standards for the Gittable CLI framework. All commands must follow these standards to ensure consistency and predictability.

## Table of Contents

1. [Visual Hierarchy](#visual-hierarchy)
2. [Spacing Rules](#spacing-rules)
3. [Color Usage](#color-usage)
4. [Message Types](#message-types)
5. [Table Standards](#table-standards)
6. [Prompt Standards](#prompt-standards)
7. [Banner Standards](#banner-standards)
8. [Result Display](#result-display)
9. [Verbosity Levels](#verbosity-levels)
10. [Accessibility](#accessibility)

## Visual Hierarchy

The visual hierarchy determines the order and prominence of UI elements:

1. **Banner** (highest priority)
   - Always at top
   - Command name + version
   - ASCII art (optional in compact mode)

2. **Messages** (high priority)
   - Errors: Red, bold, with icon
   - Warnings: Yellow, with icon
   - Info: Blue, dim
   - Notes: Gray, italic

3. **Content** (medium priority)
   - Tables, lists, status displays
   - Theme-aware colors

4. **Prompts** (interactive)
   - Clear labels
   - Helpful placeholders
   - Validation feedback

5. **Results** (lowest priority)
   - Summary at end
   - Next steps suggestions

## Spacing Rules

### Section Separation
- **Between sections**: 1 blank line
- **Before prompts**: 1 blank line
- **After results**: 1 blank line

### List Items
- **Compact mode**: 0.5 lines between items
- **Normal mode**: 1 line between items
- **Spacious mode**: 1 line between items with extra padding

### Tables
- **Between rows**: No spacing
- **Before/after table**: 1 blank line
- **Between table sections**: 1 blank line

## Color Usage

### Primary Colors
- **Primary**: Command names, headers, active elements
- **Success**: Completed operations, positive states (green)
- **Warning**: Warnings, cautions, non-critical issues (yellow)
- **Error**: Failures, critical issues (red)
- **Info**: Informational messages, hints (blue)
- **Dim**: Secondary information, metadata (gray)

### Theme Support
The framework supports multiple themes:
- `default`: Standard color scheme
- `dark`: Bright colors for dark terminals
- `light`: Muted colors for light terminals
- `highContrast`: High contrast for accessibility

## Message Types

### Error Messages
```javascript
ui.error('Operation failed', {
  suggestion: 'Try running: git status',
  solution: 'gittable status',
  exit: true
});
```

**Standards:**
- Icon: ✖
- Color: Red, bold
- Always include suggestion or solution when possible
- Exit process if `exit: true`

### Warning Messages
```javascript
ui.warn('Branch is behind remote', {
  icon: '⚠',
  action: 'Pull changes?'
});
```

**Standards:**
- Icon: ⚠
- Color: Yellow
- Include actionable next step when possible

### Info Messages
```javascript
ui.info('Repository is clean', {
  icon: 'ℹ',
  dim: true
});
```

**Standards:**
- Icon: ℹ
- Color: Blue (or dim if `dim: true`)
- Use for informational content

### Note Messages
```javascript
ui.note('This operation cannot be undone', {
  type: 'warning'
});
```

**Standards:**
- Icon: •
- Color: Gray (or warning color if `type: 'warning'`)
- Use for supplementary information

### Success Messages
```javascript
ui.success('Commit created', {
  details: ['3 files changed', '15 insertions']
});
```

**Standards:**
- Icon: ✓
- Color: Green, bold
- Include details when relevant

## Table Standards

### Alignment
- **Default**: Left-aligned
- **Numbers**: Right-aligned (auto-detected for columns with numeric keywords)
- **Headers**: Bold, primary color

### Truncation
- **Auto-truncate**: Long content with ellipsis (`...`)
- **Max width**: Respects terminal width
- **Column width**: Distributed evenly or based on content

### Borders
- **Style**: Unicode box-drawing characters
- **Color**: Gray (dim)
- **Visibility**: Can be disabled for compact display

### Example
```javascript
ui.table.create({
  headers: ['File', 'Status', 'Size'],
  rows: [
    ['src/index.js', 'Modified', '1.2 KB'],
    ['README.md', 'Added', '3.5 KB']
  ],
  options: {
    align: 'left',
    truncate: true,
    spacing: 'normal',
    borders: true
  }
});
```

## Prompt Standards

### Text Prompt
```javascript
const value = await ui.prompt.text({
  message: 'Enter commit message',
  placeholder: 'feat: add new feature',
  validate: (v) => v.length > 0 ? null : 'Required'
});
```

**Standards:**
- Message uses primary color
- Placeholder uses dim color
- Validation errors are clear and actionable
- Handle cancellation consistently

### Confirm Prompt
```javascript
const confirmed = await ui.prompt.confirm({
  message: 'Continue?',
  initialValue: false
});
```

**Standards:**
- Default to `false` for destructive operations
- Clear, action-oriented messages
- Handle cancellation (returns `false`)

### Select Prompt
```javascript
const selected = await ui.prompt.select({
  message: 'Choose option',
  options: [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B', hint: 'Recommended' }
  ]
});
```

**Standards:**
- Options can include hints
- Selected option highlighted with primary color
- Handle cancellation (returns `null`)

## Banner Standards

### Structure
```
┌─ COMMAND v1.0.0 ────────────────────────────────╮
│   ASCII ART                                      │
│                                                  │
├──────────────────────────────────────────────────╯
│  Command Title/Description
```

### Options
- **Compact mode**: No ASCII art, minimal borders
- **Full mode**: ASCII art, full borders
- **Version**: Always displayed
- **Subtitle**: Optional description

### Example
```javascript
ui.layout.showBanner('COMMIT', {
  subtitle: 'Create a new commit',
  compact: false
});
```

## Result Display

### Success Result
```javascript
ui.result.success({
  message: 'Commit created',
  details: ['3 files changed', '15 insertions'],
  nextSteps: ['Push to remote?']
});
```

### Partial Result
```javascript
ui.result.partial({
  message: 'Some operations completed',
  succeeded: 5,
  failed: 2,
  details: [
    { type: 'success', message: 'File 1 processed' },
    { type: 'error', message: 'File 2 failed' }
  ]
});
```

### Failure Result
```javascript
ui.result.failure({
  message: 'Operation failed',
  errors: ['Error 1', 'Error 2'],
  suggestions: ['Try option A', 'Try option B']
});
```

## Verbosity Levels

1. **Quiet** (`--quiet`): Minimal output, errors only
2. **Normal** (default): Standard output with banners
3. **Verbose** (`--verbose`): Detailed execution info
4. **Debug** (`--debug`): Full diagnostic information

### Implementation
Commands should respect verbosity levels:
- Quiet: Suppress banners, only show errors
- Normal: Show banners and standard output
- Verbose: Show detailed execution steps
- Debug: Show all internal state and operations

## Accessibility

### Color-Blind Friendly
- Always use symbols/icons in addition to colors
- Don't rely solely on color to convey meaning
- Use patterns or shapes when possible

### Screen Reader Friendly
- Structured output with clear hierarchy
- Descriptive labels for all interactive elements
- Consistent formatting for similar content types

### Keyboard Navigation
- All prompts support keyboard navigation
- Tab/Shift+Tab for navigation
- Enter to confirm, Escape to cancel
- Arrow keys for selection

### High Contrast Mode
- Available via `highContrast` theme
- Bold text for better visibility
- Maximum color contrast
- Clear visual boundaries

## Best Practices

1. **Consistency**: Use framework components instead of custom implementations
2. **Theming**: Always use theme colors, never hardcode colors
3. **Spacing**: Follow spacing rules for consistent layout
4. **Messages**: Use appropriate message types for different situations
5. **Error Handling**: Always provide suggestions or solutions with errors
6. **Accessibility**: Consider all users when designing output
7. **Testing**: Test with different terminal sizes and themes

## Migration Guide

When migrating existing commands to use the framework:

1. Replace direct `@clack/prompts` imports with `ui.prompt.*`
2. Replace `chalk` color usage with `ui.theme.getTheme()`
3. Replace custom error messages with `ui.error()`, `ui.warn()`, etc.
4. Replace custom tables with `ui.table.create()`
5. Replace custom banners with `ui.layout.showBanner()`
6. Replace result displays with `ui.result.*` functions

## Examples

See the framework implementation in `src/ui/framework/` for complete examples of all components.



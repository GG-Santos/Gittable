/**
 * UI/UX Standards and Constants
 * Defines all visual, spacing, and interaction standards for the framework
 */

/**
 * Icon/Symbol definitions
 */
const ICONS = {
  success: '✓',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
  note: '•',
  arrow: '→',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};

/**
 * Spacing constants
 */
const SPACING = {
  section: 1, // Blank lines between sections
  listItem: 0.5, // Lines between list items (compact mode)
  listItemNormal: 1, // Lines between list items (normal mode)
  tableRow: 0, // No spacing between table rows
  tableSection: 1, // Blank lines before/after table sections
  promptMessage: 1, // Blank line before prompt
};

/**
 * Visual hierarchy levels
 */
const HIERARCHY = {
  banner: 1, // Highest priority
  messages: 2, // High priority
  content: 3, // Medium priority
  prompts: 4, // Interactive
  results: 5, // Lowest priority
};

/**
 * Color usage guidelines
 */
const COLOR_USAGE = {
  primary: 'Command names, headers, active elements',
  success: 'Completed operations, positive states',
  warning: 'Warnings, cautions, non-critical issues',
  error: 'Failures, critical issues',
  info: 'Informational messages, hints',
  dim: 'Secondary information, metadata',
};

/**
 * Verbosity levels
 */
const VERBOSITY = {
  quiet: 0, // Minimal output, errors only
  normal: 1, // Standard output with banners
  verbose: 2, // Detailed execution info
  debug: 3, // Full diagnostic information
};

/**
 * Message type standards
 */
const MESSAGE_TYPES = {
  error: {
    icon: ICONS.error,
    color: 'error',
    weight: 'bold',
    priority: HIERARCHY.messages,
  },
  warning: {
    icon: ICONS.warning,
    color: 'warning',
    weight: 'normal',
    priority: HIERARCHY.messages,
  },
  info: {
    icon: ICONS.info,
    color: 'info',
    weight: 'normal',
    priority: HIERARCHY.messages,
  },
  note: {
    icon: ICONS.note,
    color: 'dim',
    weight: 'normal',
    priority: HIERARCHY.messages,
  },
  success: {
    icon: ICONS.success,
    color: 'success',
    weight: 'bold',
    priority: HIERARCHY.messages,
  },
};

/**
 * Table standards
 */
const TABLE_STANDARDS = {
  defaultAlign: 'left',
  numberAlign: 'right',
  truncateEllipsis: '...',
  borderStyle: 'unicode', // unicode | ascii | none
  headerStyle: {
    bold: true,
    color: 'primary',
  },
  spacing: {
    compact: 0,
    normal: 0,
    spacious: 1,
  },
};

/**
 * Accessibility settings
 */
const ACCESSIBILITY = {
  colorBlindFriendly: true, // Always use symbols + colors
  screenReaderFriendly: true, // Structured output
  keyboardNavigation: true, // All prompts support keyboard
  highContrast: false, // Can be enabled via theme
};

/**
 * Banner standards
 */
const BANNER_STANDARDS = {
  borderChar: {
    topLeft: '┌',
    topRight: '╮',
    bottomLeft: '├',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
  compact: {
    showAscii: false,
    showVersion: true,
  },
  full: {
    showAscii: true,
    showVersion: true,
  },
};

module.exports = {
  ICONS,
  SPACING,
  HIERARCHY,
  COLOR_USAGE,
  VERBOSITY,
  MESSAGE_TYPES,
  TABLE_STANDARDS,
  ACCESSIBILITY,
  BANNER_STANDARDS,
};



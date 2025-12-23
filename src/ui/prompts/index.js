/**
 * Unified prompts module
 * Main entry point for all prompt functionality
 */

const text = require('./text');
const password = require('./password');
const confirm = require('./confirm');
const select = require('./select');
const multiselect = require('./multiselect');
const groupMultiselect = require('./group-multiselect');
const selectKey = require('./select-key');
const spinner = require('../components/spinner');
const { intro, outro, cancel, note, log, group, isCancel } = require('./helpers');

module.exports = {
  // Prompt functions
  text,
  password,
  confirm,
  select,
  multiselect,
  groupMultiselect,
  selectKey,

  // Spinner
  spinner,

  // Helper functions
  intro,
  outro,
  cancel,
  note,
  log,
  group,

  // Utilities
  isCancel,
};


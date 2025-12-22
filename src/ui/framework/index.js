/**
 * UI Framework Main Entry Point
 * Provides unified access to all framework components
 */

const theme = require('./theme');
const layout = require('./layout');
const messages = require('./messages');
const prompts = require('./prompts');
const tables = require('./tables');
const results = require('./results');
const standards = require('./standards');
// Prompts are now integrated into the framework via prompts.js

/**
 * Main framework API
 */
const ui = {
  // Theme system
  theme,

  // Layout and banners
  layout,

  // Messages
  message: messages,
  error: messages.error,
  warn: messages.warn,
  info: messages.info,
  note: messages.note,
  success: messages.success,

  // Prompts
  prompt: prompts,
  prompts, // Alias

  // Tables
  table: tables,

  // Results
  result: results,

  // Standards
  standards,
};

module.exports = ui;



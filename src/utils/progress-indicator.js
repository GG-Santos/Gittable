const prompts = require('../ui/prompts');
const chalk = require('chalk');

/**
 * Enhanced progress indicator with time estimation
 */
class ProgressIndicator {
  constructor(message, options = {}) {
    this.message = message;
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
    this.current = 0;
    this.total = options.total || 100;
    this.spinner = prompts.spinner();
    this.interval = null;
    this.updateInterval = options.updateInterval || 500; // Update every 500ms
  }

  start() {
    this.spinner.start(this.message);
    this.interval = setInterval(() => {
      this.update();
    }, this.updateInterval);
  }

  update(current = null, total = null) {
    if (current !== null) this.current = current;
    if (total !== null) this.total = total;

    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000; // seconds
    const progress = this.total > 0 ? (this.current / this.total) * 100 : 0;

    let statusText = `${this.message} (${Math.round(progress)}%)`;

    if (this.current > 0 && elapsed > 0) {
      const rate = this.current / elapsed;
      const remaining =
        this.total > this.current ? Math.round((this.total - this.current) / rate) : 0;

      if (remaining > 0) {
        statusText += chalk.dim(` - ${formatTime(remaining)} remaining`);
      }
    }

    this.spinner.message(statusText);
    this.lastUpdate = now;
  }

  stop(success = true) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.spinner.stop();

    if (success) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      return chalk.green(`✓ Completed in ${elapsed}s`);
    }
    return '';
  }

  setMessage(message) {
    this.message = message;
    this.spinner.message(message);
  }
}

/**
 * Format time in human-readable format
 */
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Create a progress indicator
 */
function createProgress(message, options = {}) {
  return new ProgressIndicator(message, options);
}

module.exports = {
  ProgressIndicator,
  createProgress,
  formatTime,
};

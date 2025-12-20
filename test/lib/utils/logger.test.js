const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('lib/utils/logger', () => {
  it('should export logger functions', () => {
    const logger = require('../../../lib/utils/logger');
    assert.ok(typeof logger.info === 'function');
    assert.ok(typeof logger.warn === 'function');
    assert.ok(typeof logger.error === 'function');
    assert.ok(typeof logger.success === 'function');
    assert.ok(typeof logger.log === 'function');
    assert.ok(typeof logger.debug === 'function');
  });

  it('should log messages without errors', () => {
    const logger = require('../../../lib/utils/logger');
    // Just verify it doesn't throw
    assert.doesNotThrow(() => {
      logger.log('test message');
      logger.info('test', 'info message');
      logger.debug('debug message');
    });
  });
});


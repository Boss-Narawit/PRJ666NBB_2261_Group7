const path = require('path');

// Load test env vars before anything imports config/constants.
require('dotenv').config({ path: path.join(__dirname, 'env.jest') });

module.exports = {
  verbose: true,
  testEnvironment: 'node',
  testTimeout: 20000, // memory-server first boot can be slow
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // bootstrap only — starts the listener, not unit-testable
    '!src/config/db.js', // real Atlas connector; bypassed in tests by design
    '!src/models/index.js', // barrel re-exports
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: { global: { lines: 80 } },
};

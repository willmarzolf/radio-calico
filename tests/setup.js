// Global test setup
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

global.beforeEach(() => {
  // Quiet console output during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});

global.afterEach(() => {
  // Restore console methods
  if (!process.env.DEBUG_TESTS) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
});
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'server.js',
    'public/script.js',
    '!**/node_modules/**'
  ],
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/tests/backend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/tests/frontend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js', '<rootDir>/tests/frontend/setup.js']
    }
  ]
};
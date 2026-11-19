const shared = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      roots: ['<rootDir>/src'],
      testRegex: '.*\\.spec\\.ts$',
    },
    {
      ...shared,
      displayName: 'e2e',
      roots: ['<rootDir>/test'],
      testRegex: '.*\\.e2e-spec\\.ts$',
      setupFilesAfterEnv: ['<rootDir>/test/support/e2e-setup.ts'],
    },
  ],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/cli/**', '!src/**/*.model.ts'],
  coverageDirectory: 'coverage',
};

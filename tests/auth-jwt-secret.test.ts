/**
 * This test specifically tests the JWT_SECRET validation in auth.ts
 * It requires a separate test file because we need to test the module import behavior
 */

describe('JWT_SECRET Module Import Tests', () => {
  beforeEach(() => {
    // Clear the module cache before each test
    jest.resetModules();
  });

  it('should throw error when JWT_SECRET is not set during module import', () => {
    // Save original value
    const originalJwtSecret = process.env.JWT_SECRET;

    try {
      // Remove JWT_SECRET before importing the module
      delete process.env.JWT_SECRET;

      // This should throw when we try to import the auth module
      expect(() => {
        require('../src/routes/auth');
      }).toThrow('JWT_SECRET environment variable is required');
    } finally {
      // Always restore the original value
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('should import successfully when JWT_SECRET is set', () => {
    // Ensure JWT_SECRET is set
    process.env.JWT_SECRET = 'test-secret';

    // This should not throw
    expect(() => {
      require('../src/routes/auth');
    }).not.toThrow();
  });
});

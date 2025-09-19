/**
 * Database Pool Configuration Tests
 *
 * Tests the pool.ts module to ensure proper configuration
 * with various environment variable scenarios.
 */

// Mock the pg module before any imports
const mockPoolConstructor = jest.fn();

interface MockPoolInstance {
  query: jest.MockedFunction<() => Promise<unknown>>;
  end: jest.MockedFunction<() => Promise<void>>;
}

jest.mock('pg', () => ({
  Pool: mockPoolConstructor,
}));

describe('Database Pool Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;

    // Clear all mocks
    mockPoolConstructor.mockClear();

    // Clear module cache to force re-evaluation
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  it('should use default configuration when no environment variables are set', async () => {
    // Set up clean environment
    process.env = {
      ...originalEnv,
      POSTGRES_HOST: undefined,
      POSTGRES_PORT: undefined,
      POSTGRES_DB: undefined,
      POSTGRES_USER: undefined,
      POSTGRES_PASSWORD: undefined,
      PG_MAX_CLIENTS: undefined,
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with default values
    expect(mockPoolConstructor).toHaveBeenCalledWith({
      host: 'localhost',
      port: 5432,
      database: 'task_manager',
      user: 'task_user',
      password: 'task_pass',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  });

  it('should use custom port when POSTGRES_PORT is set', async () => {
    // Set custom port
    process.env = {
      ...originalEnv,
      POSTGRES_PORT: '5433',
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with custom port
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5433,
      }),
    );
  });

  it('should use default port when POSTGRES_PORT is empty string', async () => {
    // Set empty port
    process.env = {
      ...originalEnv,
      POSTGRES_PORT: '',
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with default port
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5432,
      }),
    );
  });

  it('should use custom max clients when PG_MAX_CLIENTS is set', async () => {
    // Set custom max clients
    process.env = {
      ...originalEnv,
      PG_MAX_CLIENTS: '20',
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with custom max clients
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 20,
      }),
    );
  });

  it('should use default max clients when PG_MAX_CLIENTS is empty string', async () => {
    // Set empty max clients
    process.env = {
      ...originalEnv,
      PG_MAX_CLIENTS: '',
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with default max clients
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 10,
      }),
    );
  });

  it('should use all custom configuration when all environment variables are set', async () => {
    // Set all custom environment variables
    process.env = {
      ...originalEnv,
      POSTGRES_HOST: 'custom-host',
      POSTGRES_PORT: '5434',
      POSTGRES_DB: 'custom_db',
      POSTGRES_USER: 'custom_user',
      POSTGRES_PASSWORD: 'custom_pass',
      PG_MAX_CLIENTS: '25',
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with all custom values
    expect(mockPoolConstructor).toHaveBeenCalledWith({
      host: 'custom-host',
      port: 5434,
      database: 'custom_db',
      user: 'custom_user',
      password: 'custom_pass',
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  });

  it('should handle numeric conversion for port and max clients', async () => {
    // Set numeric values as strings
    process.env = {
      ...originalEnv,
      POSTGRES_PORT: '9999',
      PG_MAX_CLIENTS: '50',
    };

    // Import the pool module
    await import('../src/db/pool');

    // Verify Pool was called with properly converted numbers
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 9999,
        max: 50,
      }),
    );
  });

  it('should export the pool instance', async () => {
    // Mock Pool instance
    const mockPoolInstance = { query: jest.fn(), end: jest.fn() };
    mockPoolConstructor.mockImplementation(() => mockPoolInstance as MockPoolInstance);

    // Import the pool module
    const poolModule = await import('../src/db/pool');

    // Verify the pool instance is exported as default
    expect(poolModule.default).toBe(mockPoolInstance);
  });

  it('should handle edge case where environment variables are undefined vs falsy', async () => {
    // Test with undefined values (different from empty string)
    process.env = {
      ...originalEnv,
      POSTGRES_PORT: undefined,
      PG_MAX_CLIENTS: undefined,
    };

    // Import the pool module
    await import('../src/db/pool');

    // Should use defaults when undefined
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5432,
        max: 10,
      }),
    );
  });

  it('should handle edge case where environment variables are null', async () => {
    // Test with null values cast to string
    process.env = {
      ...originalEnv,
      POSTGRES_PORT: null as unknown as string,
      PG_MAX_CLIENTS: null as unknown as string,
    };

    // Import the pool module
    await import('../src/db/pool');

    // Should use defaults when null
    expect(mockPoolConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5432,
        max: 10,
      }),
    );
  });
});

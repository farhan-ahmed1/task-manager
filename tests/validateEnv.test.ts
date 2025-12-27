import { validateEnvironment } from '../src/utils/validateEnv';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should pass validation with all required variables set', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password_123';
      process.env.JWT_SECRET = 'a'.repeat(32); // 32 character secret

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw error when NODE_ENV is missing', () => {
      delete process.env.NODE_ENV;
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'a'.repeat(32);

      expect(() => validateEnvironment()).toThrow('Missing required environment variable: NODE_ENV');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
      delete process.env.JWT_SECRET;

      expect(() => validateEnvironment()).toThrow('Missing required environment variable: JWT_SECRET');
    });

    it('should throw error when PORT is missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.PORT;
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'a'.repeat(32);

      expect(() => validateEnvironment()).toThrow('Missing required environment variable: PORT');
    });
  });

  describe('Port Validation', () => {
    beforeEach(() => {
      // Set all required vars except the one being tested
      process.env.NODE_ENV = 'development';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'a'.repeat(32);
    });

    it('should accept valid port numbers', () => {
      process.env.PORT = '3000';
      process.env.POSTGRES_PORT = '5432';

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should reject invalid port (non-numeric)', () => {
      process.env.PORT = 'invalid';
      process.env.POSTGRES_PORT = '5432';

      expect(() => validateEnvironment()).toThrow('Invalid port number for PORT');
    });

    it('should reject port number too large', () => {
      process.env.PORT = '70000';
      process.env.POSTGRES_PORT = '5432';

      expect(() => validateEnvironment()).toThrow('Invalid port number for PORT');
    });

    it('should reject port number too small', () => {
      process.env.PORT = '0';
      process.env.POSTGRES_PORT = '5432';

      expect(() => validateEnvironment()).toThrow('Invalid port number for PORT');
    });
  });

  describe('JWT_SECRET Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
    });

    it('should accept JWT_SECRET with 32+ characters', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should reject JWT_SECRET shorter than 32 characters', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => validateEnvironment()).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('should reject weak JWT_SECRET values', () => {
      process.env.JWT_SECRET = 'your-secret-here-' + 'x'.repeat(20);

      expect(() => validateEnvironment()).toThrow('JWT_SECRET appears to use a weak or default value');
    });

    it('should reject JWT_SECRET with "password"', () => {
      process.env.JWT_SECRET = 'password' + 'x'.repeat(30);

      expect(() => validateEnvironment()).toThrow('JWT_SECRET appears to use a weak or default value');
    });
  });

  describe('NODE_ENV Validation', () => {
    beforeEach(() => {
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'a'.repeat(32);
    });

    it('should accept valid NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test', 'staging'];

      validEnvs.forEach(env => {
        process.env.NODE_ENV = env;
        expect(() => validateEnvironment()).not.toThrow();
      });
    });

    it('should reject invalid NODE_ENV values', () => {
      process.env.NODE_ENV = 'invalid';

      expect(() => validateEnvironment()).toThrow('Invalid NODE_ENV: invalid');
    });
  });

  describe('Optional Variables with Defaults', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.POSTGRES_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'a'.repeat(32);
    });

    it('should use default values for optional variables', () => {
      delete process.env.JWT_EXPIRES;
      delete process.env.CORS_ORIGIN;
      delete process.env.LOG_LEVEL;

      const config = validateEnvironment();

      expect(config.JWT_EXPIRES).toBe('1h');
      expect(config.CORS_ORIGIN).toBe('*');
      expect(config.LOG_LEVEL).toBe('info');
    });

    it('should use provided values when set', () => {
      process.env.JWT_EXPIRES = '24h';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.LOG_LEVEL = 'debug';

      const config = validateEnvironment();

      expect(config.JWT_EXPIRES).toBe('24h');
      expect(config.CORS_ORIGIN).toBe('https://example.com');
      expect(config.LOG_LEVEL).toBe('debug');
    });
  });

  describe('Production Warnings', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'test_db';
      process.env.POSTGRES_USER = 'test_user';
      process.env.JWT_SECRET = 'a'.repeat(32);
      
      // Spy on console.warn and clear any previous calls
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should warn about CORS_ORIGIN = "*" in production', () => {
      process.env.CORS_ORIGIN = '*';
      process.env.POSTGRES_PASSWORD = 'a'.repeat(16);

      validateEnvironment();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('CORS_ORIGIN is set to "*" in production')
      );
    });

    it('should warn about short password in production', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.POSTGRES_PASSWORD = 'short';

      validateEnvironment();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('POSTGRES_PASSWORD is shorter than 16 characters')
      );
    });

    it('should not warn with secure configuration', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.POSTGRES_PASSWORD = 'a'.repeat(20);

      validateEnvironment();

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});

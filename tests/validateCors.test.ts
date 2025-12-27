/**
 * Tests for CORS configuration validation
 */

import { validateCorsOrigin, getCorsErrorHelp } from '../src/utils/validateCors';
import { logger } from '../src/middleware/logging';

// Mock the logger
jest.mock('../src/middleware/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('validateCorsOrigin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Development Environment', () => {
    it('should allow wildcard when CORS_ORIGIN is not set in development', () => {
      const config = validateCorsOrigin(undefined, 'development');

      expect(config.origin).toBe('*');
      expect(config.credentials).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('CORS_ORIGIN is not set'));
    });

    it('should allow wildcard when explicitly set in development', () => {
      const config = validateCorsOrigin('*', 'development');

      expect(config.origin).toBe('*');
      expect(config.credentials).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('wildcard'));
    });

    it('should accept valid HTTP localhost origin in development', () => {
      const config = validateCorsOrigin('http://localhost:5173', 'development');

      expect(config.origin).toBe('http://localhost:5173');
      expect(config.credentials).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('http://localhost:5173'));
    });

    it('should accept valid HTTPS origin in development', () => {
      const config = validateCorsOrigin('https://dev.example.com', 'development');

      expect(config.origin).toBe('https://dev.example.com');
      expect(config.credentials).toBe(true);
    });
  });

  describe('Production Environment', () => {
    it('should throw error when CORS_ORIGIN is not set in production', () => {
      expect(() => validateCorsOrigin(undefined, 'production')).toThrow(
        'CORS_ORIGIN must be explicitly set in production',
      );
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'));
    });

    it('should throw error when CORS_ORIGIN is empty in production', () => {
      expect(() => validateCorsOrigin('', 'production')).toThrow(
        'CORS_ORIGIN must be explicitly set in production',
      );
    });

    it('should throw error when CORS_ORIGIN is wildcard in production', () => {
      expect(() => validateCorsOrigin('*', 'production')).toThrow(
        'CORS_ORIGIN cannot be wildcard (*) in production',
      );
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('wildcard'));
    });

    it('should accept valid HTTPS origin in production', () => {
      const config = validateCorsOrigin('https://example.com', 'production');

      expect(config.origin).toBe('https://example.com');
      expect(config.credentials).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('https://example.com'));
    });

    it('should warn about HTTP origin in production', () => {
      const config = validateCorsOrigin('http://example.com', 'production');

      expect(config.origin).toBe('http://example.com');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('HTTP (not HTTPS)'));
    });

    it('should warn about localhost in production', () => {
      const config = validateCorsOrigin('http://localhost:3000', 'production');

      expect(config.origin).toBe('http://localhost:3000');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('localhost'));
    });

    it('should accept HTTPS origin with port in production', () => {
      const config = validateCorsOrigin('https://example.com:8443', 'production');

      expect(config.origin).toBe('https://example.com:8443');
      expect(config.credentials).toBe(true);
    });
  });

  describe('Multiple Origins', () => {
    it('should handle comma-separated origins', () => {
      const config = validateCorsOrigin(
        'https://app.example.com,https://admin.example.com',
        'production',
      );

      expect(config.origin).toEqual(['https://app.example.com', 'https://admin.example.com']);
      expect(config.credentials).toBe(true);
    });

    it('should trim whitespace from multiple origins', () => {
      const config = validateCorsOrigin(
        'https://app.example.com , https://admin.example.com',
        'production',
      );

      expect(config.origin).toEqual(['https://app.example.com', 'https://admin.example.com']);
    });

    it('should filter empty origins from comma-separated list', () => {
      const config = validateCorsOrigin(
        'https://example.com,,https://app.example.com',
        'production',
      );

      expect(config.origin).toEqual(['https://example.com', 'https://app.example.com']);
    });
  });

  describe('Invalid Origins', () => {
    it('should reject origin without protocol', () => {
      expect(() => validateCorsOrigin('example.com', 'production')).toThrow('Invalid CORS origin');
    });

    it('should reject origin with path', () => {
      expect(() => validateCorsOrigin('https://example.com/app', 'production')).toThrow(
        'Invalid CORS origin',
      );
    });

    it('should reject origin with query string', () => {
      expect(() => validateCorsOrigin('https://example.com?test=1', 'production')).toThrow(
        'Invalid CORS origin',
      );
    });

    it('should reject origin with hash', () => {
      expect(() => validateCorsOrigin('https://example.com#section', 'production')).toThrow(
        'Invalid CORS origin',
      );
    });

    it('should reject origin with invalid protocol', () => {
      expect(() => validateCorsOrigin('ftp://example.com', 'production')).toThrow(
        'Invalid CORS origin',
      );
    });

    it('should reject malformed URL', () => {
      expect(() => validateCorsOrigin('not-a-url', 'production')).toThrow('Invalid CORS origin');
    });
  });

  describe('Edge Cases', () => {
    it('should accept origin with trailing slash (normalized by URL)', () => {
      // Note: URL('https://example.com/').pathname === '/' which is acceptable
      // The URL API normalizes 'https://example.com/' to the same as 'https://example.com'
      const config = validateCorsOrigin('https://example.com/', 'production');
      expect(config.origin).toBe('https://example.com/');
    });

    it('should handle origin with subdomain', () => {
      const config = validateCorsOrigin('https://app.subdomain.example.com', 'production');

      expect(config.origin).toBe('https://app.subdomain.example.com');
    });

    it('should handle 127.0.0.1 with warning in production', () => {
      const config = validateCorsOrigin('http://127.0.0.1:3000', 'production');

      expect(config.origin).toBe('http://127.0.0.1:3000');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('localhost'));
    });

    it('should default to development when NODE_ENV is not provided', () => {
      const config = validateCorsOrigin(undefined, undefined);

      expect(config.origin).toBe('*');
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});

describe('getCorsErrorHelp', () => {
  it('should return helpful error message', () => {
    const help = getCorsErrorHelp();

    expect(help).toContain('CORS Configuration Help');
    expect(help).toContain('Development');
    expect(help).toContain('Production');
    expect(help).toContain('https://');
    expect(help).toContain('Do NOT use wildcard');
  });
});

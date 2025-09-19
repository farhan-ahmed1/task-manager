import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import {
  generalRateLimit,
  authRateLimit,
  RedisStore,
  redisClient,
  resetRateLimit,
  rateLimitHealthCheck,
  keyGenerator,
  authKeyGenerator,
  rateLimitHandler,
  authRateLimitHandler,
  skipSuccessfulRequests,
  createRedisClient,
  initializeRedis,
  type RedisClientInterface,
  type RedisPipeline,
} from '../src/middleware/rateLimiting';

// Types for test mocks
interface MockRequest {
  user?: { id: string };
  headers: Record<string, string>;
  connection: { remoteAddress?: string };
  url?: string;
}

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
  get: jest.Mock;
}

interface MockRedisClient extends RedisClientInterface {
  setError(shouldError: boolean): void;
  clearData(): void;
}

// Mock Redis implementations
class MockRedisPipeline implements RedisPipeline {
  private operations: Array<{ type: string; key: string; value?: number }> = [];

  incr(key: string): RedisPipeline {
    this.operations.push({ type: 'incr', key });
    return this;
  }

  expire(key: string, seconds: number): RedisPipeline {
    this.operations.push({ type: 'expire', key, value: seconds });
    return this;
  }

  async exec(): Promise<Array<[Error | null, unknown]> | null> {
    return this.operations.map((op, index) => {
      if (op.type === 'incr') {
        return [null, index + 1];
      }
      return [null, 'OK'];
    });
  }
}

class TestMockRedisClient implements MockRedisClient {
  private data: Map<string, number> = new Map();
  private errorOnNext = false;
  private shouldError = false;

  pipeline(): RedisPipeline {
    if (this.shouldError) {
      throw new Error('Pipeline creation failed');
    }
    return new MockRedisPipeline();
  }

  async decr(key: string): Promise<number> {
    if (this.shouldError) {
      throw new Error('Decrement failed');
    }
    const current = this.data.get(key) || 0;
    const newValue = Math.max(0, current - 1);
    this.data.set(key, newValue);
    return newValue;
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.shouldError) {
      throw new Error('Keys lookup failed');
    }
    const allKeys = Array.from(this.data.keys());
    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys.filter((key) => regex.test(key));
  }

  async del(...keys: string[]): Promise<number> {
    if (this.shouldError) {
      throw new Error('Delete failed');
    }
    let deleted = 0;
    keys.forEach((key) => {
      if (this.data.has(key)) {
        this.data.delete(key);
        deleted++;
      }
    });
    return deleted;
  }

  async ping(): Promise<string> {
    if (this.shouldError) {
      throw new Error('Ping failed');
    }
    return 'PONG';
  }

  on(event: string, callback: (error?: Error) => void): void {
    if (this.errorOnNext) {
      setTimeout(() => callback(new Error('Redis connection error')), 10);
    }
  }

  async quit(): Promise<string> {
    return 'OK';
  }

  // Test helper methods
  setError(shouldError: boolean): void {
    this.shouldError = shouldError;
  }

  setConnectionError(errorOnNext: boolean): void {
    this.errorOnNext = errorOnNext;
  }

  clearData(): void {
    this.data.clear();
  }
}

describe('Rate Limiting Middleware', () => {
  let app: express.Application;
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockRedis = new TestMockRedisClient();
  });

  afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });

  describe('RedisStore', () => {
    beforeEach(() => {
      mockRedis.clearData();
      mockRedis.setError(false);
    });

    it('should increment key and return correct values', async () => {
      const store = new RedisStore(mockRedis, 'test:');
      const result = await store.increment('user123');

      expect(result.totalHits).toBe(1);
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(result.resetTime.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setError(true);
      const store = new RedisStore(mockRedis, 'test:');

      const result = await store.increment('user123');
      expect(result.totalHits).toBe(1);

      await expect(store.decrement('user123')).resolves.not.toThrow();
      await expect(store.resetKey('user123')).resolves.not.toThrow();
    });

    it('should handle pipeline returning null', async () => {
      const mockClient: RedisClientInterface = {
        pipeline: () => ({
          incr: jest.fn().mockReturnThis(),
          expire: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null),
        }),
        decr: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
        ping: jest.fn(),
        on: jest.fn(),
        quit: jest.fn(),
      };

      const store = new RedisStore(mockClient);
      const result = await store.increment('test');

      expect(result.totalHits).toBe(1);
      expect(result.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('Key Generators', () => {
    it('should generate user-based key for authenticated requests', () => {
      const req: MockRequest = {
        user: { id: 'user123' },
        headers: {},
        connection: { remoteAddress: '127.0.0.1' },
      };

      const key = keyGenerator(req as unknown as Request);
      expect(key).toBe('user:user123');
    });

    it('should generate IP-based key for unauthenticated requests', () => {
      const req: MockRequest = {
        headers: {},
        connection: { remoteAddress: '192.168.1.1' },
      };

      const key = keyGenerator(req as unknown as Request);
      expect(key).toBe('ip:192.168.1.1');
    });

    it('should use x-forwarded-for header when available', () => {
      const req: MockRequest = {
        headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const key = keyGenerator(req as unknown as Request);
      expect(key).toBe('ip:10.0.0.1');
    });

    it('should generate auth-specific keys', () => {
      const req: MockRequest = {
        headers: { 'x-forwarded-for': '10.0.0.1' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const key = authKeyGenerator(req as unknown as Request);
      expect(key).toBe('auth:10.0.0.1');
    });
  });

  describe('Rate Limit Handlers', () => {
    it('should return correct response for authenticated users', () => {
      const req: MockRequest = { user: { id: 'user123' }, headers: {}, connection: {} };
      const res: MockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        get: jest.fn().mockReturnValue('60'),
      };

      rateLimitHandler(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: '60',
      });
    });

    it('should return correct response for unauthenticated users', () => {
      const req: MockRequest = { headers: {}, connection: {} };
      const res: MockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        get: jest.fn().mockReturnValue('60'),
      };

      rateLimitHandler(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          'Too many requests from this IP. Please try again later or sign in for higher limits.',
        retryAfter: '60',
      });
    });

    it('should return auth-specific error message', () => {
      const req: MockRequest = { headers: {}, connection: {} };
      const res: MockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        get: jest.fn().mockReturnValue('900'),
      };

      authRateLimitHandler(req as unknown as Request, res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
        retryAfter: '900',
      });
    });
  });

  describe('Skip Function', () => {
    it('should skip successful health check requests', () => {
      const req: MockRequest = { url: '/health', headers: {}, connection: {} };
      const res: MockResponse & { statusCode: number } = {
        statusCode: 200,
        status: jest.fn(),
        json: jest.fn(),
        get: jest.fn(),
      };

      const result = skipSuccessfulRequests(req as unknown as Request, res as unknown as Response);
      expect(result).toBe(true);
    });

    it('should not skip failed health check requests', () => {
      const req: MockRequest = { url: '/health', headers: {}, connection: {} };
      const res: MockResponse & { statusCode: number } = {
        statusCode: 500,
        status: jest.fn(),
        json: jest.fn(),
        get: jest.fn(),
      };

      const result = skipSuccessfulRequests(req as unknown as Request, res as unknown as Response);
      expect(result).toBe(false);
    });
  });

  describe('Rate Limiters Integration', () => {
    beforeEach(() => {
      app.use('/general', generalRateLimit);
      app.get('/general/test', (req: Request, res: Response) => {
        res.json({ message: 'success' });
      });

      app.use('/auth', authRateLimit);
      app.post('/auth/login', (req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within rate limits', async () => {
      const generalResponse = await request(app).get('/general/test');
      expect(generalResponse.status).toBe(200);
      expect(generalResponse.body.message).toBe('success');

      const authResponse = await request(app).post('/auth/login');
      expect(authResponse.status).toBe(200);
      expect(authResponse.body.success).toBe(true);
    });

    it('should handle authenticated users differently', async () => {
      app.use('/auth-test', (req: Request, res: Response, next: NextFunction) => {
        (req as MockRequest).user = { id: 'testuser' };
        next();
      });
      app.use('/auth-test', generalRateLimit);
      app.get('/auth-test/endpoint', (req: Request, res: Response) => {
        res.json({ authenticated: true });
      });

      const response = await request(app).get('/auth-test/endpoint');
      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should handle resetRateLimit without Redis', async () => {
      await expect(resetRateLimit('test-key')).resolves.not.toThrow();
    });

    it('should return health check status', async () => {
      const health = await rateLimitHealthCheck();

      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('redis');
      expect(typeof health.redis).toBe('boolean');
    });
  });

  describe('Redis Client Factory and Initialization', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create Redis client with URL', () => {
      const client = createRedisClient('redis://localhost:6379');
      expect(client).toBeDefined();
    });

    it('should not initialize Redis in test environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const client = initializeRedis();
      expect(client).toBeNull();
    });

    it('should initialize Redis in non-test environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const client = initializeRedis();
      expect(client).toBeDefined();
    });

    it('should return null when REDIS_URL is not set', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.REDIS_URL;

      const client = initializeRedis();
      expect(client).toBeNull();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed headers and missing data', () => {
      const malformedReq: MockRequest = {
        headers: { 'x-forwarded-for': 'invalid,,,' },
        connection: { remoteAddress: '127.0.0.1' },
      };
      expect(keyGenerator(malformedReq as unknown as Request)).toBe('ip:invalid');

      const missingReq: MockRequest = {
        headers: {},
        connection: {},
      };
      expect(keyGenerator(missingReq as unknown as Request)).toMatch(/^ip:/);

      const authReq: MockRequest = {
        headers: {},
        connection: { remoteAddress: '127.0.0.1' },
      };
      expect(authKeyGenerator(authReq as unknown as Request)).toBe('auth:127.0.0.1');
    });

    it('should handle missing retry-after header', () => {
      const req: MockRequest = { user: { id: 'user123' }, headers: {}, connection: {} };
      const res: MockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      };

      rateLimitHandler(req as unknown as Request, res as unknown as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: undefined,
        }),
      );
    });

    it('should handle Redis client creation properly', () => {
      // Test that createRedisClient returns a valid client
      const client = createRedisClient('redis://localhost:6379');
      expect(client).toBeDefined();
      // The client should have the expected Redis interface methods
      expect(client).toHaveProperty('pipeline');
      expect(client).toHaveProperty('on');
      expect(client).toHaveProperty('ping');
    });
  });

  describe('RedisStore Error Handling', () => {
    it('should handle Redis decrement errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockRedis = new TestMockRedisClient();
      mockRedis.setError(true);

      const store = new RedisStore(mockRedis);

      // Should not throw, just log error
      await expect(store.decrement('test-key')).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Redis decrement error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle Redis reset key errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockRedis = new TestMockRedisClient();
      mockRedis.setError(true);

      const store = new RedisStore(mockRedis);

      // Should not throw, just log error
      await expect(store.resetKey('test-key')).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Redis reset error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle keys() returning empty array', async () => {
      const mockRedis = new TestMockRedisClient();
      mockRedis.clearData(); // Ensure no keys exist

      const store = new RedisStore(mockRedis);

      // Should not throw when no keys to delete
      await expect(store.resetKey('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('Rate Limit Health Check', () => {
    it('should return health status', async () => {
      const health = await rateLimitHealthCheck();

      expect(health.status).toBe('ok');
      expect(typeof health.redis).toBe('boolean');
    });
  });

  describe('Redis Error Scenarios', () => {
    let originalRedisUrl: string | undefined;
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      originalRedisUrl = process.env.REDIS_URL;
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      if (originalRedisUrl) {
        process.env.REDIS_URL = originalRedisUrl;
      } else {
        delete process.env.REDIS_URL;
      }
      if (originalNodeEnv) {
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should handle Redis client creation errors', async () => {
      process.env.REDIS_URL = 'redis://invalid-url:12345';
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Temporarily mock createRedisClient to throw an error
      const createRedisClientSpy = jest
        .spyOn(await import('../src/middleware/rateLimiting'), 'createRedisClient')
        .mockImplementation(() => {
          throw new Error('Failed to connect to Redis');
        });

      // Test the error path when Redis client creation fails
      const client = initializeRedis();

      expect(client).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      createRedisClientSpy.mockRestore();
    });

    it('should handle Redis connection error events', async () => {
      // Create a mock Redis client with all required methods
      const mockRedisClient = {
        on: jest.fn(),
        get: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
        pipeline: jest.fn(),
        quit: jest.fn(),
        ping: jest.fn(),
        decr: jest.fn(),
      } as unknown as RedisClientInterface;

      // Spy on the createRedisClient function and mock its return value
      const createRedisClientSpy = jest
        .spyOn(await import('../src/middleware/rateLimiting'), 'createRedisClient')
        .mockReturnValue(mockRedisClient);

      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call initializeRedis which should now use our mocked createRedisClient
      initializeRedis();

      // Verify the error handler was registered
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));

      // Simulate an error event
      const errorHandler = (mockRedisClient.on as jest.Mock).mock.calls[0][1];
      errorHandler(new Error('Connection lost'));

      expect(consoleSpy).toHaveBeenCalledWith('Redis connection error:', expect.any(Error));

      // Cleanup
      consoleSpy.mockRestore();
      createRedisClientSpy.mockRestore();
    });
  });
});

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import Redis from 'ioredis';
import { Request, Response } from 'express';

// Types for better testability
export interface RateLimitStore {
  increment(key: string): Promise<{ totalHits: number; resetTime: Date }>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}

export interface RedisPipeline {
  incr(key: string): RedisPipeline;
  expire(key: string, seconds: number): RedisPipeline;
  exec(): Promise<Array<[Error | null, unknown]> | null>;
}

export interface RedisClientInterface {
  pipeline(): RedisPipeline;
  decr(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  ping(): Promise<string>;
  on(event: string, callback: (error?: Error) => void): void;
  quit(): Promise<string>;
}

// Redis client factory for better testability
export const createRedisClient = (url: string): RedisClientInterface => {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

// Redis client instance
let redisClient: RedisClientInterface | null = null;

// Initialize Redis client if available
export const initializeRedis = (): RedisClientInterface | null => {
  if (process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
    try {
      redisClient = createRedisClient(process.env.REDIS_URL);

      redisClient.on('error', (err) => {
        console.error('Redis connection error:', err);
        // Fallback to memory store if Redis fails
        redisClient = null;
      });

      return redisClient;
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redisClient = null;
      return null;
    }
  }
  return null;
};

// Initialize Redis on module load
redisClient = initializeRedis();

// Custom store for Redis-backed rate limiting
export class RedisStore implements RateLimitStore {
  private redis: RedisClientInterface;
  private prefix: string;

  constructor(redis: RedisClientInterface, prefix = 'rl:') {
    this.redis = redis;
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;
    const windowMs = 60 * 1000; // 1 minute window
    const now = Date.now();
    const window = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${redisKey}:${window}`;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      const totalHits = (results?.[0]?.[1] as number) || 1;
      const resetTime = new Date(window + windowMs);

      return { totalHits, resetTime };
    } catch (error) {
      console.error('Redis store error:', error);
      // Fallback behavior
      return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    const windowMs = 60 * 1000;
    const now = Date.now();
    const window = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${redisKey}:${window}`;

    try {
      await this.redis.decr(windowKey);
    } catch (error) {
      console.error('Redis decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      const keys = await this.redis.keys(`${redisKey}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }
}

// Key generator function that considers user authentication
export const keyGenerator = (req: Request): string => {
  const authReq = req as Request & { user?: { id: string } };

  // Use user ID if authenticated, otherwise use IP
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }

  // Use forwarded IP if behind proxy, otherwise use connection IP
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
  return `ip:${ip}`;
};

// Custom handler for rate limit exceeded
export const rateLimitHandler = (req: Request, res: Response): void => {
  const authReq = req as Request & { user?: { id: string } };
  const isAuthenticated = !!authReq.user?.id;

  res.status(429).json({
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: isAuthenticated
      ? 'You have exceeded the rate limit. Please try again later.'
      : 'Too many requests from this IP. Please try again later or sign in for higher limits.',
    retryAfter: res.get('Retry-After'),
  });
};

// Skip function for certain routes or conditions
export const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  // Skip counting successful requests for health checks
  if (req.url === '/health' && res.statusCode < 400) {
    return true;
  }
  return false;
};

// General API rate limiter
export const generalRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const authReq = req as Request & { user?: { id: string } };
    // Higher limits for authenticated users
    return authReq.user?.id ? 1000 : 100;
  },
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  standardHeaders: true,
  legacyHeaders: false,
  // store: redisClient ? new RedisStore(redisClient) : undefined, // Disabled for now, using memory store
});

// Auth-specific key generator that always uses IP
export const authKeyGenerator = (req: Request): string => {
  // Always use IP for auth endpoints
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
  return `auth:${ip}`;
};

// Auth-specific handler for rate limit exceeded
export const authRateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    retryAfter: res.get('Retry-After'),
  });
};

// Strict rate limiter for authentication endpoints
export const authRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  keyGenerator: authKeyGenerator,
  handler: authRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  // store: redisClient ? new RedisStore(redisClient, 'auth:') : undefined, // Disabled for now
});

// More lenient rate limiter for read operations
export const readRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req: Request) => {
    const authReq = req as Request & { user?: { id: string } };
    return authReq.user?.id ? 200 : 50;
  },
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  standardHeaders: true,
  legacyHeaders: false,
  // store: redisClient ? new RedisStore(redisClient, 'read:') : undefined, // Disabled for now
});

// Strict rate limiter for write operations
export const writeRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req: Request) => {
    const authReq = req as Request & { user?: { id: string } };
    return authReq.user?.id ? 60 : 10;
  },
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  // store: redisClient ? new RedisStore(redisClient, 'write:') : undefined, // Disabled for now
});

// Export Redis client for testing
export { redisClient };

// Helper function to reset rate limits (useful for testing)
export const resetRateLimit = async (key: string): Promise<void> => {
  if (redisClient) {
    const store = new RedisStore(redisClient);
    await store.resetKey(key);
  }
};

// Health check for rate limiting service
export const rateLimitHealthCheck = async (): Promise<{ status: string; redis: boolean }> => {
  let redisStatus = false;

  if (redisClient) {
    try {
      await redisClient.ping();
      redisStatus = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
  }

  return {
    status: 'ok',
    redis: redisStatus,
  };
};

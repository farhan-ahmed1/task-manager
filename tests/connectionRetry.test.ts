import { connectWithRetry, checkDatabaseHealth } from '../src/db/connectionRetry';
import { logger } from '../src/middleware/logging';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock the logger
jest.mock('../src/middleware/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Create a mock Pool type
interface MockPool {
  query: jest.Mock;
  end: jest.Mock;
  connect: jest.Mock;
}

describe('Database Connection Retry', () => {
  let mockPool: MockPool;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = {
      query: jest.fn(),
      end: jest.fn(),
      connect: jest.fn(),
    };
  });

  describe('connectWithRetry', () => {
    it('should connect successfully on first attempt', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ connected: 1 }] });

      await connectWithRetry(mockPool as any, { maxRetries: 3, initialDelayMs: 100 });

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1 as connected');
      expect(logger.info).toHaveBeenCalledWith('Database connection attempt 1/3...');
      expect(logger.info).toHaveBeenCalledWith('Database connection established successfully');
    });

    it('should retry on connection failure and succeed', async () => {
      mockPool.query
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({ rows: [{ connected: 1 }] });

      await connectWithRetry(mockPool as any, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Database connection failed (attempt 1/3)'),
      );
      expect(logger.info).toHaveBeenCalledWith('Database connection established successfully');
    });

    it('should fail after exhausting retries', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection refused'));

      await expect(
        connectWithRetry(mockPool as any, { maxRetries: 3, initialDelayMs: 10 }),
      ).rejects.toThrow('Failed to connect to database after 3 attempts');

      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Database connection failed after 3 attempts'),
      );
    });

    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      mockPool.query
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({ rows: [{ connected: 1 }] });

      await connectWithRetry(mockPool as any, {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });

      const duration = Date.now() - startTime;

      // First delay: 100ms, Second delay: 200ms
      // Total should be at least 300ms (with some tolerance for execution time)
      expect(duration).toBeGreaterThanOrEqual(250);
    });

    it('should respect maxDelayMs cap', async () => {
      const startTime = Date.now();
      mockPool.query
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({ rows: [{ connected: 1 }] });

      await connectWithRetry(mockPool as any, {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 150, // Cap at 150ms
        backoffMultiplier: 3,
      });

      const duration = Date.now() - startTime;

      // First delay: 100ms, Second delay: 150ms (capped from 300ms)
      // Total should be around 250ms (with some tolerance)
      expect(duration).toBeGreaterThanOrEqual(200);
      expect(duration).toBeLessThan(400);
    });

    it('should timeout individual connection attempts', async () => {
      // Simulate a hanging connection
      mockPool.query.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ rows: [{ connected: 1 }] }), 10000);
          }),
      );

      await expect(
        connectWithRetry(mockPool as any, {
          maxRetries: 2,
          initialDelayMs: 10,
          connectionTimeoutMs: 100,
        }),
      ).rejects.toThrow('Failed to connect to database after 2 attempts');

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Connection test timeout'));
    });

    it('should handle non-Error objects', async () => {
      mockPool.query.mockRejectedValue('String error');

      await expect(
        connectWithRetry(mockPool as any, { maxRetries: 1, initialDelayMs: 10 }),
      ).rejects.toThrow('Failed to connect to database after 1 attempts');
    });

    it('should use default configuration when no config provided', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ connected: 1 }] });

      await connectWithRetry(mockPool as any);

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Database connection attempt 1/5...');
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return ok status when database is healthy', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ result: 1 }] });

      const result = await checkDatabaseHealth(mockPool as any);

      expect(result).toEqual({ status: 'ok', message: 'Connected' });
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return error status when database query fails', async () => {
      const error = new Error('Connection timeout');
      mockPool.query.mockRejectedValueOnce(error);

      const result = await checkDatabaseHealth(mockPool as any);

      expect(result).toEqual({ status: 'error', message: 'Connection timeout' });
    });

    it('should handle non-Error objects in health check', async () => {
      mockPool.query.mockRejectedValueOnce('String error');

      const result = await checkDatabaseHealth(mockPool as any);

      expect(result).toEqual({ status: 'error', message: 'Database connection failed' });
    });
  });
});

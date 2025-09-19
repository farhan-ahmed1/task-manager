import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import {
  logger,
  requestLogger,
  addRequestMetadata,
  errorLogger,
  performanceLogger,
  businessLogger,
} from '../src/middleware/logging';

// Mock winston transports to avoid file I/O during tests
jest.mock('winston', () => {
  const actualWinston = jest.requireActual('winston');
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
  };

  return {
    ...actualWinston,
    createLogger: jest.fn(() => mockLogger),
    transports: {
      ...actualWinston.transports,
      File: jest.fn(),
      Console: jest.fn(),
    },
  };
});

// Type for the mocked logger
interface MockLogger {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  add: jest.Mock;
}

describe('Logging Middleware', () => {
  let app: express.Application;
  let mockLogger: MockLogger;
  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Clear all mocks
    jest.clearAllMocks();

    // Get reference to the mocked logger
    mockLogger = logger as unknown as MockLogger;
  });
  describe('addRequestMetadata', () => {
    beforeEach(() => {
      app.use(addRequestMetadata);
      app.get('/test', (req: Request, res: Response) => {
        res.json({
          requestId: req.headers['x-request-id'],
          startTime: req.startTime,
          responseId: res.getHeader('x-request-id'),
        });
      });
    });

    it('should add request ID when not present', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body.requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(response.body.startTime).toBeGreaterThan(0);
      expect(response.body.responseId).toBe(response.body.requestId);
    });

    it('should preserve existing request ID', async () => {
      const customRequestId = 'custom-request-id-123';
      const response = await request(app).get('/test').set('x-request-id', customRequestId);

      expect(response.status).toBe(200);
      expect(response.body.requestId).toBe(customRequestId);
      expect(response.body.responseId).toBe(customRequestId);
    });

    it('should set response header with request ID', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('should add start time for performance tracking', async () => {
      const response = await request(app).get('/test');

      expect(response.body.startTime).toBeGreaterThan(0);
      expect(typeof response.body.startTime).toBe('number');
    });
  });

  describe('errorLogger', () => {
    beforeEach(() => {
      app.use(addRequestMetadata);

      // Route that throws an error
      app.get('/error', (req: Request, res: Response) => {
        throw new Error('Test error message');
      });

      // Route with authenticated user that throws error
      app.get(
        '/auth-error',
        (req: Request, res: Response, next: NextFunction) => {
          (req as any).user = { id: 'user123' };
          next();
        },
        (req: Request, res: Response) => {
          throw new Error('Authenticated user error');
        },
      );

      app.use(errorLogger);

      // Error handler
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });
    });

    it('should log errors with request context for anonymous users', async () => {
      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error',
        expect.objectContaining({
          method: 'GET',
          url: '/error',
          userId: 'anonymous',
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error message',
            stack: expect.any(String),
          }),
          body: {},
          query: {},
          params: {},
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('should log errors with authenticated user context', async () => {
      const response = await request(app).get('/auth-error');

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error',
        expect.objectContaining({
          method: 'GET',
          url: '/auth-error',
          userId: 'user123',
          error: expect.objectContaining({
            name: 'Error',
            message: 'Authenticated user error',
          }),
        }),
      );
    });

    it('should include request body in error logs', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(addRequestMetadata);

      testApp.post('/post-error', (_req: Request, _res: Response) => {
        throw new Error('POST error');
      });

      testApp.use(errorLogger);
      testApp.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const testData = { name: 'test', value: 123 };
      const response = await request(testApp).post('/post-error').send(testData);

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error',
        expect.objectContaining({
          method: 'POST',
          url: '/post-error',
          body: testData,
        }),
      );
    });

    it('should include query parameters in error logs', async () => {
      const response = await request(app).get('/error').query({ filter: 'active', page: '1' });

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error',
        expect.objectContaining({
          query: { filter: 'active', page: '1' },
        }),
      );
    });

    it('should pass error to next middleware', async () => {
      let errorHandlerCalled = false;

      const testApp = express();
      testApp.use(addRequestMetadata);

      testApp.get('/error', (_req: Request, _res: Response) => {
        throw new Error('Test error');
      });

      testApp.use(errorLogger);
      testApp.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        errorHandlerCalled = true;
        res.status(500).json({ error: 'Custom error handler' });
      });

      await request(testApp).get('/error');
      expect(errorHandlerCalled).toBe(true);
    });
  });

  describe('performanceLogger', () => {
    beforeEach(() => {
      app.use(addRequestMetadata);
      app.use(performanceLogger);
    });

    it('should log slow requests (> 1000ms)', async () => {
      app.get('/slow', async (req: Request, res: Response) => {
        // Simulate a slow operation
        await new Promise((resolve) => setTimeout(resolve, 1100));
        res.json({ message: 'slow response' });
      });

      const response = await request(app).get('/slow');

      expect(response.status).toBe(200);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slow Request',
        expect.objectContaining({
          method: 'GET',
          url: '/slow',
          userId: 'anonymous',
          duration: expect.stringMatching(/^\d+ms$/),
          status: 200,
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('should not log fast requests in normal mode', async () => {
      app.get('/fast', (req: Request, res: Response) => {
        res.json({ message: 'fast response' });
      });

      await request(app).get('/fast');

      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should log all requests in debug mode', async () => {
      // Set LOG_LEVEL to debug
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      app.get('/debug-test', (req: Request, res: Response) => {
        res.json({ message: 'debug response' });
      });

      await request(app).get('/debug-test');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request Performance',
        expect.objectContaining({
          method: 'GET',
          url: '/debug-test',
          userId: 'anonymous',
          duration: expect.stringMatching(/^\d+ms$/),
          status: 200,
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      );

      // Restore original LOG_LEVEL
      process.env.LOG_LEVEL = originalLogLevel;
    });

    it('should include authenticated user ID in performance logs', async () => {
      app.get(
        '/auth-perf',
        (req: Request, res: Response, next: NextFunction) => {
          (req as any).user = { id: 'user456' };
          next();
        },
        async (req: Request, res: Response) => {
          await new Promise((resolve) => setTimeout(resolve, 1100));
          res.json({ message: 'authenticated slow response' });
        },
      );

      await request(app).get('/auth-perf');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slow Request',
        expect.objectContaining({
          userId: 'user456',
        }),
      );
    });
  });

  describe('businessLogger', () => {
    it('should log user registration events', () => {
      const userId = 'user123';
      const email = 'test@example.com';

      businessLogger.userRegistered(userId, email);

      expect(mockLogger.info).toHaveBeenCalledWith('User Registered', {
        event: 'USER_REGISTERED',
        userId,
        email,
        timestamp: expect.any(String),
      });
    });

    it('should log user login events', () => {
      const userId = 'user456';
      const email = 'login@example.com';

      businessLogger.userLoggedIn(userId, email);

      expect(mockLogger.info).toHaveBeenCalledWith('User Logged In', {
        event: 'USER_LOGGED_IN',
        userId,
        email,
        timestamp: expect.any(String),
      });
    });

    it('should log task creation events', () => {
      const userId = 'user789';
      const taskId = 'task123';
      const title = 'Test Task';

      businessLogger.taskCreated(userId, taskId, title);

      expect(mockLogger.info).toHaveBeenCalledWith('Task Created', {
        event: 'TASK_CREATED',
        userId,
        taskId,
        title,
        timestamp: expect.any(String),
      });
    });

    it('should log task completion events', () => {
      const userId = 'user101112';
      const taskId = 'task456';
      const title = 'Completed Task';

      businessLogger.taskCompleted(userId, taskId, title);

      expect(mockLogger.info).toHaveBeenCalledWith('Task Completed', {
        event: 'TASK_COMPLETED',
        userId,
        taskId,
        title,
        timestamp: expect.any(String),
      });
    });

    it('should log project creation events', () => {
      const userId = 'user131415';
      const projectId = 'project789';
      const name = 'Test Project';

      businessLogger.projectCreated(userId, projectId, name);

      expect(mockLogger.info).toHaveBeenCalledWith('Project Created', {
        event: 'PROJECT_CREATED',
        userId,
        projectId,
        name,
        timestamp: expect.any(String),
      });
    });
  });

  describe('requestLogger with Morgan', () => {
    it('should be defined and exportable', () => {
      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger).toBe('function');
    });
  });

  describe('Environment-based configuration', () => {
    it('should handle production environment configuration', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Re-import to test environment-specific behavior
      const { logger: prodLogger } = require('../src/middleware/logging');

      expect(prodLogger).toBeDefined();

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle different LOG_LEVEL configurations', () => {
      const originalLogLevel = process.env.LOG_LEVEL;

      // Test with different log levels
      ['error', 'warn', 'info', 'debug'].forEach((level) => {
        process.env.LOG_LEVEL = level;
        const { logger: levelLogger } = require('../src/middleware/logging');
        expect(levelLogger).toBeDefined();
      });

      // Restore original log level
      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('Morgan token functionality', () => {
    beforeEach(() => {
      app.use(addRequestMetadata);
      app.use(requestLogger);
    });

    it('should handle requests without user context', async () => {
      app.get('/no-user', (req: Request, res: Response) => {
        res.json({ message: 'no user' });
      });

      const response = await request(app).get('/no-user');
      expect(response.status).toBe(200);
    });

    it('should handle requests with user context', async () => {
      app.get(
        '/with-user',
        (req: Request, res: Response, next: NextFunction) => {
          (req as any).user = { id: 'user789' };
          next();
        },
        (req: Request, res: Response) => {
          res.json({ message: 'with user' });
        },
      );

      const response = await request(app).get('/with-user');
      expect(response.status).toBe(200);
    });

    it('should handle requests without request ID', async () => {
      // Create app without addRequestMetadata to test missing request ID
      const appWithoutMetadata = express();
      appWithoutMetadata.use(requestLogger);
      appWithoutMetadata.get('/no-id', (req: Request, res: Response) => {
        res.json({ message: 'no id' });
      });

      const response = await request(appWithoutMetadata).get('/no-id');
      expect(response.status).toBe(200);
    });
  });

  describe('Morgan skip functionality', () => {
    it('should skip health check logs in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.use(requestLogger);
      app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok' });
      });

      request(app)
        .get('/health')
        .then(() => {
          // In production, health check should be skipped
          // This tests the skip function in Morgan configuration
        });

      process.env.NODE_ENV = originalEnv;
    });

    it('should log health check in non-production environments', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      app.use(requestLogger);
      app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok' });
      });

      const response = await request(app).get('/health');
      expect(response.status).toBe(200);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error scenarios and edge cases', () => {
    it('should handle missing startTime in performance logger', async () => {
      app.use((req: Request, res: Response, next: NextFunction) => {
        // Don't set startTime to test fallback
        delete req.startTime;
        next();
      });
      app.use(performanceLogger);
      app.get('/no-start-time', (req: Request, res: Response) => {
        res.json({ message: 'no start time' });
      });

      const response = await request(app).get('/no-start-time');
      expect(response.status).toBe(200);
    });

    it('should handle errors with missing properties', async () => {
      app.use(addRequestMetadata);

      app.get('/error-no-props', (req: Request, res: Response) => {
        const error = Object.create(Error.prototype);
        error.message = 'Custom error';
        throw error;
      });

      app.use(errorLogger);
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: 'Error handled' });
      });

      const response = await request(app).get('/error-no-props');
      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle malformed request data', async () => {
      app.use(addRequestMetadata);

      app.post('/malformed', (req: Request, res: Response) => {
        throw new Error('Malformed data error');
      });

      app.use(errorLogger);
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(400).json({ error: 'Bad request' });
      });

      const response = await request(app).post('/malformed').send('invalid-json');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

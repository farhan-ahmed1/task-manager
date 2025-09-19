import winston from 'winston';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'task-manager-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

// Custom token for request ID
morgan.token('id', (req: Request) => {
  return (req.headers['x-request-id'] as string) || 'no-id';
});

// Custom token for user ID
morgan.token('user', (req: Request) => {
  const authReq = req as Request & { user?: { id: string } };
  return authReq.user?.id || 'anonymous';
});

// Custom token for response time in a more readable format
morgan.token('response-time-ms', (req: Request) => {
  const startTime = req.startTime || Date.now();
  return `${Date.now() - startTime}ms`;
});

// Enhanced Morgan format with structured data
const morganFormat =
  process.env.NODE_ENV === 'production'
    ? ':id :user :method :url :status :res[content-length] - :response-time ms'
    : ':id :user :method :url :status :res[content-length] - :response-time ms :response-time-ms';

// Morgan middleware with custom stream
const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      const logData = message.trim().split(' ');
      const [requestId, userId, method, url, status, contentLength, , responseTime] = logData;

      logger.info('HTTP Request', {
        requestId,
        userId,
        method,
        url,
        status: parseInt(status, 10),
        contentLength: contentLength !== '-' ? parseInt(contentLength, 10) : 0,
        responseTime,
        timestamp: new Date().toISOString(),
      });
    },
  },
  skip: (req: Request) => {
    // Skip health check logs in production to reduce noise
    return process.env.NODE_ENV === 'production' && req.url === '/health';
  },
});

// Middleware to add request ID and start time
export const addRequestMetadata = (req: Request, res: Response, next: NextFunction): void => {
  // Add request ID if not present
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] =
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Add start time for performance tracking
  req.startTime = Date.now();

  // Add request ID to response headers for debugging
  res.setHeader('x-request-id', req.headers['x-request-id'] as string);

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string;
  const authReq = req as Request & { user?: { id: string } };
  const userId = authReq.user?.id || 'anonymous';

  logger.error('API Error', {
    requestId,
    userId,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
  });

  next(err);
};

// Performance logging middleware
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const requestId = req.headers['x-request-id'] as string;
    const authReq = req as Request & { user?: { id: string } };

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow Request', {
        requestId,
        userId: authReq.user?.id || 'anonymous',
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        status: res.statusCode,
        timestamp: new Date().toISOString(),
      });
    }

    // Log all requests in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Request Performance', {
        requestId,
        userId: authReq.user?.id || 'anonymous',
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        status: res.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};

// Business logic logger for important events
export const businessLogger = {
  userRegistered: (userId: string, email: string) => {
    logger.info('User Registered', {
      event: 'USER_REGISTERED',
      userId,
      email,
      timestamp: new Date().toISOString(),
    });
  },

  userLoggedIn: (userId: string, email: string) => {
    logger.info('User Logged In', {
      event: 'USER_LOGGED_IN',
      userId,
      email,
      timestamp: new Date().toISOString(),
    });
  },

  taskCreated: (userId: string, taskId: string, title: string) => {
    logger.info('Task Created', {
      event: 'TASK_CREATED',
      userId,
      taskId,
      title,
      timestamp: new Date().toISOString(),
    });
  },

  taskCompleted: (userId: string, taskId: string, title: string) => {
    logger.info('Task Completed', {
      event: 'TASK_COMPLETED',
      userId,
      taskId,
      title,
      timestamp: new Date().toISOString(),
    });
  },

  projectCreated: (userId: string, projectId: string, name: string) => {
    logger.info('Project Created', {
      event: 'PROJECT_CREATED',
      userId,
      projectId,
      name,
      timestamp: new Date().toISOString(),
    });
  },
};

// Export the logger for use in other modules
export { logger, requestLogger };

// Extend Request interface for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

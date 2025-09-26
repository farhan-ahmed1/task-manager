import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import projectsRouter from './routes/projects';
import { setupSwagger } from './config/swagger';
import {
  addRequestMetadata,
  requestLogger,
  errorLogger,
  performanceLogger,
} from './middleware/logging';
import {
  generalRateLimit,
  authRateLimit,
  readRateLimit,
  rateLimitHealthCheck,
} from './middleware/rateLimiting';

dotenv.config();

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
);

// Compression middleware
app.use(compression());

// Request metadata and logging
app.use(addRequestMetadata);
app.use(requestLogger);
app.use(performanceLogger);

// Body parsing middleware with workaround for browser Content-Type issues
app.use(
  express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain'], // Accept both content types
  }),
);

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (disabled in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(generalRateLimit);
}

// API Documentation
setupSwagger(app);

// Routes with specific rate limiting (disabled in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use('/auth', authRateLimit, authRouter);
  app.use('/api/tasks', readRateLimit, tasksRouter);
  app.use('/api/projects', readRateLimit, projectsRouter);
} else {
  app.use('/auth', authRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/projects', projectsRouter);
}

// Health check endpoint with comprehensive status
app.get('/health', async (_req, res) => {
  try {
    const rateLimitStatus = await rateLimitHealthCheck();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        rateLimit: rateLimitStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Performance metrics endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/metrics', (_req, res) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
      },
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    });
  });
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

import { Request, Response, NextFunction } from 'express';

// Error logging middleware
app.use(errorLogger);

// Centralized error handler
type AppError = Error & { status?: number; code?: string };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  const status =
    err.name === 'TaskNotFoundError'
      ? 404
      : err.name === 'ProjectNotFoundError'
        ? 404
        : err.name === 'ZodError'
          ? 400
          : err.status || 500;
  const code = err.code || err.name || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Don't expose internal errors in production
  const publicMessage =
    status === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message;

  res.status(status).json({
    error: publicMessage,
    code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;

import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import projectsRouter from './routes/projects';
import sectionsRouter from './routes/sections';
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
import { requestTimeout } from './middleware/timeout';
import { validateEnvironment } from './utils/validateEnv';

dotenv.config();

// Validate environment variables before starting the application
validateEnvironment();

const app = express();

// Request timeout (30 seconds default, configurable via env)
const timeoutMs = process.env.REQUEST_TIMEOUT_MS
  ? parseInt(process.env.REQUEST_TIMEOUT_MS, 10)
  : 30000;
app.use(requestTimeout(timeoutMs));

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

// Rate limiting (disabled in test environment or when explicitly disabled)
const rateLimitingDisabled =
  process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true';

if (!rateLimitingDisabled) {
  app.use(generalRateLimit);
}

// API Documentation
setupSwagger(app);

// Routes with specific rate limiting (disabled in test environment or when explicitly disabled)
if (!rateLimitingDisabled) {
  app.use('/auth', authRateLimit, authRouter);
  app.use('/api/tasks', readRateLimit, tasksRouter);
  app.use('/api/projects', readRateLimit, projectsRouter);
  app.use('/api/sections', readRateLimit, sectionsRouter);
} else {
  app.use('/auth', authRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/sections', sectionsRouter);
}

// Health check endpoint with comprehensive status
app.get('/health', async (_req, res) => {
  try {
    const rateLimitStatus = await rateLimitHealthCheck();

    // Check database connection
    let dbStatus = 'ok';
    let dbMessage = 'Connected';
    try {
      const { default: pool } = await import('./db/pool');
      await pool.query('SELECT 1');
    } catch (dbError) {
      dbStatus = 'error';
      dbMessage = dbError instanceof Error ? dbError.message : 'Database connection failed';
    }

    const isHealthy = dbStatus === 'ok' && rateLimitStatus.status === 'ok';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          message: dbMessage,
        },
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

let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, () => {
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
  // Handle specific error types
  const status =
    err.name === 'TaskNotFoundError' || err.name === 'ProjectNotFoundError'
      ? 404
      : err.name === 'UnauthorizedError'
        ? 401
        : err.name === 'ValidationError'
          ? 400
          : err.name === 'ZodError'
            ? 400
            : err.name === 'DatabaseError'
              ? 500
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

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }

  try {
    // Close database connections
    const pool = await import('./db/pool');
    await pool.default.end();
    console.log('Database connections closed');

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle termination signals
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;

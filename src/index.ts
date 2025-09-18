import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import projectsRouter from './routes/projects';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

import { Request, Response, NextFunction } from 'express';

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
  // Optionally log error here
  res.status(status).json({ error: message, code });
});

export default app;

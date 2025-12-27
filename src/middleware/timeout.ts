import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware
 * Ensures requests don't hang indefinitely by setting a timeout
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
          message: `Request exceeded ${timeoutMs}ms timeout`,
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

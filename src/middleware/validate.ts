import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request', details: result.error.format() });
    }
    // attach parsed data
    req.body = result.data;
    return next();
  };
};

export default validateBody;

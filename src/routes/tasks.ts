import express, { Response, NextFunction } from 'express';
import { CreateTaskSchema, UpdateTaskSchema } from '../validation/task';
import * as taskRepo from '../db/repository';
import { TaskNotFoundError } from '../utils/errors';
import requireAuth, { AuthedRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/tasks - Create task
router.post('/', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const data = CreateTaskSchema.parse(req.body);
    const task = await taskRepo.createTask(userId, data);
    res.status(201).json({ data: task, message: 'Task created successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks - List tasks
router.get('/', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const tasks = await taskRepo.getTasks(userId);
    res.json({ data: tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const task = await taskRepo.getTaskById(userId, id);
    if (!task) throw new TaskNotFoundError(id);
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const updates = UpdateTaskSchema.parse(req.body);
    const updated = await taskRepo.updateTask(userId, id, updates);
    if (!updated) throw new TaskNotFoundError(id);
    res.json({ data: updated, message: 'Task updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const deleted = await taskRepo.deleteTask(userId, id);
      if (!deleted) throw new TaskNotFoundError(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;

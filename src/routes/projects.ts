import express, { Response, NextFunction } from 'express';
import requireAuth, { AuthedRequest } from '../middleware/auth';
import * as repo from '../db/repository';
import { CreateProjectSchema, UpdateProjectSchema } from '../validation/project';
import { ProjectNotFoundError } from '../utils/errors';

const router = express.Router();

// Create project
router.post('/', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.userId!;
    const data = CreateProjectSchema.parse(req.body);
    const project = await repo.createProject(ownerId, data.name, data.description);
    res.status(201).json({ data: project, message: 'Project created successfully' });
  } catch (err) {
    next(err);
  }
});

// List projects for owner
router.get('/', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.userId!;
    const projects = await repo.getProjectsForOwner(ownerId);
    res.json({ data: projects });
  } catch (err) {
    next(err);
  }
});

// Get single project
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.userId!;
    const { id } = req.params;
    const project = await repo.getProjectById(ownerId, id);
    if (!project) throw new ProjectNotFoundError(id);
    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

// Update project
router.put('/:id', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.userId!;
    const { id } = req.params;
    const updates = UpdateProjectSchema.parse(req.body);
    const updated = await repo.updateProject(ownerId, id, updates);
    if (!updated) throw new ProjectNotFoundError(id);
    res.json({ data: updated, message: 'Project updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Delete project
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const ownerId = req.userId!;
      const { id } = req.params;
      const ok = await repo.deleteProject(ownerId, id);
      if (!ok) throw new ProjectNotFoundError(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// Project stats
router.get(
  '/:id/stats',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const ownerId = req.userId!;
      const { id } = req.params;
      const project = await repo.getProjectById(ownerId, id);
      if (!project) throw new ProjectNotFoundError(id);
      const stats = await repo.getProjectStats(ownerId, id);
      res.json({ data: stats });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

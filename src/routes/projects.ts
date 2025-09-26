import express, { Response, NextFunction } from 'express';
import requireAuth, { AuthedRequest } from '../middleware/auth';
import * as repo from '../db/repository';
import { CreateProjectSchema, UpdateProjectSchema, InviteUserSchema } from '../validation/project';
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

// Project sharing endpoints

// Get project members
router.get(
  '/:id/members',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const members = await repo.getProjectMembers(userId, id);
      res.json({ data: members });
    } catch (err) {
      next(err);
    }
  },
);

// Invite user to project
router.post(
  '/:id/invite',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const invitedBy = req.userId!;
      const { id } = req.params;
      const data = InviteUserSchema.parse(req.body);

      const invitation = await repo.inviteUserToProject(invitedBy, id, data.email, data.role);
      res.status(201).json({
        data: invitation,
        message: 'Invitation sent successfully',
      });
    } catch (err) {
      next(err);
    }
  },
);

// Accept project invitation
router.post(
  '/accept-invitation/:token',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { token } = req.params;
      const member = await repo.acceptProjectInvitation(token, userId);
      res.json({
        data: member,
        message: 'Successfully joined project',
      });
    } catch (err) {
      next(err);
    }
  },
);

// Remove project member
router.delete(
  '/:id/members/:userId',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const removedBy = req.userId!;
      const { id, userId } = req.params;
      const success = await repo.removeProjectMember(removedBy, id, userId);

      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Member not found or cannot be removed' });
      }
    } catch (err) {
      next(err);
    }
  },
);

export default router;

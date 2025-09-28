import express, { Response, NextFunction } from 'express';
import { CreateSectionSchema, UpdateSectionSchema } from '../validation/section';
import * as sectionRepo from '../db/repository';
import requireAuth, { AuthedRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/sections - Create section
router.post('/', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const data = CreateSectionSchema.parse(req.body);
    const section = await sectionRepo.createSection(userId, data);
    res.status(201).json({ data: section, message: 'Section created successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/sections - List sections
router.get('/', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const projectId = typeof req.query.project_id === 'string' ? req.query.project_id : undefined;
    const sections = await sectionRepo.getSections(userId, projectId);
    res.json({ data: sections });
  } catch (err) {
    next(err);
  }
});

// GET /api/sections/:id - Get single section
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const section = await sectionRepo.getSectionById(userId, id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found', code: 'SECTION_NOT_FOUND' });
    }
    res.json({ data: section });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sections/:id - Update section
router.put('/:id', requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const updates = UpdateSectionSchema.parse(req.body);
    const updated = await sectionRepo.updateSection(userId, id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Section not found', code: 'SECTION_NOT_FOUND' });
    }
    res.json({ data: updated, message: 'Section updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sections/:id - Delete section
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const deleted = await sectionRepo.deleteSection(userId, id);
      if (!deleted) {
        return res.status(404).json({ error: 'Section not found', code: 'SECTION_NOT_FOUND' });
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;

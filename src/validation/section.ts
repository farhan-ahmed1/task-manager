// src/validation/section.ts
import { z } from 'zod';

export const CreateSectionSchema = z.object({
  name: z.string().min(1).max(100),
  project_id: z.string().uuid().optional(),
});

export const UpdateSectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  collapsed: z.boolean().optional(),
  order_index: z.number().int().min(0).optional(),
});

export type CreateSectionDto = z.infer<typeof CreateSectionSchema>;
export type UpdateSectionDto = z.infer<typeof UpdateSectionSchema>;

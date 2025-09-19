import { z } from 'zod';

// Task validation schemas for frontend forms
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'])
    .optional(),
  due_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format'),
  project_id: z
    .string()
    .uuid('Invalid project ID format')
    .optional()
    .or(z.literal('')),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

// Task filter schema
export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  project_id: z.string().uuid().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'due_date', 'title', 'priority']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export type TaskFilters = z.infer<typeof taskFilterSchema>;
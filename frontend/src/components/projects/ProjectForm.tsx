import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

// Form validation schema
const projectFormSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .transform(val => val === '' ? undefined : val)
    .optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>;
  project?: Project; // If provided, form is in edit mode
  isSubmitting?: boolean;
  error?: string | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
  isSubmitting = false,
  error,
}) => {
  const isEditMode = !!project;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
    },
  });

  const onFormSubmit = async (data: ProjectFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
      
    } catch {
      // Error is handled by parent component
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Reset form when project changes (e.g., switching from create to edit)
  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: project?.name || '',
        description: project?.description || '',
      });
    }
  }, [isOpen, project, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-[var(--border)] text-[var(--text-primary)] rounded-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-[var(--text-primary)]">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)] leading-relaxed">
            {isEditMode 
              ? 'Update your project details below to keep everything organized.'
              : 'Create a new project to organize your tasks and boost productivity.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-error-light/80 backdrop-blur-sm border-error rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-sm font-medium text-error">Error</p>
                <p className="text-sm text-error">{error}</p>
              </div>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-[var(--text-secondary)] font-medium text-sm">
              Project Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter a descriptive project name..."
              {...register('name')}
              disabled={isSubmitting}
              className={`bg-white/90 border-[var(--border)] text-[var(--text-primary)] placeholder-slate-400 rounded-lg transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.name ? 'border-error focus:border-error focus:ring-error/20' : ''
              }`}
            />
            {errors.name && (
              <p className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-[var(--text-secondary)] font-medium text-sm">
              Description <span className="text-[var(--text-tertiary)] font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Add project details, goals, or notes..."
              rows={4}
              {...register('description')}
              disabled={isSubmitting}
              className={`bg-white/90 border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none ${
                errors.description ? 'border-error focus:border-error focus:ring-error/20' : ''
              }`}
            />
            {errors.description && (
              <p className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border)] rounded-lg px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isDirty && isEditMode)}
              className="bg-primary text-white hover:bg-primary-dark rounded-lg px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditMode ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
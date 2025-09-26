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
    } catch (err) {
      // Error is handled by parent component
      console.error('Form submission error:', err);
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
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-slate-200/60 text-slate-900 rounded-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 leading-relaxed">
            {isEditMode 
              ? 'Update your project details below to keep everything organized.'
              : 'Create a new project to organize your tasks and boost productivity.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-slate-700 font-medium text-sm">
              Project Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter a descriptive project name..."
              {...register('name')}
              disabled={isSubmitting}
              className={`bg-white/90 border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                errors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-slate-700 font-medium text-sm">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this project is about..."
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
              className={`bg-white/90 border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none ${
                errors.description ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-lg px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isDirty && isEditMode)}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
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
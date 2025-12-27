import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createTaskSchema, updateTaskSchema, type CreateTaskFormData, type UpdateTaskFormData } from '@/validation/task';
import type { Task, Project } from '@/types/api';
import { projectService } from '@/services/projects';
import { handleError } from '@/utils/errorHandling';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task; // If provided, form is in edit mode
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  loading?: boolean;
  defaultProjectId?: string; // Pre-select a project when creating tasks
  showProjectSelector?: boolean; // Whether to show project selection field
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  task,
  onSubmit,
  loading = false,
  defaultProjectId,
  showProjectSelector = true
}) => {
  const isEditMode = !!task;
  const schema = isEditMode ? updateTaskSchema : createTaskSchema;
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateTaskFormData | UpdateTaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      project_id: task.project_id || ''
    } : {
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      due_date: '',
      project_id: defaultProjectId || ''
    }
  });

  const status = watch('status');
  const priority = watch('priority');
  const project_id = watch('project_id');

  // Load projects when form opens (only if showing project selector)
  useEffect(() => {
    if (open && showProjectSelector) {
      const loadProjects = async () => {
        setProjectsLoading(true);
        try {
          const result = await projectService.getProjects();
          if (result.success) {
            setProjects(result.data);
          }
        } catch (error) {
          handleError(error, {
            toastMessage: 'Failed to load projects',
            logToConsole: true
          });
        } finally {
          setProjectsLoading(false);
        }
      };

      loadProjects();
    }
  }, [open, showProjectSelector]);

  const handleFormSubmit = async (data: CreateTaskFormData | UpdateTaskFormData) => {
    try {
      // Ensure we have required fields for creation
      const submitData: CreateTaskFormData = {
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        due_date: data.due_date || undefined,
        project_id: data.project_id || undefined
      };
      
      await onSubmit(submitData);
      reset();
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            {isEditMode 
              ? 'Update the task details below.' 
              : 'Fill in the details to create a new task.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[var(--text-secondary)] font-medium">
              Title <span className="text-[var(--error)]">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...register('title')}
              className={`bg-white border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-sm text-[var(--error)]">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[var(--text-secondary)] font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              rows={3}
              {...register('description')}
              className={`bg-white border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-[var(--error)]">{errors.description.message}</p>
            )}
          </div>

          {/* Project Selection */}
          {showProjectSelector && (
            <div className="space-y-2">
              <Label htmlFor="project_id" className="text-[var(--text-secondary)] font-medium">
                <FolderOpen className="h-4 w-4 inline mr-1" />
                Project
              </Label>
              <Select
                value={project_id || ''}
                onValueChange={(value: string) => setValue('project_id', value === 'none' ? '' : value)}
                disabled={projectsLoading}
              >
                <SelectTrigger className="bg-white border-[var(--border)] text-[var(--text-primary)]">
                  <SelectValue 
                    placeholder={projectsLoading ? "Loading projects..." : "Select a project (optional)"} 
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-[var(--border)]">
                  <SelectItem value="none" className="text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">No project</span>
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-[var(--text-primary)]">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && (
                <p className="text-sm text-[var(--error)]">{errors.project_id.message}</p>
              )}
            </div>
          )}

          {/* Status and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[var(--text-secondary)] font-medium">Status</Label>
              <Select
                value={status || 'PENDING'}
                onValueChange={(value: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => setValue('status', value)}
              >
                <SelectTrigger className="bg-white border-[var(--border)] text-[var(--text-primary)]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[var(--border)]">
                  <SelectItem value="PENDING" className="text-[var(--text-primary)]">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-[var(--text-primary)]">In Progress</SelectItem>
                  <SelectItem value="COMPLETED" className="text-[var(--text-primary)]">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-[var(--text-secondary)] font-medium">Priority</Label>
              <Select
                value={priority || 'MEDIUM'}
                onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setValue('priority', value)}
              >
                <SelectTrigger className="bg-white border-[var(--border)] text-[var(--text-primary)]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[var(--border)]">
                  <SelectItem value="LOW" className="text-[var(--text-primary)]">Low</SelectItem>
                  <SelectItem value="MEDIUM" className="text-[var(--text-primary)]">Medium</SelectItem>
                  <SelectItem value="HIGH" className="text-[var(--text-primary)]">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-[var(--text-secondary)] font-medium">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              className={`bg-white border-[var(--border)] text-[var(--text-primary)] ${errors.due_date ? 'border-red-500' : ''}`}
            />
            {errors.due_date && (
              <p className="text-sm text-[var(--error)]">{errors.due_date.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
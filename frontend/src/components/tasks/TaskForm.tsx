import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import type { Task } from '@/types/api';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task; // If provided, form is in edit mode
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  loading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  task,
  onSubmit,
  loading = false
}) => {
  const isEditMode = !!task;
  const schema = isEditMode ? updateTaskSchema : createTaskSchema;
  
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
      project_id: ''
    }
  });

  const status = watch('status');
  const priority = watch('priority');

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
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
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
          <DialogTitle className="text-gray-900">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditMode 
              ? 'Update the task details below.' 
              : 'Fill in the details to create a new task.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700 font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...register('title')}
              className={`bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              rows={3}
              {...register('description')}
              className={`bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-700 font-medium">Status</Label>
              <Select
                value={status || 'PENDING'}
                onValueChange={(value: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => setValue('status', value)}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="PENDING" className="text-gray-900">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-gray-900">In Progress</SelectItem>
                  <SelectItem value="COMPLETED" className="text-gray-900">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-gray-700 font-medium">Priority</Label>
              <Select
                value={priority || 'MEDIUM'}
                onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setValue('priority', value)}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="LOW" className="text-gray-900">Low</SelectItem>
                  <SelectItem value="MEDIUM" className="text-gray-900">Medium</SelectItem>
                  <SelectItem value="HIGH" className="text-gray-900">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-gray-700 font-medium">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              className={`bg-white border-gray-300 text-gray-900 ${errors.due_date ? 'border-red-500' : ''}`}
            />
            {errors.due_date && (
              <p className="text-sm text-red-500">{errors.due_date.message}</p>
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
            <Button type="submit" disabled={loading}>
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
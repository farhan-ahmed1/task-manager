import React from 'react';
import { Calendar, Clock, AlertCircle, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/api';
import {
  formatDate,
  getRelativeTime,
  getTaskStatusColor,
  getTaskPriorityColor,
  isTaskOverdue
} from '@/lib/taskUtils';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete
}) => {
  if (!task) return null;

  const isOverdue = isTaskOverdue(task.due_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge 
              variant="secondary" 
              className={`${getTaskStatusColor(task.status)}`}
            >
              {task.status.replace('_', ' ')}
            </Badge>
            
            <Badge 
              variant="outline" 
              className={`${getTaskPriorityColor(task.priority)}`}
            >
              {task.priority} Priority
            </Badge>

            {isOverdue && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Due Date */}
            {task.due_date && (
              <div className="flex items-start gap-3">
                <Calendar className={`h-5 w-5 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Due Date</p>
                  <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {formatDate(task.due_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-gray-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-sm text-gray-600">
                  {formatDate(task.created_at)}
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-gray-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-gray-700">Last Updated</p>
                <p className="text-sm text-gray-600">
                  {getRelativeTime(task.updated_at)}
                </p>
              </div>
            </div>

            {/* Project ID (if applicable) */}
            {task.project_id && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-0.5 text-gray-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Project</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {task.project_id}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              onClick={() => {
                onEdit(task);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Edit Task
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onDelete(task);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Delete Task
            </Button>
          </div>

          {/* Task ID for debugging */}
          <div className="text-xs text-gray-400 font-mono pt-2 border-t">
            ID: {task.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
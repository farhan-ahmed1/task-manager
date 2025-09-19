import React from 'react';
import { MoreVertical, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task } from '@/types/api';
import { 
  formatDate, 
  getRelativeTime, 
  getTaskStatusColor, 
  getTaskPriorityColor,
  isTaskOverdue 
} from '@/lib/taskUtils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: Task['status']) => void;
  isDeleting?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isDeleting = false
}) => {
  const isOverdue = isTaskOverdue(task.due_date);

  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange(task, newStatus);
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => onView(task)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(task); }}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(task); }}>
                Edit Task
              </DropdownMenuItem>
              {task.status !== 'COMPLETED' && (
                <DropdownMenuItem 
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('COMPLETED'); }}
                >
                  Mark Complete
                </DropdownMenuItem>
              )}
              {task.status !== 'IN_PROGRESS' && (
                <DropdownMenuItem 
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('IN_PROGRESS'); }}
                >
                  Mark In Progress
                </DropdownMenuItem>
              )}
              {task.status !== 'PENDING' && (
                <DropdownMenuItem 
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('PENDING'); }}
                >
                  Mark Pending
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e: React.MouseEvent) => { 
                  e.stopPropagation(); 
                  if (!isDeleting) onDelete(task); 
                }}
                className="text-red-600 focus:text-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getTaskStatusColor(task.status)}`}
          >
            {task.status.replace('_', ' ')}
          </Badge>
          
          <Badge 
            variant="outline" 
            className={`text-xs ${getTaskPriorityColor(task.priority)}`}
          >
            {task.priority}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span className="text-xs">
                  {formatDate(task.due_date)}
                </span>
              </div>
            )}
          </div>
          
          <span className="text-xs">
            Updated {getRelativeTime(task.updated_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
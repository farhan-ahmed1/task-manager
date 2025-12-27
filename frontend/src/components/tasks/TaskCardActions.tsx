import React from 'react';
import { MoreVertical, CheckCircle2, PlayCircle, PauseCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task } from '@/types/api';

interface TaskCardActionsProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: Task['status']) => void;
  isDeleting?: boolean;
}

export const TaskCardActions: React.FC<TaskCardActionsProps> = ({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isDeleting = false
}) => {
  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange(task, newStatus);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Action Buttons */}
      <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 flex gap-2">
        {task.status !== 'COMPLETED' && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('COMPLETED');
            }}
            size="sm"
            variant="outline"
            className="h-9 px-3 bg-success-light hover:bg-success/10 border-success text-success rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2.5} />
            Complete
          </Button>
        )}
        
        {task.status === 'PENDING' && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('IN_PROGRESS');
            }}
            size="sm"
            variant="outline"
            className="h-9 px-3 bg-info-light hover:bg-info/10 border-info text-info rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
          >
            <PlayCircle className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2.5} />
            Start
          </Button>
        )}

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          size="sm"
          variant="outline"
          className="h-9 px-3 bg-muted hover:bg-muted/80 border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
        >
          <Edit className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2} />
          Edit
        </Button>
      </div>
      
      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 opacity-60 group-hover:opacity-100 transition-all duration-200 hover:bg-muted rounded-lg flex-shrink-0 icon-button"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground icon-enhanced dropdown-icon" strokeWidth={2} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-[var(--border)]">
          <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(task); }} className="text-foreground hover:bg-muted cursor-pointer">
            <Eye className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(task); }} className="text-foreground hover:bg-muted cursor-pointer">
            <Edit className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {task.status !== 'COMPLETED' && (
            <DropdownMenuItem 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('COMPLETED'); }}
              className="text-success hover:bg-success-light cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 icon-enhanced icon-status-success" strokeWidth={2.5} />
              Mark Complete
            </DropdownMenuItem>
          )}
          {task.status !== 'IN_PROGRESS' && (
            <DropdownMenuItem 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('IN_PROGRESS'); }}
              className="text-info hover:bg-info-light cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 mr-2 icon-enhanced icon-status-info" strokeWidth={2.5} />
              Start Progress
            </DropdownMenuItem>
          )}
          {task.status !== 'PENDING' && (
            <DropdownMenuItem 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('PENDING'); }}
              className="text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <PauseCircle className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
              Mark Pending
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e: React.MouseEvent) => { 
              e.stopPropagation(); 
              if (!isDeleting) onDelete(task); 
            }}
            className="text-error hover:bg-error-light focus:text-error cursor-pointer"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2 icon-enhanced icon-status-error" strokeWidth={2.5} />
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

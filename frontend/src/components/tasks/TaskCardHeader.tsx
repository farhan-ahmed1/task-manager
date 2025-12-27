import React from 'react';
import { CheckCircle2, PlayCircle, PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/api';
import { getTaskStatusColor, getTaskPriorityColor } from '@/lib/taskUtils';

interface TaskCardHeaderProps {
  task: Task;
}

export const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ task }) => {
  // Get status icon with proper sizing and animations
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-success icon-status icon-status-success transition-all duration-200" strokeWidth={2.5} />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-info icon-status icon-status-info transition-all duration-200" strokeWidth={2.5} />;
      default:
        return <PauseCircle className="w-5 h-5 text-muted-foreground icon-status transition-all duration-200" strokeWidth={2} />;
    }
  };

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getStatusIcon(task.status)}
      </div>
      
      {/* Title and Badges */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-primary transition-colors text-base sm:text-lg leading-tight">
            {task.title}
          </h3>
          
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={`text-xs font-medium border ${getTaskStatusColor(task.status)}`}
            >
              {getStatusIcon(task.status)}
              <span className="ml-1">{task.status.replace('_', ' ')}</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className={`text-xs font-medium border ${getTaskPriorityColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

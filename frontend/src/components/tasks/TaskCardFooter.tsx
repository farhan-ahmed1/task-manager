import React from 'react';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import type { Task } from '@/types/api';
import { formatDate, getRelativeTime, isTaskOverdue } from '@/lib/taskUtils';

interface TaskCardFooterProps {
  task: Task;
}

export const TaskCardFooter: React.FC<TaskCardFooterProps> = ({ task }) => {
  const isOverdue = isTaskOverdue(task.due_date);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {task.due_date && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
          isOverdue 
            ? 'bg-error-light text-error border border-error icon-badge' 
            : 'bg-muted text-muted-foreground border border-border icon-badge'
        }`}>
          {isOverdue && <AlertCircle className="w-4 h-4 icon-status-error icon-hover-pulse" strokeWidth={2.5} />}
          <Calendar className="w-4 h-4 icon-enhanced" strokeWidth={2} />
          <span>Due {formatDate(task.due_date)}</span>
        </div>
      )}
      
      <div className="text-[var(--text-secondary)] flex items-center gap-1.5">
        <Clock className="w-4 h-4 icon-enhanced" strokeWidth={2} />
        <span>Updated {getRelativeTime(task.updated_at)}</span>
      </div>
    </div>
  );
};

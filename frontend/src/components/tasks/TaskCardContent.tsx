import React from 'react';
import type { Task } from '@/types/api';

interface TaskCardContentProps {
  task: Task;
}

export const TaskCardContent: React.FC<TaskCardContentProps> = ({ task }) => {
  if (!task.description) {
    return null;
  }

  return (
    <div className="pl-7 sm:pl-9">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
        {task.description}
      </p>
    </div>
  );
};

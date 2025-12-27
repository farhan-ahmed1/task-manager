import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Task } from '@/types/api';
import { TaskCardHeader } from './TaskCardHeader';
import { TaskCardContent } from './TaskCardContent';
import { TaskCardFooter } from './TaskCardFooter';
import { TaskCardActions } from './TaskCardActions';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: Task['status']) => void;
  isDeleting?: boolean;
}

interface TaskCardComponent extends React.FC<TaskCardProps> {
  Header: typeof TaskCardHeader;
  Content: typeof TaskCardContent;
  Footer: typeof TaskCardFooter;
  Actions: typeof TaskCardActions;
}

const TaskCard: TaskCardComponent = ({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isDeleting = false
}) => {
  const getPriorityBorderAndBg = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-error bg-error-light/30';
      case 'MEDIUM':
        return 'border-l-warning bg-warning-light/30';
      case 'LOW':
        return 'border-l-success bg-success-light/30';
      default:
        return 'border-l-border bg-muted/30';
    }
  };

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${getPriorityBorderAndBg(task.priority)} backdrop-blur-sm bg-card hover:bg-card/95 border-border hover:border-[var(--border-focus)] transform hover:-translate-y-0.5`}
      onClick={() => onView(task)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <TaskCardHeader task={task} />
          <TaskCardContent task={task} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pl-7 sm:pl-9">
            <TaskCardFooter task={task} />
            <TaskCardActions 
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onStatusChange={onStatusChange}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Attach subcomponents for compound component pattern
TaskCard.Header = TaskCardHeader;
TaskCard.Content = TaskCardContent;
TaskCard.Footer = TaskCardFooter;
TaskCard.Actions = TaskCardActions;

export default TaskCard;
export { TaskCardHeader, TaskCardContent, TaskCardFooter, TaskCardActions };
import React from 'react';
import type { Task } from '@/types/api';

interface DragOverlayProps {
  task: Task;
}

const DragOverlay: React.FC<DragOverlayProps> = ({ task }) => {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return '#EA4335';
      case 'MEDIUM':
        return '#FF9800';
      case 'LOW':
        return '#34A853';
      default:
        return '#9AA0A6';
    }
  };

  const isCompleted = task.status === 'COMPLETED';

  return (
    <div 
      className="flex items-center py-3 px-4 bg-white rounded-lg shadow-xl border-2"
      style={{ 
        borderColor: 'var(--primary)',
        borderRadius: 'var(--radius-md)',
        transform: 'rotate(3deg)',
        cursor: 'grabbing',
        zIndex: 1000,
      }}
    >
      {/* Priority-colored checkmark */}
      <div className="flex-shrink-0 mr-4">
        <div
          className="relative w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: getPriorityColor(task.priority),
            backgroundColor: isCompleted ? getPriorityColor(task.priority) : 'transparent',
          }}
        >
          {isCompleted && (
            <div className="w-3 h-3 text-white font-bold">✓</div>
          )}
        </div>
      </div>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <h4 
            className={`text-sm font-medium ${isCompleted ? 'line-through opacity-60' : ''}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {task.title}
          </h4>
          
          {task.description && (
            <p 
              className={`text-xs mt-1 line-clamp-1 ${isCompleted ? 'line-through opacity-60' : ''}`}
              style={{ color: 'var(--text-secondary)' }}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DragOverlay;
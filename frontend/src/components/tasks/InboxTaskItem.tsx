import React, { useState } from 'react';
import { Edit3, Calendar, MessageCircle, MoreHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DatePickerModal from '@/components/ui/DatePickerModal';
import DragHandle from '@/components/ui/DragHandle';
import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '@/types/api';

interface InboxTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDateUpdate: (task: Task, date: string) => void;
  onToggleComplete: (task: Task) => void;
  onComment?: (task: Task) => void;
  onOptions?: (task: Task) => void;
}

const InboxTaskItem: React.FC<InboxTaskItemProps> = ({
  task,
  onEdit,
  onDateUpdate,
  onToggleComplete,
  onComment,
  onOptions
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: task.id });

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return '#EA4335'; // var(--error)
      case 'MEDIUM':
        return '#FF9800'; // var(--warning)
      case 'LOW':
        return '#34A853'; // var(--success)
      default:
        return '#9AA0A6'; // var(--text-muted)
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time to compare dates only
    const dueDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (dueDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dueDateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Tomorrow';
    } else if (dueDateOnly < todayOnly) {
      return 'Overdue';
    } else {
      // Show day of week for this week, otherwise show date
      const daysDiff = Math.ceil((dueDateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  };

  const isOverdue = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const dueDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dueDateOnly < todayOnly;
  };

  const isCompleted = task.status === 'COMPLETED';

  const style = {
    opacity: isDragging ? 0.4 : 1,
    transition: isDragging ? 'none' : 'all 0.2s ease',
  };

  return (
    <div 
      ref={setNodeRef}
      className="group flex items-center py-3 px-4 transition-all duration-200 hover:bg-gray-50/40 rounded-lg"
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
    >
      {/* Drag handle - only visible on hover */}
      <div className={`flex-shrink-0 mr-2 transition-all duration-200 ${
        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
      }`}>
        <div {...listeners}>
          <DragHandle isDragging={isDragging} />
        </div>
      </div>

      {/* Priority-colored checkmark */}
      <div className="flex-shrink-0 mr-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className="relative w-5 h-5 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center"
          style={{
            borderColor: isCompleted ? getPriorityColor(task.priority) : getPriorityColor(task.priority),
            backgroundColor: isCompleted ? getPriorityColor(task.priority) : 'transparent',
          }}
        >
          {isCompleted && (
            <Check 
              className="w-3 h-3 text-white" 
              strokeWidth={3}
            />
          )}
        </button>
      </div>

      {/* Task content */}
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onEdit(task)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit(task);
          }
        }}
      >
        <div className="flex flex-col">
          <h4 
            className={`text-sm font-medium transition-all duration-200 ${
              isCompleted ? 'line-through opacity-60' : ''
            }`}
            style={{ 
              color: 'var(--text-primary)'
            }}
          >
            {task.title}
          </h4>
          
          {/* Description - show first line only */}
          {task.description && (
            <p 
              className={`text-xs mt-1 line-clamp-1 ${
                isCompleted ? 'line-through opacity-60' : ''
              }`}
              style={{ 
                color: 'var(--text-secondary)'
              }}
              title={task.description}
            >
              {task.description}
            </p>
          )}
          
          {/* Due date - only show if it exists */}
          {task.due_date && (
            <div className="mt-1">
              <span 
                className={`text-xs px-2 py-0.5 rounded-md ${
                  isOverdue(task.due_date) && !isCompleted ? 'font-medium' : ''
                }`}
                style={{ 
                  backgroundColor: isOverdue(task.due_date) && !isCompleted 
                    ? '#FEECEB' 
                    : 'var(--primary-light)',
                  color: isOverdue(task.due_date) && !isCompleted 
                    ? '#EA4335' 
                    : 'var(--primary-dark)'
                }}
              >
                {formatDueDate(task.due_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover actions - only visible on hover */}
      <div className={`flex items-center space-x-1 transition-all duration-200 ${
        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 h-auto hover:bg-gray-100/80 rounded-md transition-colors duration-200"
          title="Edit task"
        >
          <Edit3 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDatePicker(true);
            }}
            className="p-1.5 h-auto hover:bg-gray-100/80 rounded-md transition-colors duration-200"
            title="Set date"
          >
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </Button>
          
          <DatePickerModal
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onDateSelect={(date) => {
              onDateUpdate(task, date);
              setShowDatePicker(false);
            }}
            initialDate={task.due_date}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onComment) onComment(task);
          }}
          className="p-1.5 h-auto hover:bg-gray-100/80 rounded-md transition-colors duration-200"
          title="Add comment"
        >
          <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onOptions) onOptions(task);
          }}
          className="p-1.5 h-auto hover:bg-gray-100/80 rounded-md transition-colors duration-200"
          title="More options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </Button>
      </div>
    </div>
  );
};

export default InboxTaskItem;
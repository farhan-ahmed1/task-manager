import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Calendar, Flag, MoreHorizontal, Inbox } from 'lucide-react';
import DatePickerModal from '@/components/ui/DatePickerModal';
import type { CreateTaskRequest, TaskPriority } from '@/types/api';

interface InlineAddTaskProps {
  onSubmit: (task: CreateTaskRequest) => void;
  placeholder?: string;
}

const InlineAddTask: React.FC<InlineAddTaskProps> = ({ 
  onSubmit, 
  placeholder = "Add a task..." 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);

  const handleCancel = useCallback(() => {
    if (!taskTitle.trim() && !taskDescription.trim()) {
      setIsExpanded(false);
      setTaskTitle('');
      setTaskDescription('');
      setPriority(null);
      setDueDate('');
      setShowDatePicker(false);
      setShowPriorityPicker(false);
    }
  }, [taskTitle, taskDescription]);

  // Handle click outside to close pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
        setShowPriorityPicker(false);
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (showPriorityPicker || isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriorityPicker, isExpanded, handleCancel]);

  useEffect(() => {
    if (isExpanded && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!taskTitle.trim()) return;

    setIsLoading(true);
    try {
      const taskData: CreateTaskRequest = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: priority || 'MEDIUM',
        due_date: dueDate || undefined,
        status: 'PENDING'
      };

      await onSubmit(taskData);
      
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setPriority(null);
      setDueDate('');
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (showPriorityPicker) {
        setShowPriorityPicker(false);
      } else {
        handleCancel();
      }
    }
  };

  const getPriorityColor = (p: TaskPriority | string | null) => {
    switch (p) {
      case 'HIGH': return '#EA4335';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#34A853';  
      default: return '#9AA0A6';
    }
  };

  const getPriorityOptions = () => {
    return [
      { label: 'Priority 1', value: 'HIGH' as const, color: '#EA4335', description: 'High' },
      { label: 'Priority 2', value: 'MEDIUM' as const, color: '#FF9800', description: 'Medium' },
      { label: 'Priority 3', value: 'LOW' as const, color: '#34A853', description: 'Low' },
      { label: 'Priority 4', value: null, color: '#9AA0A6', description: 'No priority' }
    ];
  };

  const handlePrioritySelection = (priorityValue: TaskPriority | null) => {
    setPriority(priorityValue);
    setShowPriorityPicker(false);
  };

  const handleDateSelection = (dateString: string) => {
    setDueDate(dateString);
    setShowDatePicker(false);
  };

  if (!isExpanded) {
    return (
      <div className="px-4 py-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center w-full text-left py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-50/40"
          style={{ 
            backgroundColor: 'transparent',
            color: 'var(--text-muted)'
          }}
        >
          <Plus className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="text-sm">{placeholder}</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="px-4 py-3">
      <div 
        className={`transition-all duration-200 rounded-lg ${isExpanded ? 'bg-gray-50/40 border border-gray-200/60' : ''}`}
        onKeyDown={handleKeyDown}
        style={{
          padding: isExpanded ? '16px' : '12px'
        }}
      >
        {/* Main Task Input */}
        <div className="space-y-2 mb-4">
          <textarea
            ref={titleRef}
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task name"
            rows={1}
            className="w-full px-0 text-lg font-medium border-0 focus:outline-none resize-none bg-transparent block"
            style={{
              color: 'var(--text-primary)',
              lineHeight: '1.2',
              margin: '0',
              padding: '0',
              display: 'block',
              minHeight: 'auto'
            }}
          />
          
          {/* Description Textarea */}
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Description"
            rows={1}
            className="w-full px-0 text-sm border-0 focus:outline-none resize-none bg-transparent block"
            style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.3',
              margin: '0',
              padding: '0',
              display: 'block'
            }}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
          {/* Date Button */}
          <div className="relative">
            <button 
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-medium transition-all duration-200 hover:bg-gray-50"
              style={{ 
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)'
              }}
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date'}</span>
            </button>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DatePickerModal
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={handleDateSelection}
                initialDate={dueDate}
                title="Set Due Date"
              />
            )}
          </div>

          {/* Priority Button */}
          <div className="relative" ref={priorityPickerRef}>
            <button 
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-medium transition-all duration-200 hover:bg-gray-50"
              style={{ 
                color: priority ? getPriorityColor(priority) : 'var(--text-muted)',
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)'
              }}
              onClick={() => setShowPriorityPicker(!showPriorityPicker)}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{priority ? `P${priority === 'HIGH' ? '1' : priority === 'MEDIUM' ? '2' : '3'}` : 'Priority'}</span>
            </button>

            {/* Priority Picker Dropdown */}
            {showPriorityPicker && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-1">
                  {getPriorityOptions().map((option) => (
                    <button
                      key={option.value || 'none'}
                      type="button"
                      onClick={() => handlePrioritySelection(option.value)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-50 rounded-md transition-colors text-left"
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="font-medium" style={{ color: '#202124' }}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Options */}
          <button 
            type="button"
            className="flex items-center justify-center w-9 h-9 hover:bg-gray-100 rounded-md transition-all duration-200"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          {/* Left: Project indicator */}
          <button 
            type="button"
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-50"
            style={{ 
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <Inbox className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Inbox</span>
          </button>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium border rounded-md transition-colors hover:bg-gray-50"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface)'
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!taskTitle.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                backgroundColor: taskTitle.trim() ? '#4285F4' : 'var(--border-light)',
                color: taskTitle.trim() ? '#FFFFFF' : 'var(--text-muted)',
                border: taskTitle.trim() ? '1px solid #4285F4' : '1px solid var(--border)'
              }}
            >
              {isLoading ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineAddTask;
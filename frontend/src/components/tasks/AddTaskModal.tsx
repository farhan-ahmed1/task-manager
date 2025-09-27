import React, { useState } from 'react';
import { Calendar, Flag, MoreHorizontal, Bell, Inbox } from 'lucide-react';

import type { CreateTaskRequest } from '@/types/api';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskRequest) => void;
  selectedProject?: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedProject 
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(selectedProject || '');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!taskTitle.trim()) return;

    setIsLoading(true);
    try {
      const taskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        project_id: selectedProjectId || undefined,
        priority: priority || 'MEDIUM',
        due_date: dueDate || undefined,
        status: 'PENDING' as const,
      };

      await onSubmit(taskData);
      
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setSelectedProjectId(selectedProject || '');
      setPriority(null);
      setDueDate('');
      onClose();
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
      onClose();
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return '#EA4335';
      case 'MEDIUM': return '#FF9800';  
      case 'LOW': return '#34A853';
      default: return '#9AA0A6';
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Invisible backdrop for click outside */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Content */}
        <div className="p-5 space-y-2">
          {/* Main Task Input */}
          <div>
            <textarea
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Take kids to the park after work tom"
              rows={2}
              className="w-full px-0 text-2xl font-semibold border-0 focus:outline-none resize-none bg-transparent block"
              style={{
                color: '#202124',
                lineHeight: '1.1',
                margin: '0',
                padding: '0',
                display: 'block',
                minHeight: 'auto'
              }}
              autoFocus
            />
            
            {/* Description Textarea */}
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full px-0 text-sm border-0 focus:outline-none resize-none bg-transparent block"
              style={{
                color: '#5F6368',
                lineHeight: '1.4',
                margin: '0',
                padding: '0',
                marginTop: '-8px',
                display: 'block'
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 py-1">
            {/* Date Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'date';
                input.onchange = (e) => setDueDate((e.target as HTMLInputElement).value);
                input.click();
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Date'}</span>
            </button>

            {/* Priority Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium transition-colors"
              style={{ color: priority ? getPriorityColor(priority) : '#374151', backgroundColor: '#FAFAFA' }}
              onClick={() => {
                const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | null)[] = [null, 'LOW', 'MEDIUM', 'HIGH'];
                const currentIndex = priorities.indexOf(priority);
                const nextIndex = (currentIndex + 1) % priorities.length;
                setPriority(priorities[nextIndex]);
              }}
            >
              <Flag className="w-4 h-4" />
              <span>{priority ? priority.charAt(0) + priority.slice(1).toLowerCase() : 'Priority'}</span>
            </button>

            {/* Reminders Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
            >
              <Bell className="w-4 h-4" />
              <span>Reminders</span>
            </button>

            {/* More Button */}
            <button 
              className="flex items-center justify-center w-10 h-10 bg-gray-25 hover:bg-gray-50 border border-gray-100 rounded-lg transition-colors"
              style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 pt-4 border-t border-gray-100">
          {/* Left: Inbox Selector */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Inbox className="w-4 h-4" style={{ color: '#EA4335' }} />
              <span>Inbox</span>
            </button>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!taskTitle.trim() || isLoading}
              className="px-6 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                backgroundColor: taskTitle.trim() ? '#4285F4' : '#F3F4F6',
                color: taskTitle.trim() ? '#FFFFFF' : '#9CA3AF'
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

export default AddTaskModal;
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Flag, MoreHorizontal, Bell, Inbox, ChevronLeft, ChevronRight, Clock, Repeat, Sun, Sunrise, CalendarDays, Coffee } from 'lucide-react';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
        setShowPriorityPicker(false);
      }
    };

    if (showDatePicker || showPriorityPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showPriorityPicker]);

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
      setShowDatePicker(false);
      setShowPriorityPicker(false);
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
      if (showDatePicker) {
        setShowDatePicker(false);
      } else if (showPriorityPicker) {
        setShowPriorityPicker(false);
      } else {
        onClose();
      }
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

  const getPriorityOptions = () => {
    return [
      { label: 'Priority 1', value: 'HIGH' as const, color: '#EA4335', description: 'High' },
      { label: 'Priority 2', value: 'MEDIUM' as const, color: '#FF9800', description: 'Medium' },
      { label: 'Priority 3', value: 'LOW' as const, color: '#34A853', description: 'Low' },
      { label: 'Priority 4', value: null, color: '#9AA0A6', description: 'No priority' }
    ];
  };

  const handlePrioritySelection = (priorityValue: 'HIGH' | 'MEDIUM' | 'LOW' | null) => {
    setPriority(priorityValue);
    setShowPriorityPicker(false);
  };

  // Date helper functions
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextWeekend = new Date(today);
    const daysUntilSaturday = (6 - today.getDay()) % 7 || 7;
    nextWeekend.setDate(today.getDate() + daysUntilSaturday);

    return [
      { label: 'Today', date: formatDate(today), shortLabel: 'Fri', icon: Sun, color: '#FF9500' },
      { label: 'Tomorrow', date: formatDate(tomorrow), shortLabel: 'Sat', icon: Sunrise, color: '#34C759' },
      { label: 'Next week', date: formatDate(nextWeek), shortLabel: 'Mon Oct 6', icon: CalendarDays, color: '#007AFF' },
      { label: 'Next weekend', date: formatDate(nextWeekend), shortLabel: 'Sat Oct 4', icon: Coffee, color: '#AF52DE' }
    ];
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateSelected = (day: number) => {
    if (!dueDate) return false;
    const selectedDate = new Date(dueDate);
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === selectedMonth && 
           selectedDate.getFullYear() === selectedYear;
  };

  const handleDateSelection = (dateString: string) => {
    setDueDate(dateString);
    setShowDatePicker(false);
  };

  const handleCalendarDateClick = (day: number) => {
    const selectedDate = new Date(selectedYear, selectedMonth, day);
    handleDateSelection(formatDate(selectedDate));
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];



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
            <div className="relative" ref={datePickerRef}>
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="w-4 h-4" />
                <span>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Date'}</span>
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    {/* Quick Date Options */}
                    <div className="space-y-1 mb-4">
                      {getQuickDateOptions().map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.label}
                            onClick={() => handleDateSelection(option.date)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <IconComponent 
                              className="w-4 h-4 flex-shrink-0" 
                              style={{ color: option.color }}
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-medium" style={{ color: '#202124' }}>
                                {option.label}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {option.shortLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          if (selectedMonth === 0) {
                            setSelectedMonth(11);
                            setSelectedYear(selectedYear - 1);
                          } else {
                            setSelectedMonth(selectedMonth - 1);
                          }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <h3 className="font-semibold text-sm" style={{ color: '#202124' }}>
                        {monthNames[selectedMonth]} {selectedYear}
                      </h3>
                      
                      <button
                        onClick={() => {
                          if (selectedMonth === 11) {
                            setSelectedMonth(0);
                            setSelectedYear(selectedYear + 1);
                          } else {
                            setSelectedMonth(selectedMonth + 1);
                          }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div
                          key={day}
                          className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before the first day of the month */}
                      {Array.from({ length: getFirstDayOfMonth(selectedMonth, selectedYear) }).map((_, index) => (
                        <div key={`empty-${index}`} className="h-8"></div>
                      ))}
                      
                      {/* Days of the month */}
                      {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }).map((_, index) => {
                        const day = index + 1;
                        const isSelected = isDateSelected(day);
                        const isToday = new Date().getDate() === day && 
                                       new Date().getMonth() === selectedMonth && 
                                       new Date().getFullYear() === selectedYear;
                        
                        return (
                          <button
                            key={day}
                            onClick={() => handleCalendarDateClick(day)}
                            className={`h-8 flex items-center justify-center text-sm rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : isToday
                                ? 'bg-gray-100 font-semibold'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Time and Repeat buttons */}
                    <div className="space-y-1 mt-4 pt-4 border-t border-gray-200">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                        <Clock className="w-4 h-4" />
                        <span>Time</span>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                        <Repeat className="w-4 h-4" />
                        <span>Repeat</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Button */}
            <div className="relative" ref={priorityPickerRef}>
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: priority ? getPriorityColor(priority) : '#374151', backgroundColor: '#FAFAFA' }}
                onClick={() => setShowPriorityPicker(!showPriorityPicker)}
              >
                <Flag className="w-4 h-4" />
                <span>{priority ? priority.charAt(0) + priority.slice(1).toLowerCase() : 'Priority'}</span>
              </button>

              {/* Priority Picker Dropdown */}
              {showPriorityPicker && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    {getPriorityOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePrioritySelection(option.value)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
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

            {/* Reminders Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
            >
              <Bell className="w-4 h-4" />
              <span>Reminders</span>
            </button>

            {/* More Button */}
            <button 
              className="flex items-center justify-center w-10 h-10 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg transition-all duration-200"
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
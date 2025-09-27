import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sun, Sunrise, CalendarDays, Coffee, Clock, Repeat } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  initialDate?: string;
  title?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  initialDate
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      setSelectedDate(initialDate);
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
    }
  }, [initialDate]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return selected.getDate() === day && 
           selected.getMonth() === selectedMonth && 
           selected.getFullYear() === selectedYear;
  };

  const handleDateSelection = (dateString: string) => {
    setSelectedDate(dateString);
    onDateSelect(dateString);
    onClose();
  };

  const handleCalendarDateClick = (day: number) => {
    const selectedDateObj = new Date(selectedYear, selectedMonth, day);
    handleDateSelection(formatDate(selectedDateObj));
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
      onClick={(e) => e.stopPropagation()}
    >
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
  );
};

export default DatePickerModal;
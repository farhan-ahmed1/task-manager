import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sun, Sunrise, CalendarDays, Coffee, Clock, Repeat } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  initialDate?: string;
  title?: string;
  position?: 'top' | 'bottom';
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  initialDate,
  position = 'bottom'
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
      // Small delay to prevent the opening click from immediately closing it
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 50); // 50ms delay - enough to avoid race conditions

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
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
      { label: 'Today', date: formatDate(today), shortLabel: 'Fri', icon: Sun, color: 'var(--warning)' },
      { label: 'Tomorrow', date: formatDate(tomorrow), shortLabel: 'Sat', icon: Sunrise, color: 'var(--success)' },
      { label: 'Next week', date: formatDate(nextWeek), shortLabel: 'Mon Oct 6', icon: CalendarDays, color: 'var(--info)' },
      { label: 'Next weekend', date: formatDate(nextWeekend), shortLabel: 'Sat Oct 4', icon: Coffee, color: 'var(--primary)' }
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

  const handleCalendarDateClick = (day: number) => {
    const selectedDateObj = new Date(selectedYear, selectedMonth, day);
    const dateString = formatDate(selectedDateObj);
    setSelectedDate(dateString);
    onDateSelect(dateString);
    // Close after a short delay to show the selection
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="absolute left-0 w-80 bg-white rounded-xl border border-[var(--border)]"
      style={{ 
        zIndex: 99999,
        boxShadow: 'var(--shadow-card)',
        position: 'absolute',
        isolation: 'isolate',
        backgroundColor: 'var(--surface)', // Solid white background - no transparency
        ...(position === 'top' 
          ? { bottom: '100%', marginBottom: '0.5rem' }
          : { top: '100%', marginTop: '0.5rem' }
        )
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-4 relative bg-white" style={{ zIndex: 100000 }}>
        {/* Quick Date Options */}
        <div className="space-y-1 mb-4">
          {getQuickDateOptions().map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.label}
                onClick={() => {
                  setSelectedDate(option.date);
                  onDateSelect(option.date);
                  setTimeout(() => {
                    onClose();
                  }, 150);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 text-left cursor-pointer hover:bg-slate-50 active:bg-slate-100"
              >
                <IconComponent 
                  className="w-4 h-4 flex-shrink-0" 
                  style={{ color: option.color }}
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {option.label}
                  </span>
                  <span className="text-[var(--text-secondary)] text-xs">
                    {option.shortLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)] my-4"></div>

        {/* Calendar Header */}
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
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {monthNames[selectedMonth]} {selectedYear}
          </div>
          
          <button
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div
              key={`day-${index}`}
              className="h-8 flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]"
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
                className={`h-8 flex items-center justify-center text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700'
                    : isToday
                    ? 'bg-blue-50 font-semibold text-blue-700 ring-2 ring-blue-200 hover:bg-blue-100'
                    : 'hover:bg-slate-50 text-foreground'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Time and Repeat buttons */}
        <div className="space-y-1 mt-4 pt-4 border-t border-[var(--border)]">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-all duration-200 text-left cursor-pointer">
            <Clock className="w-4 h-4" />
            <span>Time</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-all duration-200 text-left cursor-pointer">
            <Repeat className="w-4 h-4" />
            <span>Repeat</span>
          </button>
        </div>
        </div>
    </div>
  );
};

export default DatePickerModal;
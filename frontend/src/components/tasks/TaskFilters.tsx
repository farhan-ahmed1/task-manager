import React from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskStatus, TaskPriority } from '@/types/api';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  status?: TaskStatus;
  onStatusChange: (status?: TaskStatus) => void;
  priority?: TaskPriority;
  onPriorityChange: (priority?: TaskPriority) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sortBy,
  sortOrder,
  onSortChange,
  onClearFilters
}) => {
  const hasActiveFilters = search || status || priority;

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Created Date';

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Status Filter */}
      <div className="min-w-[140px]">
        <Select
          value={status || 'all'}
          onValueChange={(value: string) => onStatusChange(value === 'all' ? undefined : value as TaskStatus)}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300 z-50">
            <SelectItem value="all" className="text-gray-900">All Status</SelectItem>
            <SelectItem value="PENDING" className="text-gray-900">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS" className="text-gray-900">In Progress</SelectItem>
            <SelectItem value="COMPLETED" className="text-gray-900">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="min-w-[140px]">
        <Select
          value={priority || 'all'}
          onValueChange={(value: string) => onPriorityChange(value === 'all' ? undefined : value as TaskPriority)}
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300 z-50">
            <SelectItem value="all" className="text-gray-900">All Priority</SelectItem>
            <SelectItem value="HIGH" className="text-gray-900">High</SelectItem>
            <SelectItem value="MEDIUM" className="text-gray-900">Medium</SelectItem>
            <SelectItem value="LOW" className="text-gray-900">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="default" className="min-w-[120px] bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
            <SortAsc className="mr-2 h-4 w-4" />
            {currentSortLabel}
            {sortOrder === 'desc' && ' ↓'}
            {sortOrder === 'asc' && ' ↑'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white border-gray-300 z-50">
          {sortOptions.map((option) => (
            <React.Fragment key={option.value}>
              <DropdownMenuItem
                onClick={() => onSortChange(option.value, 'desc')}
                className={`text-gray-900 hover:bg-gray-100 ${sortBy === option.value && sortOrder === 'desc' ? 'bg-blue-50 text-blue-900' : ''}`}
              >
                {option.label} (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSortChange(option.value, 'asc')}
                className={`text-gray-900 hover:bg-gray-100 ${sortBy === option.value && sortOrder === 'asc' ? 'bg-blue-50 text-blue-900' : ''}`}
              >
                {option.label} (Oldest)
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="default" 
          onClick={onClearFilters}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Filter className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default TaskFilters;
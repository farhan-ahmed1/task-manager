import React from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  onClearFilters
}) => {
  const hasActiveFilters = search;

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'name', label: 'Project Name' },
    { value: 'completion_rate', label: 'Completion Rate' },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Created Date';

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 bg-slate-50/50 border-slate-200 text-slate-900 placeholder-slate-500 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="default" 
                className="h-12 min-w-[140px] bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-white hover:border-slate-300 rounded-xl transition-all"
              >
                <SortAsc className="mr-2 h-4 w-4" />
                {currentSortLabel}
                {sortOrder === 'desc' ? ' ↓' : ' ↑'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white/95 backdrop-blur-sm border-slate-200/60 rounded-xl z-50">
              {sortOptions.map((option) => (
                <React.Fragment key={option.value}>
                  <DropdownMenuItem
                    onClick={() => onSortChange(option.value, 'desc')}
                    className={`text-slate-900 hover:bg-slate-50 rounded-lg ${sortBy === option.value && sortOrder === 'desc' ? 'bg-blue-50 text-blue-900' : ''}`}
                  >
                    {option.label} (Newest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortChange(option.value, 'asc')}
                    className={`text-slate-900 hover:bg-slate-50 rounded-lg ${sortBy === option.value && sortOrder === 'asc' ? 'bg-blue-50 text-blue-900' : ''}`}
                  >
                    {option.label} (Oldest First)
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
              className="h-12 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-600 font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Search: "{search}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;
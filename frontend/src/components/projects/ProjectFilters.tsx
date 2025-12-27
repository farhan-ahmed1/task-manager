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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[var(--border)] shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 bg-[var(--bg-secondary)]/50 border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl focus:bg-white focus:border-[var(--border-focus)] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="default" 
                className="h-12 min-w-[140px] bg-[var(--bg-secondary)]/50 border-[var(--border)] text-[var(--text-primary)] hover:bg-white hover:border-[var(--border)] rounded-xl transition-all"
              >
                <SortAsc className="mr-2 h-4 w-4" />
                {currentSortLabel}
                {sortOrder === 'desc' ? ' ↓' : ' ↑'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white/95 backdrop-blur-sm border-[var(--border)] rounded-xl z-50">
              {sortOptions.map((option) => (
                <React.Fragment key={option.value}>
                  <DropdownMenuItem
                    onClick={() => onSortChange(option.value, 'desc')}
                    className={`text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg ${sortBy === option.value && sortOrder === 'desc' ? 'bg-[var(--primary-light)] text-[var(--primary-dark)]' : ''}`}
                  >
                    {option.label} (Newest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortChange(option.value, 'asc')}
                    className={`text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg ${sortBy === option.value && sortOrder === 'asc' ? 'bg-[var(--primary-light)] text-[var(--primary-dark)]' : ''}`}
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
              className="h-12 px-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-all"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-[var(--text-secondary)] font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--primary-light)] text-[var(--primary-dark)] text-xs font-medium rounded-full">\n                Search: "{search}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;
import React from 'react';
import { Settings, Eye, List, Grid3X3, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

export interface ViewOptions {
  showCompletedTasks: boolean;
  showDescriptions: boolean;
  showDueDates: boolean;
  groupBy: 'none' | 'priority' | 'due_date' | 'status';
  sortBy: 'created_at' | 'due_date' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
  layout: 'list' | 'board';
}

interface ViewOptionsMenuProps {
  options: ViewOptions;
  onOptionsChange: (options: ViewOptions) => void;
}

const ViewOptionsMenu: React.FC<ViewOptionsMenuProps> = ({
  options,
  onOptionsChange
}) => {
  const handleToggle = <K extends keyof ViewOptions>(key: K, value: ViewOptions[K]) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  const getSortLabel = (sortBy: string, sortOrder: string) => {
    const sortLabels = {
      created_at: 'Date created',
      due_date: 'Due date',
      priority: 'Priority',
      title: 'Name'
    };
    return `${sortLabels[sortBy as keyof typeof sortLabels]} (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`;
  };

  const getGroupLabel = (groupBy: string) => {
    const groupLabels = {
      none: 'None',
      priority: 'Priority',
      due_date: 'Due date',
      status: 'Status'
    };
    return groupLabels[groupBy as keyof typeof groupLabels];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-auto hover:bg-blue-50"
          title="View options"
          aria-haspopup="dialog"
          aria-expanded="false"
        >
          <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Layout */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Layout
          </div>
          <div className="space-y-1">
            <DropdownMenuCheckboxItem
              checked={options.layout === 'list'}
              onCheckedChange={() => handleToggle('layout', 'list')}
              className="flex items-center"
            >
              <List className="w-4 h-4 mr-2" />
              List view
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.layout === 'board'}
              onCheckedChange={() => handleToggle('layout', 'board')}
              className="flex items-center"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Board view
            </DropdownMenuCheckboxItem>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Display Options */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Display
          </div>
          <div className="space-y-1">
            <DropdownMenuCheckboxItem
              checked={options.showCompletedTasks}
              onCheckedChange={(checked) => handleToggle('showCompletedTasks', checked)}
            >
              Show completed tasks
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.showDescriptions}
              onCheckedChange={(checked) => handleToggle('showDescriptions', checked)}
            >
              Show descriptions
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.showDueDates}
              onCheckedChange={(checked) => handleToggle('showDueDates', checked)}
            >
              Show due dates
            </DropdownMenuCheckboxItem>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Sort Options */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center">
            {options.sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 mr-2" />
            ) : (
              <SortDesc className="w-4 h-4 mr-2" />
            )}
            Sort by: {getSortLabel(options.sortBy, options.sortOrder)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleToggle('sortBy', 'created_at')}>
              Date created
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('sortBy', 'due_date')}>
              Due date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('sortBy', 'priority')}>
              Priority
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('sortBy', 'title')}>
              Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleToggle('sortOrder', 'asc')}>
              <SortAsc className="w-4 h-4 mr-2" />
              Ascending (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('sortOrder', 'desc')}>
              <SortDesc className="w-4 h-4 mr-2" />
              Descending (Z-A)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Group Options */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Group by: {getGroupLabel(options.groupBy)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleToggle('groupBy', 'none')}>
              None
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('groupBy', 'priority')}>
              Priority
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('groupBy', 'due_date')}>
              Due date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggle('groupBy', 'status')}>
              Status
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ViewOptionsMenu;
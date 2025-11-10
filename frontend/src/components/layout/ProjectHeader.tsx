import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal,
  MessageSquare,
  List,
  Columns,
  Calendar,
  Crown,
  ChevronDown,
  Copy,
  Edit,
  Heart,
  Plus,
  Link as LinkIcon,
  Download,
  Upload,
  Mail,
  BarChart3,
  Archive,
  Trash2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import type { Project } from '@/types/api';

interface ProjectHeaderProps {
  project: Project;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onEdit,
  onDelete,
  onShare,
}) => {
  const navigate = useNavigate();
  const [viewOptions, setViewOptions] = useState({
    layout: 'list' as 'list' | 'board' | 'calendar',
    showCompleted: false,
    groupBy: 'default' as 'default' | 'date' | 'priority' | 'assignee',
    sortBy: 'manual' as 'manual' | 'date' | 'priority' | 'alphabetical',
    dateFilter: 'all' as 'all' | 'today' | 'week' | 'overdue',
    priorityFilter: 'all' as 'all' | 'high' | 'medium' | 'low'
  });

  const handleLayoutChange = (layout: 'list' | 'board' | 'calendar') => {
    setViewOptions(prev => ({ ...prev, layout }));
  };

  const handleViewOptionsChange = (key: string, value: string | boolean) => {
    setViewOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <header 
      className="flex items-center justify-end px-4 gap-2" 
      style={{ 
        height: '56px',
        minHeight: '56px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--background)'
      }}
      aria-label="Header: contains actions and options related to the current view"
    >
      {/* Share button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShare}
        className="gap-2 text-gray-600 hover:text-gray-900"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      {/* View options menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <List className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {/* Layout Section */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <DropdownMenuLabel className="text-sm font-medium p-0">Layout</DropdownMenuLabel>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLayoutChange('list')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  viewOptions.layout === 'list' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <List className="w-6 h-6" />
                <span className="text-xs font-medium">List</span>
              </button>
              <button
                onClick={() => handleLayoutChange('board')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  viewOptions.layout === 'board' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Columns className="w-6 h-6" />
                <span className="text-xs font-medium">Board</span>
              </button>
              <button
                onClick={() => handleLayoutChange('calendar')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors relative ${
                  viewOptions.layout === 'calendar' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="relative">
                  <Calendar className="w-6 h-6" />
                  <Crown className="w-3 h-3 text-warning absolute -top-1 -right-1" />
                </div>
                <span className="text-xs font-medium">Calendar</span>
              </button>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Completed tasks toggle */}
          <div className="p-3">
            <div className="flex items-center justify-between">
              <DropdownMenuLabel className="text-sm font-medium p-0">Completed tasks</DropdownMenuLabel>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Checkbox 
                id="show-completed"
                checked={viewOptions.showCompleted}
                onCheckedChange={(checked: boolean) => handleViewOptionsChange('showCompleted', checked)}
              />
              <label htmlFor="show-completed" className="text-sm cursor-pointer">
                Show completed tasks
              </label>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Sort Section */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <DropdownMenuLabel className="text-sm font-medium p-0">Sort</DropdownMenuLabel>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Grouping</label>
                <select 
                  value={viewOptions.groupBy}
                  onChange={(e) => handleViewOptionsChange('groupBy', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-md bg-white"
                >
                  <option value="default">None (default)</option>
                  <option value="date">Date</option>
                  <option value="priority">Priority</option>
                  <option value="assignee">Assignee</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Sorting</label>
                <select 
                  value={viewOptions.sortBy}
                  onChange={(e) => handleViewOptionsChange('sortBy', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-md bg-white"
                >
                  <option value="manual">Manual (default)</option>
                  <option value="date">Date</option>
                  <option value="priority">Priority</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Filter Section */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <DropdownMenuLabel className="text-sm font-medium p-0">Filter</DropdownMenuLabel>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Date</label>
                <select 
                  value={viewOptions.dateFilter}
                  onChange={(e) => handleViewOptionsChange('dateFilter', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-md bg-white"
                >
                  <option value="all">All (default)</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Priority</label>
                <select 
                  value={viewOptions.priorityFilter}
                  onChange={(e) => handleViewOptionsChange('priorityFilter', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-md bg-white"
                >
                  <option value="all">All (default)</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Comments button */}
      <Button
        variant="ghost" 
        size="sm" 
        className="p-2"
        onClick={() => navigate(`/projects/${project.id}/comments`)}
      >
        <MessageSquare className="w-5 h-5" />
      </Button>

      {/* Project options menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Heart className="w-4 h-4 mr-2" />
            Remove from favorites
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Plus className="w-4 h-4 mr-2" />
            <div className="flex items-center justify-between w-full">
              <span>Add section</span>
              <kbd className="ml-auto text-xs tracking-widest opacity-60">S</kbd>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LinkIcon className="w-4 h-4 mr-2" />
            Copy link to project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Copy className="w-4 h-4 mr-2" />
            Save as template
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="w-4 h-4 mr-2" />
            Browse templates
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Upload className="w-4 h-4 mr-2" />
            Import from CSV
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Mail className="w-4 h-4 mr-2" />
            Email tasks to this project
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Calendar className="w-4 h-4 mr-2" />
            Project calendar feed
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <BarChart3 className="w-4 h-4 mr-2" />
            Activity log
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus className="w-4 h-4 mr-2" />
            Add extension…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem className="text-error focus:text-error" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default ProjectHeader;
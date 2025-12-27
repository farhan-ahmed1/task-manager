import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import { useProjects } from '@/hooks/useProjects';
import { useCreateTask } from '@/hooks/useTasks';
import type { CreateTaskRequest } from '@/types/api';
import { 
  Plus, 
  Search, 
  Inbox, 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  MoreHorizontal,
  Hash,
  ChevronDown,
  ChevronRight,
  PanelLeftClose
} from 'lucide-react';
import { useCommandPalette } from '@/hooks/useCommandPalette';

const mainNavigation = [
  { 
    name: 'Search', 
    icon: Search, 
    variant: 'ghost' as const,
    isCommand: true // Special flag for command palette
  },
  { 
    name: 'Inbox', 
    href: '/inbox', 
    icon: Inbox, 
    count: 3,
    variant: 'ghost' as const
  },
  { 
    name: 'Today', 
    href: '/today', 
    icon: Calendar, 
    count: 2,
    variant: 'ghost' as const
  },
  { 
    name: 'Upcoming', 
    href: '/upcoming', 
    icon: CalendarDays,
    variant: 'ghost' as const
  },
  { 
    name: 'Completed', 
    href: '/completed', 
    icon: CheckCircle2,
    variant: 'ghost' as const
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onOpenSearch?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, onToggle, onOpenSearch, className }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { open: openCommandPalette } = useCommandPalette();
  
  // React Query hooks - single source of truth
  const { data: projects = [], isLoading } = useProjects();
  const createTaskMutation = useCreateTask();
  
  // UI state only
  const [favoriteProjects, setFavoriteProjects] = useState(projects.slice(0, 2));
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Update favorites when projects change
  React.useEffect(() => {
    if (projects.length > 0) {
      setFavoriteProjects(projects.slice(0, 2));
    }
  }, [projects]);

  const isCurrentPath = (href: string) => {
    if (href === '/today' && location.pathname === '/tasks') return true;
    if (href === '/inbox' && location.pathname === '/dashboard') return true;
    return location.pathname === href;
  };

  const getProjectPath = (projectId: string) => `/projects/${projectId}`;

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getRandomColor = () => {
    // Use CSS variable colors for consistency
    const colors = [
      'var(--primary)',
      'var(--success)',
      'var(--error)',
      'var(--warning)',
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
    ];
    
    // Use user email or name to get consistent colors for the same user
    const seed = user?.email || user?.name || 'default';
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    await createTaskMutation.mutateAsync(taskData);
  };

  return (
    <div className={cn(
      "flex flex-col h-full sidebar-container",
      className
    )}>

      {/* Workspace Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-body font-medium text-text-primary">
              {user?.name?.split(' ')[0]}'s workspace
            </h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <span className="sr-only">Close sidebar</span>
            <PanelLeftClose className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-2">
          {/* Add Task Button */}
          <button 
            className="sidebar-add-task w-full flex items-center px-4 py-3 text-sm font-medium cursor-pointer mb-8 rounded-lg border-0"
            onClick={() => setIsAddTaskModalOpen(true)}
          >
            <Plus className="w-6 h-6 mr-3" />
            Add task
          </button>
        </div>
        
        <nav className="px-6 space-y-1">
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? isCurrentPath(item.href) : false;
            
            // Render Search as a button that opens the command palette
            if (item.isCommand) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (onOpenSearch) {
                      onOpenSearch();
                    } else {
                      openCommandPalette();
                    }
                    onClose?.();
                  }}
                  className="sidebar-nav-item w-full"
                  data-active="false"
                >
                  <div className="flex items-center">
                    <Icon className="sidebar-nav-icon" />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            }
            
            // Render normal navigation items
            return (
              <Link
                key={item.name}
                to={item.href!}
                onClick={onClose}
                className="sidebar-nav-item"
                data-active={isActive}
              >
                <div className="flex items-center">
                  <Icon className="sidebar-nav-icon" />
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span className="sidebar-nav-count">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* More section */}
        <div className="px-6 space-y-1">
          <button 
            className="sidebar-nav-item w-full"
            data-active="false"
          >
            <div className="flex items-center">
              <MoreHorizontal className="sidebar-nav-icon" />
              <span>More</span>
            </div>
          </button>
        </div>

        {/* Favorites section */}
        {favoriteProjects.length > 0 && (
          <div className="px-2 py-2 mt-4 pt-4 sidebar-divider">
            <button
              onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
              className="sidebar-section-header"
            >
              <span>Favorites</span>
              {isFavoritesExpanded ? (
                <ChevronDown className="w-3 h-3 transition-transform text-text-muted" />
              ) : (
                <ChevronRight className="w-3 h-3 transition-transform text-text-muted" />
              )}
            </button>
            {isFavoritesExpanded && (
              <div className="mt-2 space-y-1">
                {favoriteProjects.map((project) => {
                  const isActive = location.pathname === getProjectPath(project.id);
                  return (
                    <Link
                      key={project.id}
                      to={getProjectPath(project.id)}
                      onClick={onClose}
                      className="sidebar-project-link"
                      data-active={isActive}
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                          <Hash className="sidebar-project-icon" />
                        </div>
                        <span className="truncate">{project.name}</span>
                      </div>
                      <span className="sidebar-project-count">
                        1
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Projects section */}
        <div className="px-2 py-2 mt-4 pt-4 sidebar-divider">
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            className="sidebar-section-header"
          >
            <span>My Projects</span>
            {isProjectsExpanded ? (
              <ChevronDown className="w-3 h-3 transition-transform text-text-muted" />
            ) : (
              <ChevronRight className="w-3 h-3 transition-transform text-text-muted" />
            )}
          </button>
          {isProjectsExpanded && (
            <div className="mt-2 space-y-1">
              {isLoading ? (
                <div className="px-4 py-2 text-sm ml-2 text-text-muted">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="px-4 py-2 text-sm ml-2 text-text-muted">No projects yet</div>
              ) : (
                projects.map((project) => {
                  const isActive = location.pathname === getProjectPath(project.id);
                  return (
                    <Link
                      key={project.id}
                      to={getProjectPath(project.id)}
                      onClick={onClose}
                      className="sidebar-project-link"
                      data-active={isActive}
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                          <Hash className="sidebar-project-icon" />
                        </div>
                        <span className="truncate">{project.name}</span>
                      </div>
                      <span className="sidebar-project-count">
                        19
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* User section at bottom */}
      <div className="mt-auto p-3 sidebar-user-section">
        <button className="sidebar-user-button">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm" 
            style={{ 
              background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})` 
            }}
          >
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-text-primary">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs truncate text-text-secondary">
              {user?.email || 'admin@taskmanager.com'}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0 opacity-60 hover:opacity-100">
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Button>
        </button>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};

export default Sidebar;
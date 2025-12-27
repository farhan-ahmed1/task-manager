import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
      "flex flex-col h-full border-r border-white/5 bg-slate-900/50 backdrop-blur-xl transition-all duration-300",
      className
    )}>

      {/* Workspace Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
              {getUserInitials().substring(0, 1)}
            </div>
            <h2 className="font-medium text-slate-200 tracking-tight">
              {user?.name?.split(' ')[0]}'s Space
            </h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <span className="sr-only">Close sidebar</span>
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="p-4 pb-2">
          {/* Add Task Button */}
          <button 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 group"
            onClick={() => setIsAddTaskModalOpen(true)}
          >
            <div className="p-1 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span>New Task</span>
          </button>
        </div>
        
        <nav className="px-4 space-y-1 mt-4">
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 group"
                >
                  <Icon className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  <span>{item.name}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-slate-500 border border-white/5">⌘K</span>
                  </div>
                </button>
              );
            }
            
            // Render normal navigation items
            return (
              <Link
                key={item.name}
                to={item.href!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "text-white bg-white/10 shadow-inner" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                onClick={onClose}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                )} />
                <span>{item.name}</span>
                {item.count && (
                  <span className={cn(
                    "ml-auto text-xs px-2 py-0.5 rounded-full",
                    isActive ? "bg-primary text-white" : "bg-white/5 text-slate-500"
                  )}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Favorites section */}
        {favoriteProjects.length > 0 && (
          <div className="px-4 mt-8">
            <button
              onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
            >
              <span>Favorites</span>
              {isFavoritesExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {isFavoritesExpanded && (
              <div className="mt-1 space-y-0.5">
                {favoriteProjects.map((project) => {
                  const isActive = location.pathname === getProjectPath(project.id);
                  return (
                    <Link
                      key={project.id}
                      to={getProjectPath(project.id)}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 group",
                        isActive 
                          ? "text-white bg-white/10" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }} />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Projects section */}
        <div className="px-4 mt-6">
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>My Projects</span>
            {isProjectsExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {isProjectsExpanded && (
            <div className="mt-1 space-y-0.5">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-slate-600">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-600">No projects yet</div>
              ) : (
                projects.map((project) => {
                  const isActive = location.pathname === getProjectPath(project.id);
                  return (
                    <Link
                      key={project.id}
                      to={getProjectPath(project.id)}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 group",
                        isActive 
                          ? "text-white bg-white/10" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Hash className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* User section at bottom */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg" 
            style={{ 
              background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})` 
            }}
          >
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate text-slate-200 group-hover:text-white transition-colors">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs truncate text-slate-500 group-hover:text-slate-400 transition-colors">
              {user?.email || 'admin@taskmanager.com'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
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
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import { taskService } from '@/services/tasks';
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
import { projectService } from '@/services/projects';
import type { Project } from '@/types/api';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [favoriteProjects, setFavoriteProjects] = useState<Project[]>([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getProjects();
        if (response.success) {
          setProjects(response.data || []);
          // For now, we'll simulate favorites - you might want to add a favorites field to your project model
          setFavoriteProjects(response.data?.slice(0, 2) || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

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
    try {
      const response = await taskService.createTask(taskData);
      if (response.success) {
        // Task created successfully
        console.log('Task created:', response.data);
        // You might want to show a success notification here
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      // You might want to show an error notification here
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      className
    )} style={{ 
      backgroundColor: '#fafbff',
      borderRight: '1px solid var(--border-subtle)'
    }}>

      {/* Workspace Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0]}'s workspace
            </h2>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onToggle) {
                onToggle();
              }
            }}
            className="p-2 hover:opacity-60"
            style={{ color: 'var(--text-muted)' }}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-2">
          {/* Add Task Button */}
          <button 
            className="w-full flex items-center px-4 py-3 text-sm font-medium cursor-pointer transition-all duration-150 mb-8 rounded-lg border-0"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }}
            onClick={() => setIsAddTaskModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-3" />
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
                    // Use the prop if provided, otherwise fall back to the hook
                    if (onOpenSearch) {
                      onOpenSearch();
                    } else {
                      openCommandPalette();
                    }
                    onClose?.();
                  }}
                  className="w-full flex items-center justify-between py-2 text-sm group hover:opacity-60"
                  style={{
                    color: 'var(--text-secondary)',
                    fontWeight: '400'
                  }}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-4 flex-shrink-0" style={{
                      color: 'var(--text-muted)'
                    }} />
                    <span>{item.name}</span>
                  </div>
                  <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600">
                    <span>⌘</span>
                    <span>K</span>
                  </kbd>
                </button>
              );
            }
            
            // Render normal navigation items
            return (
              <Link
                key={item.name}
                to={item.href!}
                onClick={onClose}
                className="flex items-center justify-between py-2 text-sm group hover:opacity-60"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '500' : '400'
                }}
              >
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-4 flex-shrink-0" style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)'
                  }} />
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span className="text-xs px-2 py-1 text-center min-w-[1.5rem]" style={{
                    color: 'var(--text-muted)',
                    fontSize: '12px'
                  }}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* More section */}
        <div className="px-2 py-1">
          <button 
            className="flex items-center px-3 py-2 text-sm w-full transition-all duration-150"
            style={{
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <MoreHorizontal className="w-4 h-4 mr-3" style={{ color: 'var(--text-muted)' }} />
            More
          </button>
        </div>

        {/* Favorites section */}
        {favoriteProjects.length > 0 && (
          <div className="px-2 py-2 mt-4 pt-4" style={{ borderTop: '1px solid #DADCE0' }}>
            <button
              onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all duration-150"
              style={{
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span>Favorites</span>
              {isFavoritesExpanded ? (
                <ChevronDown className="w-3 h-3 transition-transform" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight className="w-3 h-3 transition-transform" style={{ color: 'var(--text-muted)' }} />
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
                      className="flex items-center justify-between px-4 py-2 text-sm transition-all duration-150 group ml-2"
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? '500' : '400'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.paddingLeft = '20px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.paddingLeft = '16px';
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 mr-3 flex-shrink-0" style={{
                          color: isActive ? 'var(--primary)' : 'var(--info)'
                        }} />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full text-center min-w-[1.5rem]" style={{
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
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
        <div className="px-2 py-2 mt-4 pt-4" style={{ borderTop: '1px solid #DADCE0' }}>
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all duration-150"
            style={{
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span>My Projects</span>
            {isProjectsExpanded ? (
              <ChevronDown className="w-3 h-3 transition-transform" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronRight className="w-3 h-3 transition-transform" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>
          {isProjectsExpanded && (
            <div className="mt-2 space-y-1">
              {isLoading ? (
                <div className="px-4 py-2 text-sm ml-2" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : projects.length === 0 ? (
                <div className="px-4 py-2 text-sm ml-2" style={{ color: 'var(--text-muted)' }}>No projects yet</div>
              ) : (
                projects.map((project) => {
                  const isActive = location.pathname === getProjectPath(project.id);
                  return (
                    <Link
                      key={project.id}
                      to={getProjectPath(project.id)}
                      onClick={onClose}
                      className="flex items-center justify-between px-4 py-2 text-sm transition-all duration-150 group ml-2"
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? '500' : '400'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.paddingLeft = '20px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.paddingLeft = '16px';
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 mr-3 flex-shrink-0" style={{
                          color: isActive ? 'var(--primary)' : 'var(--primary)'
                        }} />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full text-center min-w-[1.5rem]" style={{
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
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
      <div className="mt-auto p-3" style={{ borderTop: '1px solid #DADCE0' }}>
        <div className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-150 cursor-pointer" 
             style={{ backgroundColor: 'transparent' }}
             onMouseEnter={(e) => {
               e.currentTarget.style.backgroundColor = '#F1F3F4';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.backgroundColor = 'transparent';
             }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm" 
               style={{ 
                 background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})` 
               }}>
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {user?.email || 'admin@taskmanager.com'}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0 opacity-60 hover:opacity-100">
            <ChevronDown className="w-4 h-4" style={{ color: '#9AA0A6' }} />
          </Button>
        </div>
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
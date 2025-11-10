import React from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, BarChart3, FolderOpen, Users } from 'lucide-react';
import type { Project } from '@/types/api';
import type { ProjectStats } from '@/services/projects';
import { getProgressColor } from '@/lib/colors';

interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewTasks?: (project: Project) => void;
  onViewStats?: (project: Project) => void;
  onShare?: (project: Project) => void;
  onNavigateToProject?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onEdit,
  onDelete,
  onViewTasks,
  onViewStats,
  onShare,
  onNavigateToProject,
}) => {
  const totalTasks = stats ? stats.PENDING + stats.IN_PROGRESS + stats.COMPLETED : 0;
  const completedTasks = stats?.COMPLETED || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm bg-card hover:bg-card/95 border-border hover:border-[var(--border-focus)] transform hover:-translate-y-1 rounded-xl"
      onClick={() => onNavigateToProject?.(project)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Left Section - Project Info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-primary transition-colors truncate">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed mt-1">
                  {project.description || 'No description provided'}
                </CardDescription>
              </div>
              
              {/* Completion Rate Badge */}
              {stats && totalTasks > 0 && (
                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getProgressColor(completionRate) }}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{completionRate}%</span>
                </div>
              )}
            </div>

            {/* Progress Section */}
            {stats && totalTasks > 0 ? (
              <div className="space-y-3">
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${completionRate}%`,
                      backgroundColor: getProgressColor(completionRate)
                    }}
                  />
                </div>
                
                {/* Task Status Badges - Horizontal Layout */}
                <div className="flex items-center gap-3 text-xs">
                  {stats.COMPLETED > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-success-light text-success rounded-lg border border-success">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="font-medium">{stats.COMPLETED} Done</span>
                    </div>
                  )}
                  {stats.IN_PROGRESS > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-info-light text-info rounded-lg border border-info">
                      <div className="w-2 h-2 bg-info rounded-full" />
                      <span className="font-medium">{stats.IN_PROGRESS} Active</span>
                    </div>
                  )}
                  {stats.PENDING > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted text-muted-foreground rounded-lg border border-border">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <span className="font-medium">{stats.PENDING} Pending</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3">
                <div className="text-[var(--text-tertiary)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">No tasks yet - start by adding your first task</span>
              </div>
            )}

            {/* Project Metadata - Horizontal */}
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-light)]">
              <div className="flex items-center gap-1">
                <span>Created</span>
                <span className="font-medium text-[var(--text-primary)]">{formatDate(project.created_at)}</span>
              </div>
              {project.updated_at !== project.created_at && (
                <>
                  <div className="w-1 h-1 bg-[var(--border)] rounded-full" />
                  <div className="flex items-center gap-1">
                    <span>Updated</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(project.updated_at)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            {/* Quick Action Buttons - Always visible on desktop, show on hover on mobile */}
            <div className="flex gap-2">
              {onViewTasks && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewTasks(project);
                  }}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 bg-info-light hover:bg-info/10 border-info text-info rounded-lg text-xs font-medium opacity-80 group-hover:opacity-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
                >
                  <FolderOpen className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2} />
                  Tasks
                </Button>
              )}
              {onViewStats && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewStats(project);
                  }}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 bg-muted hover:bg-muted/80 border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium opacity-80 group-hover:opacity-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
                >
                  <BarChart3 className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2} />
                  Stats
                </Button>
              )}
            </div>

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 opacity-60 group-hover:opacity-100 transition-all duration-200 hover:bg-muted rounded-lg flex-shrink-0 icon-button"
                >
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground icon-enhanced dropdown-icon" strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-[var(--border)] rounded-xl">
                {onViewTasks && (
                  <DropdownMenuItem onClick={() => onViewTasks(project)} className="text-foreground hover:bg-muted rounded-lg cursor-pointer">
                    <FolderOpen className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                    View Tasks
                  </DropdownMenuItem>
                )}
                {onViewStats && (
                  <DropdownMenuItem onClick={() => onViewStats(project)} className="text-foreground hover:bg-muted rounded-lg cursor-pointer">
                    <BarChart3 className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                    View Analytics
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={() => onShare(project)} className="text-foreground hover:bg-muted rounded-lg cursor-pointer">
                    <Users className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                    Share Project
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(project)} className="text-foreground hover:bg-muted rounded-lg cursor-pointer">
                    <Edit className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                    Edit Project
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(project)}
                    className="text-error hover:bg-error-light focus:text-error rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2 icon-enhanced icon-status-error" strokeWidth={2.5} />
                    Delete Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
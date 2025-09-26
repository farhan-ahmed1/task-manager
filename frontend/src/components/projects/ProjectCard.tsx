import React from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, BarChart3, FolderOpen, Users } from 'lucide-react';
import type { Project } from '@/types/api';
import type { ProjectStats } from '@/services/projects';

interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewTasks?: (project: Project) => void;
  onViewStats?: (project: Project) => void;
  onShare?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onEdit,
  onDelete,
  onViewTasks,
  onViewStats,
  onShare,
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

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-blue-500';
    if (rate >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  return (
    <Card className="group hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-white/90 hover:bg-white border-slate-200/60 hover:border-slate-300/60 transform hover:-translate-y-1 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Left Section - Project Info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 line-clamp-2 leading-relaxed mt-1">
                  {project.description || 'No description provided'}
                </CardDescription>
              </div>
              
              {/* Completion Rate Badge */}
              {stats && totalTasks > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full ${
                    completionRate >= 80 ? 'bg-green-500' : 
                    completionRate >= 50 ? 'bg-blue-500' : 
                    completionRate >= 25 ? 'bg-yellow-500' : 'bg-slate-300'
                  }`} />
                  <span className="text-sm font-medium text-slate-900">{completionRate}%</span>
                </div>
              )}
            </div>

            {/* Progress Section */}
            {stats && totalTasks > 0 ? (
              <div className="space-y-3">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(completionRate)}`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                
                {/* Task Status Badges - Horizontal Layout */}
                <div className="flex items-center gap-3 text-xs">
                  {stats.COMPLETED > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="font-medium">{stats.COMPLETED} Done</span>
                    </div>
                  )}
                  {stats.IN_PROGRESS > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="font-medium">{stats.IN_PROGRESS} Active</span>
                    </div>
                  )}
                  {stats.PENDING > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">
                      <div className="w-2 h-2 bg-slate-400 rounded-full" />
                      <span className="font-medium">{stats.PENDING} Pending</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3">
                <div className="text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm text-slate-500">No tasks yet - start by adding your first task</span>
              </div>
            )}

            {/* Project Metadata - Horizontal */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span>Created</span>
                <span className="font-medium text-slate-700">{formatDate(project.created_at)}</span>
              </div>
              {project.updated_at !== project.created_at && (
                <>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <div className="flex items-center gap-1">
                    <span>Updated</span>
                    <span className="font-medium text-slate-700">{formatDate(project.updated_at)}</span>
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
                  className="h-8 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-medium opacity-80 group-hover:opacity-100 transition-all"
                >
                  <FolderOpen className="h-3 w-3 mr-1" />
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
                  className="h-8 px-3 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-800 rounded-lg text-xs font-medium opacity-80 group-hover:opacity-100 transition-all"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
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
                  className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-100 rounded-lg flex-shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4 text-slate-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-slate-200/60 rounded-xl">
                {onViewTasks && (
                  <DropdownMenuItem onClick={() => onViewTasks(project)} className="text-slate-700 hover:bg-slate-50 rounded-lg">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    View Tasks
                  </DropdownMenuItem>
                )}
                {onViewStats && (
                  <DropdownMenuItem onClick={() => onViewStats(project)} className="text-slate-700 hover:bg-slate-50 rounded-lg">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={() => onShare(project)} className="text-slate-700 hover:bg-slate-50 rounded-lg">
                    <Users className="h-4 w-4 mr-2" />
                    Share Project
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(project)} className="text-slate-700 hover:bg-slate-50 rounded-lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(project)}
                    className="text-red-600 hover:bg-red-50 focus:text-red-700 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
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
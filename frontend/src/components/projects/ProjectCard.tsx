import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, BarChart3, FolderOpen } from 'lucide-react';
import type { Project } from '@/types/api';
import type { ProjectStats } from '@/services/projects';

interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewTasks?: (project: Project) => void;
  onViewStats?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onEdit,
  onDelete,
  onViewTasks,
  onViewStats,
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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {project.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2">
              {project.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewTasks && (
                <DropdownMenuItem onClick={() => onViewTasks(project)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View Tasks
                </DropdownMenuItem>
              )}
              {onViewStats && (
                <DropdownMenuItem onClick={() => onViewStats(project)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(project)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Task Statistics */}
          {stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(completionRate)}`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedTasks} completed</span>
                <span>{totalTasks} total tasks</span>
              </div>
            </div>
          )}

          {/* Task Status Badges */}
          {stats && totalTasks > 0 && (
            <div className="flex flex-wrap gap-2">
              {stats.PENDING > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stats.PENDING} Pending
                </Badge>
              )}
              {stats.IN_PROGRESS > 0 && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {stats.IN_PROGRESS} In Progress
                </Badge>
              )}
              {stats.COMPLETED > 0 && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  {stats.COMPLETED} Completed
                </Badge>
              )}
            </div>
          )}

          {/* Project Metadata */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{formatDate(project.created_at)}</span>
            </div>
            {project.updated_at !== project.created_at && (
              <div className="flex justify-between mt-1">
                <span>Updated</span>
                <span>{formatDate(project.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
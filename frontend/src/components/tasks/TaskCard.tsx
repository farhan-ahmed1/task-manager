import React from 'react';
import { MoreVertical, Calendar, AlertCircle, Clock, CheckCircle2, PlayCircle, PauseCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task } from '@/types/api';
import { 
  formatDate, 
  getRelativeTime, 
  isTaskOverdue,
  getTaskStatusColor,
  getTaskPriorityColor 
} from '@/lib/taskUtils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: Task['status']) => void;
  isDeleting?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isDeleting = false
}) => {
  const isOverdue = isTaskOverdue(task.due_date);

  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange(task, newStatus);
  };

  // Get status icon and colors - Enhanced with better sizing and animations
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-success icon-status icon-status-success transition-all duration-200" strokeWidth={2.5} />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-info icon-status icon-status-info transition-all duration-200" strokeWidth={2.5} />;
      default:
        return <PauseCircle className="w-5 h-5 text-muted-foreground icon-status transition-all duration-200" strokeWidth={2} />;
    }
  };

  const getPriorityBorderAndBg = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-error bg-error-light/30';
      case 'MEDIUM':
        return 'border-l-warning bg-warning-light/30';
      case 'LOW':
        return 'border-l-success bg-success-light/30';
      default:
        return 'border-l-border bg-muted/30';
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${getPriorityBorderAndBg(task.priority)} backdrop-blur-sm bg-card hover:bg-card/95 border-border hover:border-[var(--border-focus)] transform hover:-translate-y-0.5`}
          onClick={() => onView(task)}>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Top Row - Status Icon, Title, and Badges */}
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(task.status)}
            </div>
            
            {/* Title and Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-primary transition-colors text-base sm:text-lg leading-tight">
                  {task.title}
                </h3>
                
                {/* Status and Priority Badges - Always visible */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium border ${getTaskStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    <span className="ml-1">{task.status.replace('_', ' ')}</span>
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium border ${getTaskPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {task.description && (
            <div className="pl-7 sm:pl-9">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {task.description}
              </p>
            </div>
          )}
          
          {/* Bottom Row - Due Date, Updated Time, and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pl-7 sm:pl-9">
            {/* Due Date and Time Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {task.due_date && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isOverdue 
                    ? 'bg-error-light text-error border border-error icon-badge' 
                    : 'bg-muted text-muted-foreground border border-border icon-badge'
                }`}>
                  {isOverdue && <AlertCircle className="w-4 h-4 icon-status-error icon-hover-pulse" strokeWidth={2.5} />}
                  <Calendar className="w-4 h-4 icon-enhanced" strokeWidth={2} />
                  <span>Due {formatDate(task.due_date)}</span>
                </div>
              )}
              
              <div className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock className="w-4 h-4 icon-enhanced" strokeWidth={2} />
                <span>Updated {getRelativeTime(task.updated_at)}</span>
              </div>
            </div>
            
            {/* Action Buttons - Well organized */}
            <div className="flex items-center gap-2">
              {/* Quick Action Buttons */}
              <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 flex gap-2">
                {task.status !== 'COMPLETED' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('COMPLETED');
                    }}
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 bg-success-light hover:bg-success/10 border-success text-success rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2.5} />
                    Complete
                  </Button>
                )}
                
                {task.status === 'PENDING' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('IN_PROGRESS');
                    }}
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 bg-info-light hover:bg-info/10 border-info text-info rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
                  >
                    <PlayCircle className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2.5} />
                    Start
                  </Button>
                )}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 bg-muted hover:bg-muted/80 border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 button-with-icon"
                >
                  <Edit className="w-4 h-4 mr-1.5 icon-enhanced icon-hover" strokeWidth={2} />
                  Edit
                </Button>
              </div>
              
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 opacity-60 group-hover:opacity-100 transition-all duration-200 hover:bg-muted rounded-lg flex-shrink-0 icon-button"
                  >
                    <MoreVertical className="w-5 h-5 text-muted-foreground icon-enhanced dropdown-icon" strokeWidth={2} />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-[var(--border)]">
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(task); }} className="text-foreground hover:bg-muted cursor-pointer">
                    <Eye className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(task); }} className="text-foreground hover:bg-muted cursor-pointer">
                    <Edit className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {task.status !== 'COMPLETED' && (
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('COMPLETED'); }}
                      className="text-success hover:bg-success-light cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 icon-enhanced icon-status-success" strokeWidth={2.5} />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'IN_PROGRESS' && (
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('IN_PROGRESS'); }}
                      className="text-info hover:bg-info-light cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 mr-2 icon-enhanced icon-status-info" strokeWidth={2.5} />
                      Start Progress
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'PENDING' && (
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('PENDING'); }}
                      className="text-muted-foreground hover:bg-muted cursor-pointer"
                    >
                      <PauseCircle className="w-4 h-4 mr-2 icon-enhanced" strokeWidth={2} />
                      Mark Pending
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e: React.MouseEvent) => { 
                      e.stopPropagation(); 
                      if (!isDeleting) onDelete(task); 
                    }}
                    className="text-error hover:bg-error-light focus:text-error cursor-pointer"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2 icon-enhanced icon-status-error" strokeWidth={2.5} />
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
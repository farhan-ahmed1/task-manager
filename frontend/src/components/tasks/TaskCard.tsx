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
  isTaskOverdue 
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

  // Get status icon and colors
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <PauseCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-50/50';
      case 'MEDIUM':
        return 'border-l-amber-500 bg-amber-50/50';
      case 'LOW':
        return 'border-l-green-500 bg-green-50/50';
      default:
        return 'border-l-slate-300 bg-slate-50/50';
    }
  };

  const getStatusBadgeStyle = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadgeStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card className={`group hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer border-l-4 ${getPriorityColor(task.priority)} backdrop-blur-sm bg-white/90 hover:bg-white border-slate-200/60 hover:border-slate-300/60 transform hover:-translate-y-0.5`}
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
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors text-base sm:text-lg leading-tight">
                  {task.title}
                </h3>
                
                {/* Status and Priority Badges - Always visible */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium border ${getStatusBadgeStyle(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    <span className="ml-1">{task.status.replace('_', ' ')}</span>
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium border ${getPriorityBadgeStyle(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {task.description && (
            <div className="pl-7 sm:pl-8">
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                {task.description}
              </p>
            </div>
          )}
          
          {/* Bottom Row - Due Date, Updated Time, and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pl-7 sm:pl-8">
            {/* Due Date and Time Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {task.due_date && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium ${
                  isOverdue 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  <span>Due {formatDate(task.due_date)}</span>
                </div>
              )}
              
              <div className="text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
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
                    className="h-8 px-3 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800 rounded-lg text-xs font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
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
                    className="h-8 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-medium"
                  >
                    <PlayCircle className="h-3 w-3 mr-1" />
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
                  className="h-8 px-3 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-100 rounded-lg flex-shrink-0"
                  >
                    <MoreVertical className="h-4 w-4 text-slate-600" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-slate-200/60">
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(task); }} className="text-slate-700 hover:bg-slate-50">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(task); }} className="text-slate-700 hover:bg-slate-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {task.status !== 'COMPLETED' && (
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('COMPLETED'); }}
                      className="text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'IN_PROGRESS' && (
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('IN_PROGRESS'); }}
                      className="text-blue-700 hover:bg-blue-50"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Progress
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'PENDING' && (
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleStatusChange('PENDING'); }}
                      className="text-slate-700 hover:bg-slate-50"
                    >
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Mark Pending
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e: React.MouseEvent) => { 
                      e.stopPropagation(); 
                      if (!isDeleting) onDelete(task); 
                    }}
                    className="text-red-600 hover:bg-red-50 focus:text-red-700"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
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
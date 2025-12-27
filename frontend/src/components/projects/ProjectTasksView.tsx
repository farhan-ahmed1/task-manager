import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import TaskForm from '@/components/tasks/TaskForm';
import { ProjectTaskView } from '@/components/projects';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { Project, Task } from '@/types/api';
import type { CreateTaskFormData } from '@/validation/task';

interface ProjectTasksViewProps {
  // Project data
  project: Project;
  
  // Task form state
  isTaskFormOpen: boolean;
  editingTask: Task | null;
  taskFormError: string | null;
  isTaskSubmitting: boolean;
  
  // Actions
  onBack: () => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onTaskFormSubmit: (data: CreateTaskFormData) => Promise<void>;
  onTaskFormClose: () => void;
}

/**
 * ProjectTasksView Component
 * Displays project tasks with create/edit functionality
 */
const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({
  project,
  isTaskFormOpen,
  editingTask,
  taskFormError,
  isTaskSubmitting,
  onBack,
  onCreateTask,
  onEditTask,
  onTaskFormSubmit,
  onTaskFormClose,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div>
              <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {project.name}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Project Tasks</p>
            </div>
          </div>
        </div>

        {/* Project Tasks Component */}
        <ProjectTaskView
          project={project}
          onCreateTask={onCreateTask}
          onEditTask={onEditTask}
          refreshTrigger={0}
        />

        {/* Task Form Dialog */}
        <TaskForm
          open={isTaskFormOpen}
          onOpenChange={onTaskFormClose}
          task={editingTask || undefined}
          onSubmit={onTaskFormSubmit}
          loading={isTaskSubmitting}
          defaultProjectId={project.id}
          showProjectSelector={true}
        />

        {/* Task Form Error Alert */}
        {taskFormError && isTaskFormOpen && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <p>{taskFormError}</p>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default ProjectTasksView;

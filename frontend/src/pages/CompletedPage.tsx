import React, { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/context/AuthContext';
import ActivitySection from '@/components/activity/ActivitySection';
import '@/components/activity/activity.css';
import type { Task, Project } from '@/types/api';

const CompletedPage: React.FC = () => {
  const { user } = useAuth();
  
  // React Query hooks - single source of truth
  const { data: completedTasks = [], isLoading: tasksLoading, error: tasksError } = useTasks({ status: 'COMPLETED' });
  const { data: allProjects = [], isLoading: projectsLoading } = useProjects();

  const isLoading = tasksLoading || projectsLoading;

  // Create projects map
  const projects = useMemo(() => {
    const projectsMap: { [key: string]: Project } = {};
    const projectIds = [...new Set(completedTasks.map(task => task.project_id).filter(Boolean))];
    
    allProjects.forEach(project => {
      if (projectIds.includes(project.id)) {
        projectsMap[project.id] = project;
      }
    });
    
    return projectsMap;
  }, [completedTasks, allProjects]);

  // Group tasks by completion date (using updated_at as proxy for completion time)
  const groupTasksByDate = (tasks: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const completionDate = new Date(task.updated_at);
      const dateKey = completionDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    // Sort tasks within each date by completion time (newest first)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    return grouped;
  };

  // Sort dates (newest first)
  const sortedDates = (groupedTasks: { [key: string]: Task[] }) => {
    return Object.keys(groupedTasks).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  if (isLoading) {
    return (
      <div className="main-view-layout main-view-layout--narrow">
        <PageSpinner text="Loading activity..." />
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="main-view-layout main-view-layout--narrow">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-[var(--error)] mb-4">Failed to load completed tasks</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const groupedTasks = groupTasksByDate(completedTasks);
  const dates = sortedDates(groupedTasks);

  return (
    <div className="main-view-layout main-view-layout--narrow">
      {/* Page Title */}
      <div className="px-6">
        <PageTitle icon={CheckCircle}>Completed</PageTitle>
      </div>

      {/* Activity Content */}
      <div className="activity-content-container">
        <div id="activity_app">
          {dates.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No completed tasks yet"
              description="Tasks you complete will appear here as activity history."
            />
          ) : (
            <>
              {dates.map(date => (
                <ActivitySection
                  key={date}
                  date={date}
                  tasks={groupedTasks[date]}
                  projects={projects}
                  userAvatar={undefined}
                  userName={user?.name || 'You'}
                />
              ))}
              
              {/* End message */}
              <div className="activity-end-message">
                <hr className="activity-end-divider" />
                <div className="activity-end-text">
                  <p className="no_more_results">That's it. No more history to load.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedPage;
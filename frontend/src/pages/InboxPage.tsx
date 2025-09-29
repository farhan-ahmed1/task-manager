import React from 'react';
import { Inbox } from 'lucide-react';
import ProjectTasksLayout from '@/components/projects/ProjectTasksLayout';

const InboxPage: React.FC = () => {
  return (
    <ProjectTasksLayout
      project={undefined}
      icon={<Inbox className="w-5 h-5 mr-2" style={{ color: 'var(--primary)' }} />}
      title="Inbox"
      emptyStateTitle="Your inbox is empty"
      emptyStateDescription="Add your first task to get started with organizing your work."
      emptyButtonText="Add your first task"
    />
  );
};

export default InboxPage;

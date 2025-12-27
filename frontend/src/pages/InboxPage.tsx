import React from 'react';
import { Inbox } from 'lucide-react';
import ProjectTasksLayout from '@/components/projects/ProjectTasksLayout';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const InboxPage: React.FC = () => {
  const config = useLayoutConfig('Inbox', {
    icon: <Inbox className="w-5 h-5 mr-2" style={{ color: 'var(--primary)' }} />,
    emptyState: 'inbox',
  });

  return (
    <ProjectTasksLayout
      project={undefined}
      config={config}
    />
  );
};

export default InboxPage;

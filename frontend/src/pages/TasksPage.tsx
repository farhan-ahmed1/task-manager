import React from 'react';
import TaskList from '@/components/tasks/TaskList';

const TasksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <TaskList />
      </div>
    </div>
  );
};

export default TasksPage;
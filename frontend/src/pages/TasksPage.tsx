import React from 'react';
import TaskList from '@/components/tasks/TaskList';

const TasksPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <TaskList />
    </div>
  );
};

export default TasksPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AddTaskPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Add Task</h1>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">
          Task creation form would go here. This is a placeholder page to demonstrate the navigation structure.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate('/tasks')}>
            Go to Tasks
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskPage;
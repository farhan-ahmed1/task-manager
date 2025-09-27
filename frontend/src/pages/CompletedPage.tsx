import React from 'react';

const CompletedPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <p className="text-gray-600">All your completed tasks.</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Completed Tasks</h2>
        <p className="text-gray-500">No completed tasks yet</p>
      </div>
    </div>
  );
};

export default CompletedPage;
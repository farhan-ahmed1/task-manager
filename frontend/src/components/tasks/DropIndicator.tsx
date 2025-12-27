import React from 'react';

interface DropIndicatorProps {
  isVisible: boolean;
}

const DropIndicator: React.FC<DropIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="relative my-1">
      <div 
        className="h-0.5 rounded-full transition-all duration-200"
        style={{ 
          backgroundColor: 'var(--primary)',
          boxShadow: 'var(--shadow-drop-md)'
        }}
      />
      <div 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: 'var(--primary)',
          boxShadow: 'var(--shadow-drop-sm)'
        }}
      />
      <div 
        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: 'var(--primary)',
          boxShadow: 'var(--shadow-drop-sm)'
        }}
      />
    </div>
  );
};

export default DropIndicator;
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
          boxShadow: '0 0 8px rgba(66, 133, 244, 0.4)'
        }}
      />
      <div 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: 'var(--primary)',
          boxShadow: '0 0 4px rgba(66, 133, 244, 0.6)'
        }}
      />
      <div 
        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: 'var(--primary)',
          boxShadow: '0 0 4px rgba(66, 133, 244, 0.6)'
        }}
      />
    </div>
  );
};

export default DropIndicator;
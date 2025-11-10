import React from 'react';
import { GripVertical } from 'lucide-react';

interface DragHandleProps {
  isDragging?: boolean;
}

const DragHandle: React.FC<DragHandleProps> = ({ isDragging = false }) => {
  return (
    <button
      className="drag-handle flex items-center justify-center w-6 h-6 transition-all duration-200 hover:bg-gray-100/80 rounded-md"
      style={{
        color: 'var(--text-secondary)',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      tabIndex={-1}
      aria-label="Drag to reorder"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
};

export default DragHandle;
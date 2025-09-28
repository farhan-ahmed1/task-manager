import React, { useState, useRef, useEffect } from 'react';

interface AddSectionButtonProps {
  onAddSection: (name: string) => void;
  disabled?: boolean;
  className?: string;
}

const AddSectionButton: React.FC<AddSectionButtonProps> = ({
  onAddSection,
  disabled = false,
  className = ""
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    if (sectionName.trim()) {
      onAddSection(sectionName.trim());
      setSectionName('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setSectionName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isAdding) {
    return (
      <div className={`py-6 ${className}`}>
        <div className="px-4">
          <input
            ref={inputRef}
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Section name"
            className="w-full px-3 py-2 text-sm focus:outline-none mb-3 bg-transparent border-b border-gray-300 focus:border-blue-500"
            style={{ fontSize: '14px' }}
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSubmit}
              disabled={!sectionName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Add section
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-4 ${className}`}>
      <button
        onClick={() => setIsAdding(true)}
        disabled={disabled}
        className="w-full relative flex items-center hover:opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <div className="flex-grow border-t border-blue-300"></div>
        <span className="flex-shrink-0 px-4 text-sm text-blue-600 bg-white">
          Add section
        </span>
        <div className="flex-grow border-t border-blue-300"></div>
      </button>
    </div>
  );
};

export default AddSectionButton;
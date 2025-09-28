import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Section } from '@/types/api';

interface SectionHeaderProps {
  section: Section;
  taskCount: number;
  onToggleCollapse: (sectionId: string) => void;
  onRename: (sectionId: string, newName: string) => void;
  onDelete: (sectionId: string) => void;
  onAddTask: (sectionId: string) => void;
  isDragging?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  taskCount,
  onToggleCollapse,
  onRename,
  onDelete,
  onAddTask,
  isDragging = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: section.id,
    data: { type: 'section' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleNameSubmit = () => {
    if (editName.trim() && editName.trim() !== section.name) {
      onRename(section.id, editName.trim());
    } else {
      setEditName(section.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(section.name);
      setIsEditing(false);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-3 px-4 group/section border-b border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center flex-1 min-w-0">
        {/* Drag handle */}
        <div 
          className={`flex-shrink-0 mr-2 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          {...attributes}
          {...listeners}
        >
          <GripVertical 
            className="w-4 h-4 cursor-grab active:cursor-grabbing" 
            style={{ color: 'var(--text-muted)' }}
          />
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleCollapse(section.id)}
          className="p-1 h-auto mr-2 hover:bg-gray-100 rounded"
          aria-label={section.collapsed ? 'Expand section' : 'Collapse section'}
        >
          {section.collapsed ? (
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          )}
        </Button>

        {/* Section name */}
        <div className="flex items-center flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          ) : (
            <h3 
              className="text-sm font-semibold flex-1 min-w-0 truncate cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => setIsEditing(true)}
            >
              {section.name}
            </h3>
          )}
          
          {/* Task count */}
          <span 
            className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: 'var(--surface-secondary)', 
              color: 'var(--text-secondary)' 
            }}
          >
            {taskCount}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center space-x-1 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask(section.id)}
          className="p-1.5 h-auto hover:bg-gray-100 rounded"
          title="Add task to section"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-auto hover:bg-gray-100 rounded"
              title="Section options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              Rename section
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(section.id)}
              className="text-red-600 focus:text-red-600"
            >
              Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SectionHeader;
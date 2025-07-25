"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  ClockIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { TaskPriority, Task } from '@/lib/types/task';

interface TaskCardProps {
  task: Task & { project?: { name: string } };
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  [TaskPriority.LOW]: 'bg-gray-700/50 text-gray-300 ring-gray-600/50',
  [TaskPriority.MEDIUM]: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
  [TaskPriority.HIGH]: 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
  [TaskPriority.URGENT]: 'bg-red-500/10 text-red-300 ring-red-500/20',
};

const PRIORITY_LABELS = {
  [TaskPriority.LOW]: 'Baja',
  [TaskPriority.MEDIUM]: 'Media',
  [TaskPriority.HIGH]: 'Alta',
  [TaskPriority.URGENT]: 'Urgente',
};

export default function TaskCard({ task, onEdit, onDelete, isDragging = false }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div 
      className={`
        bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm flex flex-col gap-1.5 sm:gap-2
        ${isDragging 
          ? 'shadow-2xl bg-white/20 border-white/40 scale-105 rotate-2' 
          : 'hover:bg-white/10 hover:border-white/20 cursor-grab active:cursor-grabbing'
        }
      `}
      style={{
        // Dejar que @hello-pangea/dnd maneje completamente las transformaciones
        transition: isDragging ? 'none' : 'all 0.2s ease',
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          {task.project?.name && (
            <span className="block text-[11px] sm:text-xs text-indigo-300 font-medium truncate mb-0.5 sm:mb-1">
              {task.project.name}
            </span>
          )}
          <h3 className="font-medium text-white text-sm sm:text-base truncate">{task.title}</h3>
        </div>
        {!isDragging && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors rounded"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 line-clamp-3">
          {task.description}
        </p>
      )}

      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between items-center gap-2">
          <span 
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ring-1 ${
              PRIORITY_COLORS[task.priority ?? TaskPriority.LOW]
            } whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]`}
          >
            {PRIORITY_LABELS[task.priority ?? TaskPriority.LOW]}
          </span>
          
          {task.estimatedHours && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
              <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${
            isOverdue ? 'text-red-400' : 'text-gray-400'
          }`}>
            {isOverdue && <ExclamationTriangleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />}
            <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
            </span>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {task.tags.slice(0, 2).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[10px] sm:text-xs ring-1 ring-indigo-500/20 truncate max-w-[80px] sm:max-w-[100px]"
                title={tag}
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded text-[10px] sm:text-xs ring-1 ring-gray-600/50">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskStatus, Task } from '@/lib/types/task';
import TaskCard from './TaskCard';
import { PlusIcon } from '@heroicons/react/24/outline';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS = [
  { 
    id: TaskStatus.TODO, 
    title: 'Por hacer', 
    color: 'bg-gray-800/30',
    headerColor: 'bg-gray-700/50',
    textColor: 'text-gray-300'
  },
  { 
    id: TaskStatus.IN_PROGRESS, 
    title: 'En progreso', 
    color: 'bg-blue-900/20',
    headerColor: 'bg-blue-800/50',
    textColor: 'text-blue-300'
  },
  { 
    id: TaskStatus.REVIEW, 
    title: 'En revisión', 
    color: 'bg-yellow-900/20',
    headerColor: 'bg-yellow-800/50',
    textColor: 'text-yellow-300'
  },
  { 
    id: TaskStatus.DONE, 
    title: 'Completado', 
    color: 'bg-green-900/20',
    headerColor: 'bg-green-800/50',
    textColor: 'text-green-300'
  },
];

export default function TaskBoard({ 
  tasks, 
  onUpdateStatus, 
  onCreateTask, 
  onEditTask, 
  onDeleteTask 
}: TaskBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    
    // Si se mueve a la misma posición, no hacer nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    onUpdateStatus(draggableId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map(column => (
          <div key={column.id} className="bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className={`${column.headerColor} p-4 border-b border-white/10`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-semibold ${column.textColor}`}>{column.title}</h3>
                <span className="bg-white/10 px-2 py-1 rounded-full text-xs font-medium text-gray-300 ring-1 ring-white/20">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-4 min-h-[300px] ${
                    snapshot.isDraggingOver ? column.color : ''
                  }`}
                  style={{
                    transition: snapshot.isDraggingOver ? 'none' : 'background-color 0.2s ease',
                  }}
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-3"
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? `${provided.draggableProps.style?.transform} rotate(5deg)` 
                              : provided.draggableProps.style?.transform,
                          }}
                        >
                          <TaskCard
                            task={task}
                            onEdit={() => onEditTask(task)}
                            onDelete={() => onDeleteTask(task.id)}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  <button
                    onClick={() => onCreateTask(column.id)}
                    className="w-full p-3 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-white/40 hover:text-gray-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-sm">Agregar tarea</span>
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskStatus, Task } from '@/lib/types/task';
import TaskCard from './TaskCard';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../ui/NotificationProvider';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

const COLUMNS = [
  {
    id: TaskStatus.TODO,
    title: 'Por hacer',
    color: 'bg-gray-800/30',
    headerColor: 'bg-gray-700/50',
    textColor: 'text-gray-300',
    badgeColor: 'bg-gray-700'
  },
  {
    id: TaskStatus.IN_PROGRESS,
    title: 'En progreso',
    color: 'bg-blue-900/20',
    headerColor: 'bg-blue-800/40',
    textColor: 'text-blue-300',
    badgeColor: 'bg-blue-700'
  },
  {
    id: TaskStatus.REVIEW,
    title: 'En revisión',
    color: 'bg-yellow-900/20',
    headerColor: 'bg-yellow-800/40',
    textColor: 'text-yellow-300',
    badgeColor: 'bg-yellow-700'
  },
  {
    id: TaskStatus.DONE,
    title: 'Completado',
    color: 'bg-green-900/20',
    headerColor: 'bg-green-800/40',
    textColor: 'text-green-300',
    badgeColor: 'bg-green-700'
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
      <div className="relative w-full overflow-x-auto pb-4 sm:pb-6">
        <div className="inline-flex w-max min-w-full px-3 sm:px-6 space-x-4 sm:space-x-6">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className="w-72 sm:w-80 bg-white/5 rounded-lg border border-white/10 flex flex-col shadow-lg overflow-hidden flex-shrink-0"
          >
            <div className={`${column.headerColor} py-3 px-3 border-b border-white/10 rounded-t-lg`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-medium text-sm ${column.textColor}`}>{column.title}</h3>
                <span className={`${column.badgeColor} px-2 py-0.5 rounded-full text-xs font-medium text-white/90 shadow-inner`}>
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-2 sm:p-3 min-h-[300px] sm:min-h-[350px] flex-1 transition-colors duration-200 ${
                    snapshot.isDraggingOver ? column.color : ''
                  } overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-3"
                          style={provided.draggableProps.style}
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
                    className="w-full py-2 px-2 border border-dashed border-white/20 rounded-md text-gray-400 hover:border-white/30 hover:text-gray-300 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 mt-2 text-xs"
                  >
                    <PlusIcon className="w-3 h-3" />
                    <span>Agregar tarea</span>
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        ))}
        </div>
      </div>
    </DragDropContext>
  );
}

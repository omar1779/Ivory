"use client";

import { useState, useMemo, useCallback } from "react";
import { useTasks } from "@/lib/hooks/useTasks";
import { TaskStatus, TaskPriority, Task, AmplifyTask } from "@/lib/types/task";
import dynamic from "next/dynamic";
import { PlusIcon } from "@heroicons/react/24/outline";

// Lazy loading de componentes pesados
const TaskBoard = dynamic(() => import("@/components/tasks/TaskBoard"), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-lg border border-white/10 p-4 animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
});

const NewTaskModal = dynamic(() => import("@/components/tasks/NewTaskModal"));
const EditTaskModal = dynamic(() => import("@/components/tasks/EditTaskModal"));

export default function TasksPage() {
  const { tasks, loading, createTask, updateTaskStatus, updateTask, deleteTask, error, initialized } = useTasks();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TODO);

  const handleCreateTask = useCallback((status: TaskStatus) => {
    setNewTaskStatus(status);
    setShowNewTaskModal(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      await deleteTask(taskId);
    }
  }, [deleteTask]);

  // Memoizar la función de normalización
  const normalizeTask = useCallback((amplifyTask: AmplifyTask): Task => {
    const filterValidStrings = (arr: (string | null)[] | null | undefined): string[] => {
      if (!arr) return [];
      return arr.filter((item): item is string => typeof item === 'string' && item !== null);
    };

    return {
      id: amplifyTask.id,
      title: amplifyTask.title,
      description: amplifyTask.description || undefined,
      status: (amplifyTask.status as TaskStatus) || TaskStatus.TODO,
      priority: (amplifyTask.priority as TaskPriority) || TaskPriority.MEDIUM,
      dueDate: amplifyTask.dueDate,
      projectId: amplifyTask.projectId,
      assignedTo: amplifyTask.assignedTo,
      tags: filterValidStrings(amplifyTask.tags),
      estimatedHours: amplifyTask.estimatedHours,
      actualHours: amplifyTask.actualHours,
      createdAt: amplifyTask.createdAt,
      updatedAt: amplifyTask.updatedAt,
      owner: amplifyTask.owner ?? undefined,
    };
  }, []);

  // Memoizar las tareas normalizadas
  const normalizedTasks = useMemo(() => 
    tasks.map(normalizeTask), 
    [tasks, normalizeTask]
  );

  const handleCreateTaskSubmit = useCallback(async (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: Date;
    tags?: string[];
  }) => {
    await createTask({ ...taskData, status: newTaskStatus });
    setShowNewTaskModal(false);
  }, [createTask, newTaskStatus]);

  const handleUpdateTask = useCallback(async (updates: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    tags?: string[];
  }) => {
    if (!editingTask) return;
    
    const amplifyUpdates = {
      ...updates,
      dueDate: updates.dueDate?.toISOString(),
    };
    await updateTask(editingTask.id, amplifyUpdates);
    setEditingTask(null);
  }, [editingTask, updateTask]);

  // Mostrar loading si Amplify no está inicializado
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400">
          {!initialized ? 'Configurando aplicación...' : 'Cargando tareas...'}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 sm:px-5 md:px-10 lg:px-20 xl:px-32 2xl:px-40">
      <div className="px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg ring-1 ring-red-500/20">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Tablero de Tareas
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Organiza y gestiona tus tareas de manera eficiente
            </p>
          </div>
          
          <button
            onClick={() => handleCreateTask(TaskStatus.TODO)}
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2.5 rounded-md flex items-center gap-2 transition-colors font-semibold shadow-xs"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nueva tarea</span>
          </button>
        </div>

        <div className="mb-6 text-sm text-gray-400">
          Total de tareas: <span className="text-white font-medium">{tasks.length}</span>
        </div>
      </div>

      {/* TaskBoard */}
      <TaskBoard
        tasks={normalizedTasks}
        onUpdateStatus={updateTaskStatus}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Modals */}
      {showNewTaskModal && (
        <NewTaskModal
          open={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          onCreate={handleCreateTaskSubmit}
          defaultStatus={newTaskStatus}
        />
      )}

      {editingTask && (
        <EditTaskModal
          open={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </main>
  );
}
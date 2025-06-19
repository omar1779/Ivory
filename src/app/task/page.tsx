"use client";

import { useState } from "react";
import { useTasks } from "@/lib/hooks/useTasks";
import { TaskStatus, TaskPriority, Task, AmplifyTask } from "@/lib/types/task";
import TaskBoard from "@/components/tasks/TaskBoard";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function TasksPage() {
  const { tasks, loading, createTask, updateTaskStatus, updateTask, deleteTask, error } = useTasks();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TODO);

  const handleCreateTask = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setShowNewTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      await deleteTask(taskId);
    }
  };

  // Función para normalizar las tareas de Amplify con tipos correctos
  const normalizeTask = (amplifyTask: AmplifyTask): Task => {
    // Función auxiliar para filtrar strings válidos de arrays nullable
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-6 py-8">
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

        <TaskBoard
          tasks={tasks.map(normalizeTask)}
          onUpdateStatus={updateTaskStatus}
          onCreateTask={handleCreateTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />

        <NewTaskModal
          open={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          onCreate={async (taskData: {
            title: string;
            description?: string;
            priority: TaskPriority;
            dueDate?: Date;
            tags?: string[];
          }) => {
            await createTask({ ...taskData, status: newTaskStatus });
            setShowNewTaskModal(false);
          }}
          defaultStatus={newTaskStatus}
        />

        {editingTask && (
          <EditTaskModal
            open={!!editingTask}
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdate={async (updates: {
              title?: string;
              description?: string;
              priority?: TaskPriority;
              dueDate?: Date;
              tags?: string[];
            }) => {
              // Convertir Date a string para Amplify
              const amplifyUpdates = {
                ...updates,
                dueDate: updates.dueDate?.toISOString(),
              };
              await updateTask(editingTask.id, amplifyUpdates);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
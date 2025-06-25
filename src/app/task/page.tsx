"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { PlusIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { useTasks } from '@/lib/hooks/useTasks';
import { useProjects } from '@/lib/hooks/useProjects';
import { TaskStatus, TaskPriority, Task } from '@/lib/types/task';
import { Project, ProjectWithTasksAndSubProjects } from '@/lib/types/project';
import dynamic from 'next/dynamic';

// Lazy loading de componentes pesados
const TaskBoard = dynamic(() => import('@/components/tasks/TaskBoard'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-800/50 rounded-lg p-4 space-y-4">
          <div className="h-8 bg-gray-700/50 rounded animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-24 bg-gray-800/70 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
});

const NewTaskModal = dynamic(
  () => import('@/components/tasks/NewTaskModal').then(mod => mod.default),
  { ssr: false }
);

const EditTaskModal = dynamic(
  () => import('@/components/tasks/EditTaskModal').then(mod => mod.default),
  { ssr: false }
);

const TaskProjectModal = dynamic<{
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description?: string) => Promise<boolean>;
  projects: Project[];
  onSelectProject: (projectId: string | null) => void;
}>(() => import('@/components/tasks/TaskProjectModal').then(mod => mod.TaskProjectModal), {
  ssr: false
});

export default function TasksPage() {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const setShowNewTaskModal = setIsNewTaskModalOpen; // Alias para compatibilidad
  const [selectedProject, setSelectedProject] = useState<Project | string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('Todas las tareas');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TODO);

  // Obtener tareas del hook useTasks
  const { tasks: amplifyTasks, loading: tasksLoading, createTask, updateTaskStatus, updateTask, deleteTask } = useTasks(
    selectedProject ? (typeof selectedProject === 'string' ? selectedProject : selectedProject.id) : undefined
  );

  // Convertir tareas de Amplify a formato Task para la UI
  const tasks = useMemo(() => {
    return (amplifyTasks || []).map(task => ({
      id: task.id,
      title: task.title || 'Sin título',
      description: task.description || undefined,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      dueDate: task.dueDate || undefined,
      projectId: task.projectId || undefined,
      tags: task.tags || [],
      estimatedHours: task.estimatedHours || undefined,
      actualHours: task.actualHours || undefined,
      createdAt: task.createdAt || undefined,
      updatedAt: task.updatedAt || undefined,
      owner: task.owner || undefined
    } as Task));
  }, [amplifyTasks]);

  // Filtrar tareas por proyecto seleccionado
  const filteredTasks = useMemo(() => {
    if (!selectedProject) return tasks;
    const projectId = typeof selectedProject === 'string' ? selectedProject : selectedProject.id;
    return tasks.filter(task => task?.projectId === projectId);
  }, [tasks, selectedProject]);

  // Filtrar tareas nulas y asegurar que tengan las propiedades mínimas requeridas
  const validTasks = useMemo(() => {
    return filteredTasks.filter((task): task is Task => {
      return (
        task !== null && 
        task !== undefined &&
        task.title !== undefined && 
        task.status !== undefined && 
        task.priority !== undefined
      );
    });
  }, [filteredTasks]);
  const { projects, loading: projectsLoading, createProject } = useProjects();

  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    try {
      await createProject({ name, description });
      return true;
    } catch (error) {
      console.error('Error creating project:', error);
      return false;
    }
  }, [createProject]);

  useEffect(() => {
    if (selectedProject) {
      if (typeof selectedProject === 'string') {
        const project = projects.find(p => p.id === selectedProject);
        if (project) {
          setSelectedProjectName(project.name);
          document.title = `Tareas - ${project.name}`;
        }
      } else {
        setSelectedProjectName(selectedProject.name);
        document.title = `Tareas - ${selectedProject.name}`;
      }
    } else {
      setSelectedProjectName('Todas las tareas');
      document.title = 'Tareas - Todas las tareas';
    }
  }, [selectedProject, projects]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleCreateTask = useCallback((status: TaskStatus) => {
    setNewTaskStatus(status);
    setIsNewTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }, [deleteTask]);

  const handleUpdateTask = useCallback(async (updates: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    dueDate?: Date | string | null;
    tags?: string[];
  }) => {
    if (!editingTask) return;
    
    try {
      // Formatear la fecha si es necesario
      const formattedUpdates: Record<string, any> = {
        ...updates
      };
      
      if ('dueDate' in updates) {
        formattedUpdates.dueDate = updates.dueDate instanceof Date ? 
          updates.dueDate.toISOString() : 
          updates.dueDate;
      }
      
      // Asegurarse de que description sea undefined en lugar de null
      if ('description' in updates) {
        formattedUpdates.description = updates.description || undefined;
      }
      
      await updateTask(editingTask.id, formattedUpdates);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error; // Re-lanzar para que el componente modal pueda manejarlo
    }
  }, [editingTask, updateTask]);

  const handleCreateTaskSubmit = useCallback(async (taskData: {
    title: string;
    description?: string | null;
    priority: TaskPriority;
    dueDate?: Date | string | null;
    tags?: string[];
    projectId?: string;
  }) => {
    try {
      const projectId = typeof selectedProject === 'string' ? selectedProject : selectedProject?.id;
      const taskInput: any = {
        title: taskData.title,
        description: taskData.description || undefined, // Asegurar que no sea null
        priority: taskData.priority,
        status: newTaskStatus,
        projectId,
        tags: taskData.tags || [],
      };
      
      if (taskData.dueDate) {
        taskInput.dueDate = taskData.dueDate instanceof Date ? 
          taskData.dueDate.toISOString() : 
          taskData.dueDate;
      }
      
      await createTask(taskInput);
      setIsNewTaskModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
    }
  }, [createTask, newTaskStatus, selectedProject]);

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
    } catch (error) {
      console.error('Error updating task status:', error);
      // Opcional: Mostrar un mensaje de error al usuario
      throw error; // Re-lanzar para que el componente TaskBoard pueda manejarlo
    }
  }, [updateTaskStatus]);

  if (tasksLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400">
          Cargando...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Tareas</h1>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">en</span>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {selectedProjectName}
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md border border-gray-600"
              >
                <FolderPlusIcon className="h-4 w-4 mr-2" />
                Proyectos
              </button>
              <button
                onClick={() => {
                  setNewTaskStatus(TaskStatus.TODO);
                  setIsNewTaskModalOpen(true);
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Tarea
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-900 sm:px-5 md:px-10 lg:px-20 xl:px-32 2xl:px-40">
        <div className="px-6 py-8">
          {validTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                {selectedProject ? 'No hay tareas en este proyecto' : 'No hay tareas'}
              </p>
              <button
                onClick={() => {
                  setNewTaskStatus(TaskStatus.TODO);
                  setIsNewTaskModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Crear mi primera tarea
              </button>
            </div>
          ) : (
            <TaskBoard
              tasks={validTasks}
              onUpdateStatus={handleTaskStatusChange}
              onCreateTask={() => {
                setNewTaskStatus(TaskStatus.TODO);
                setIsNewTaskModalOpen(true);
              }}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </div>
      </main>

      {/* Modales */}
      <NewTaskModal
        open={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onCreate={handleCreateTaskSubmit}
        defaultStatus={TaskStatus.TODO}
      />

      <TaskProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        projects={projects}
        onSelectProject={(projectId) => {
          const project = projects.find(p => p.id === projectId) || null;
          setSelectedProject(project);
          setIsProjectModalOpen(false);
        }}
      />

      {editingTask && (
        <EditTaskModal
          open={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  );
}
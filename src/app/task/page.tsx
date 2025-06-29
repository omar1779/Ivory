"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNotification } from '@/components/ui/NotificationProvider';
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
  onDeleteProject?: (projectId: string) => Promise<void>;
}>(() => import('@/components/tasks/TaskProjectModal').then(mod => mod.TaskProjectModal), {
  ssr: false
});

export default function TasksPage() {
  const { showSuccess, showError } = useNotification();
  const [deletedTasks, setDeletedTasks] = useState<Record<string, Task>>({});
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

  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    createProject,
    deleteProject,
    fetchProjects
  } = useProjects();

  // Convertir tareas de Amplify a formato Task para la UI
  const tasks = useMemo(() => {
    return (amplifyTasks || []).map(task => {
      const project = task.projectId ? projects?.find(p => p.id === task.projectId) : undefined;
      return {
        id: task.id,
        title: task.title || 'Sin título',
        description: task.description || undefined,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        dueDate: task.dueDate || undefined,
        projectId: task.projectId || undefined,
        project: project ? { name: project.name } : undefined,
        tags: task.tags || [],
        estimatedHours: task.estimatedHours || undefined,
        actualHours: task.actualHours || undefined,
        createdAt: task.createdAt || undefined,
        updatedAt: task.updatedAt || undefined,
        owner: task.owner || undefined
      } as Task & { project?: { name: string } };
    });
  }, [amplifyTasks, projects]);

  // Filtrar tareas por proyecto seleccionado
  const filteredTasks = useMemo(() => {
    if (!selectedProject) return tasks;
    // Si selectedProject es un string, es un ID, si es un objeto, es el proyecto completo
    const projectId = typeof selectedProject === 'string' ? selectedProject : selectedProject?.id;
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

  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    try {
      await createProject({ name, description });
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, [createProject, fetchProjects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProject(projectId);
      // Si el proyecto eliminado es el seleccionado, volver a "Todas las tareas"
      const selectedId = typeof selectedProject === 'string' ? selectedProject : selectedProject?.id;
      if (selectedId === projectId) {
        setSelectedProject(null);
      }
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [deleteProject, fetchProjects, selectedProject]);

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

  const handleUpdateTask = useCallback(async (updates: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | Date | null | undefined;
    tags?: string[];
  }) => {
    if (!editingTask?.id) return;
    
    try {
      // Crear una copia segura de los updates con tipos explícitos
      const formattedUpdates: Record<string, unknown> = {};
      
      // Copiar todas las propiedades excepto dueDate
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'dueDate' && value !== undefined) {
          formattedUpdates[key] = value;
        }
      }
      
      // Manejar la fecha de vencimiento
      if ('dueDate' in updates && updates.dueDate !== undefined) {
        const dueDateValue = updates.dueDate;
        if (dueDateValue) {
          try {
            let date: Date;
            
            if (dueDateValue instanceof Date) {
              date = dueDateValue;
            } else if (typeof dueDateValue === 'string') {
              date = new Date(dueDateValue);
            } else {
              // Si no es un Date ni un string, intentar convertirlo a string y luego a Date
              date = new Date(String(dueDateValue));
            }
            
            // Verificar si la fecha es válida
            if (!isNaN(date.getTime())) {
              formattedUpdates.dueDate = date.toISOString();
            } else if (typeof dueDateValue === 'string') {
              // Si es un string pero no una fecha válida, mantener el valor original
              formattedUpdates.dueDate = dueDateValue;
            } else {
              // Para cualquier otro caso, convertir a string
              formattedUpdates.dueDate = String(dueDateValue);
            }
          } catch (error) {
            console.error('Error al formatear la fecha:', error);
            // En caso de error, mantener el valor original como string
            formattedUpdates.dueDate = String(dueDateValue);
          }
        }
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

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return false;
    }
    
    try {
      const taskToDelete = tasks.find((t: Task) => t.id === taskId);
      if (!taskToDelete) return false;
      
      // Guardar la tarea eliminada temporalmente para posible recuperación
      setDeletedTasks((prev: Record<string, Task>) => ({
        ...prev,
        [taskId]: taskToDelete
      }));
      
      if (deleteTask) {
        await deleteTask(taskId);
        
        // Mostrar notificación de éxito
        if (showSuccess) {
          showSuccess('Tarea eliminada correctamente', {
            title: 'Tarea eliminada',
            onUndo: () => {
              // Aquí podríamos implementar la recuperación de la tarea
              console.log('Recuperar tarea:', taskToDelete);
            }
          });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting task:', error);
      if (showError) {
        showError('No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.');
      }
      return false;
    }
  }, [deleteTask, tasks, showSuccess, showError]);

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
      const taskInput: {
        title: string;
        description?: string;
        priority: TaskPriority;
        status: TaskStatus;
        projectId?: string;
        tags: string[];
        dueDate?: string;
      } = {
        title: taskData.title,
        description: taskData.description || undefined,
        priority: taskData.priority,
        status: newTaskStatus,
        projectId: projectId || undefined,
        tags: taskData.tags || [],
      };
      
      // Formatear la fecha de vencimiento si existe
      if (taskData.dueDate) {
        if (taskData.dueDate instanceof Date) {
          taskInput.dueDate = taskData.dueDate;
        } else if (typeof taskData.dueDate === 'string') {
          // Convertir string a Date
          const date = new Date(taskData.dueDate);
          if (!isNaN(date.getTime())) {
            taskInput.dueDate = date;
          }
        }
        // Si no es una fecha válida, no se asigna dueDate
      }
      
      const newTask = await createTask(taskInput);
      
      // Mostrar notificación de éxito
      showSuccess(`Tarea "${taskData.title}" creada correctamente`, {
        title: 'Tarea creada',
        onView: () => {
          // Aquí podrías implementar la navegación a la tarea
          console.log('Ver tarea creada:', newTask?.id);
        }
      });
      
      setIsNewTaskModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      showError('No se pudo crear la tarea. Por favor, inténtalo de nuevo.');
      return false;
    }
  }, [createTask, newTaskStatus, selectedProject, showSuccess, showError]);

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
              <h1 className="text-xl sm:text-2xl font-bold text-white break-words">Tareas</h1>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md border border-gray-600"
              >
                <FolderPlusIcon className="h-4 w-4 mr-2" />
                Proyectos
              </button>
              <button
                onClick={() => {
                  setNewTaskStatus(TaskStatus.TODO);
                  setIsNewTaskModalOpen(true);
                }}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
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
        projects={projects as any} // Type assertion since we're not using subProjects/tasks in the modal
        onSelectProject={(projectId) => {
          const project = projects.find(p => p.id === projectId) || null;
          setSelectedProject(project);
          setIsProjectModalOpen(false);
        }}
        onDeleteProject={handleDeleteProject}
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
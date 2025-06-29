"use client";

import { useState } from 'react';
import { Project } from '@/lib/types/project';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useNotification } from '@/components/ui/NotificationProvider';

export function TaskProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  projects,
  onSelectProject,
  onDeleteProject,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description?: string) => Promise<boolean>;
  projects: Project[];
  onSelectProject: (projectId: string | null) => void;
  onDeleteProject?: (projectId: string) => Promise<void>;
}) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const { showSuccess, showError, showSuccessWithUndo, showErrorWithRetry } = useNotification();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setIsCreating(true);
      const success = await onCreateProject(projectName.trim(), projectDescription.trim() || undefined);
      if (success) {
        setProjectName('');
        setProjectDescription('');
        setActiveTab('select');
        showSuccess('Proyecto creado correctamente');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showError('Error al crear el proyecto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    const projectName = projectToDelete.name;
    const projectId = projectToDelete.id;
    
    try {
      setIsDeleting(true);
      // @ts-ignore - La función onDeleteProject se añadirá como prop
      await onDeleteProject?.(projectId);
      
      // Mostrar notificación con opción de deshacer
      const handleUndo = async () => {
        try {
          // Aquí iría la lógica para restaurar el proyecto
          // Por ahora solo mostramos un mensaje
          showSuccess(`Proyecto "${projectName}" restaurado correctamente`, {
            title: 'Proyecto restaurado'
          });
        } catch (error) {
          console.error('Error al restaurar proyecto:', error);
          showError('No se pudo restaurar el proyecto. Por favor, inténtalo de nuevo.');
        }
      };

      const handleViewTrash = () => {
        // Navegar a la papelera o mostrar vista de eliminados
        console.log('Ver papelera');
      };

      // Mostrar notificación de éxito con opción de deshacer
      showSuccessWithUndo(
        `El proyecto "${projectName}" ha sido movido a la papelera.`,
        handleUndo,
        { 
          title: 'Proyecto eliminado',
          onView: handleViewTrash
        }
      );
      
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      
      const handleRetry = () => handleDeleteProject(projectToDelete);
      
      showErrorWithRetry(
        error instanceof Error ? error.message : 'No se pudo eliminar el proyecto',
        handleRetry,
        { title: 'Error al eliminar' }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Gestionar Proyectos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>


        <div className="mb-4 flex border-b border-gray-700">
          <button
            className={`flex-1 py-2 px-4 text-center font-medium ${
              activeTab === 'select'
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('select')}
          >
            Seleccionar
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center font-medium ${
              activeTab === 'create'
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Nuevo Proyecto
          </button>
        </div>

        {activeTab === 'select' ? (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <button
                onClick={() => {
                  onSelectProject(null);
                  onClose();
                }}
                className="w-full rounded-lg bg-gray-700 p-3 text-left text-white hover:bg-gray-600"
              >
                Todas las tareas
              </button>
              {projects.map((project) => (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => {
                      onSelectProject(project.id);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-gray-700 p-3 pr-10 text-left text-white hover:bg-gray-600"
                  >
                    <span>{project.name}</span>
                  </button>
                  {onDeleteProject && (
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 space-x-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                        className="rounded-full p-1 text-gray-400 hover:bg-red-900/30 hover:text-red-400"
                        title="Eliminar proyecto"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="mb-1 block text-sm font-medium text-gray-300">
                Nombre del Proyecto *
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nombre del proyecto"
                required
              />
            </div>
            <div>
              <label htmlFor="projectDescription" className="mb-1 block text-sm font-medium text-gray-300">
                Descripción (opcional)
              </label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Descripción del proyecto"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('select')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!projectName.trim() || isCreating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreating ? 'Creando...' : 'Crear Proyecto'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Diálogo de confirmación de eliminación */}
      {projectToDelete && onDeleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Eliminar proyecto</h3>
              <button
                onClick={() => setProjectToDelete(null)}
                className="text-gray-400 hover:text-white"
                disabled={isDeleting}
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <p className="mb-6 text-gray-300">
              ¿Estás seguro de que deseas eliminar el proyecto <span className="font-medium text-white">{projectToDelete.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

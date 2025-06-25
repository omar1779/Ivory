"use client";

import { useState } from 'react';
import { Project } from '@/lib/types/project';

export function TaskProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  projects,
  onSelectProject,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description?: string) => Promise<boolean>;
  projects: Project[];
  onSelectProject: (projectId: string | null) => void;
}) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setIsCreating(true);
      await onCreateProject(projectName.trim(), projectDescription.trim() || undefined);
      setProjectName('');
      setProjectDescription('');
      setActiveTab('select');
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
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
                <button
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-lg bg-gray-700 p-3 text-left text-white hover:bg-gray-600"
                >
                  <span>{project.name}</span>
                </button>
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
    </div>
  );
}

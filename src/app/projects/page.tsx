'use client';
import { useState } from 'react';
import { ProjectBoard } from '@/components/projects/ProjectBoard';
import { useProjects } from '@/lib/hooks/useProjects';
import { ProjectWithTasksAndSubProjects } from '@/lib/types/project';
import { useNotification } from '@/components/ui/NotificationProvider';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';

export default function ProjectsPage() {
  const { showSuccess, showError } = useNotification();
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    deleteProject 
  } = useProjects();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithTasksAndSubProjects | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (error) return <div className="flex items-center justify-center h-screen">Error: {error}</div>;

  // Convertir los proyectos a ProjectWithTasks
  const formattedProjects: ProjectWithTasksAndSubProjects[] = projects.map(project => ({
    ...project,
    tasks: [],
    subProjects: []
  }));

  const handleDeleteProject = async (project: ProjectWithTasksAndSubProjects) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      showSuccess(`Proyecto "${projectToDelete.name}" eliminado correctamente`);
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      showError(error instanceof Error ? error.message : 'Error al eliminar el proyecto');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ProjectBoard
        projects={formattedProjects}
        onCreateProject={async (projectData) => {
          try {
            await createProject(projectData);
            showSuccess('Proyecto creado correctamente');
          } catch (error) {
            console.error('Error al crear proyecto:', error);
            showError('Error al crear el proyecto');
            throw error;
          }
        }}
        onEditProject={() => {
          // TODO: Implement project editing functionality
        }}
        onDeleteProject={handleDeleteProject}
      />

      <DeleteProjectDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        projectName={projectToDelete?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

'use client'
import { ProjectBoard } from '@/components/projects/ProjectBoard';
import { useProjects } from '@/lib/hooks/useProjects';
import { Project } from '@/lib/types/project';

export default function ProjectsPage() {
  const { projects, loading, error, createProject, getProjectsWithTasks } = useProjects();

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (error) return <div className="flex items-center justify-center h-screen">Error: {error}</div>;

  // Obtener los proyectos con sus tareas asociadas
  const getProjectsWithTasksAsync = async (project: Project) => {
    try {
      const result = await getProjectsWithTasks(project.id);
      return result || project;
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      return project;
    }
  };

  const projectsWithTasks = projects.map(getProjectsWithTasksAsync);

  // Convertir los proyectos a ProjectWithTasks
  const formattedProjects = projects.map(project => ({
    ...project,
    tasks: [],
    subProjects: []
  }));

  return (
    <div className="container mx-auto py-8">
      <ProjectBoard
        projects={formattedProjects}
        onCreateProject={async (projectData) => {
          try {
            await createProject(projectData);
          } catch (error) {
            console.error('Error al crear proyecto:', error);
            throw error;
          }
        }}
        onEditProject={(project: Project) => {
          console.log('Editar proyecto:', project);
        }}
        onDeleteProject={(project: Project) => {
          console.log('Eliminar proyecto:', project);
        }}
      />
    </div>
  );
}

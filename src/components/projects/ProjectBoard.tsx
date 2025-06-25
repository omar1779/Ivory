
'use client'
import { Project, ProjectWithTasksAndSubProjects } from '@/lib/types/project';
import { ProjectCard } from './ProjectCard';
import { NewProjectModal } from './NewProjectModal';
import { useState } from 'react';

interface ProjectBoardProps {
  projects: ProjectWithTasksAndSubProjects[];
  onCreateProject: (projectData: { name: string; description?: string; parentProjectId?: string }) => Promise<void>;
  onEditProject?: (project: ProjectWithTasksAndSubProjects) => void;
  onDeleteProject?: (project: ProjectWithTasksAndSubProjects) => void;
}

export function ProjectBoard({ projects, onCreateProject, onEditProject, onDeleteProject }: ProjectBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderProjectTree = (projects: ProjectWithTasksAndSubProjects[], level = 0) => (
    <div key={projects[0]?.id} className={`space-y-4 ${level > 0 ? 'pl-4 border-l border-gray-200' : ''}`}>
      {projects.map(project => (
        <div key={project.id} className="space-y-2">
          <ProjectCard
            project={project}
            tasks={project.tasks || []}
            onEdit={() => onEditProject?.(project)}
            onDelete={() => onDeleteProject?.(project)}
          />
          {project.subProjects?.length ? renderProjectTree(project.subProjects, level + 1) : null}
        </div>
      ))}
    </div>
  );

  // Convertir los proyectos a un array plano para el selector de proyecto padre
  const getFlattenedProjects = (projects: ProjectWithTasksAndSubProjects[]): Project[] => {
    return projects.reduce<Project[]>((acc, project) => {
      acc.push({
        id: project.id,
        name: project.name,
        description: project.description,
        parentProjectId: project.parentProjectId,
        type: project.type,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        owner: project.owner
      });
      
      if (project.subProjects?.length) {
        acc.push(...getFlattenedProjects(project.subProjects));
      }
      
      return acc;
    }, []);
  };

  const flattenedProjects = getFlattenedProjects(projects);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Proyectos</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Nuevo Proyecto
        </button>
      </div>

      <div className="space-y-4">
        {renderProjectTree(projects)}
      </div>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onCreateProject}
        projects={flattenedProjects}
      />
    </div>
  );
}

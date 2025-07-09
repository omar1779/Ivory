'use client';

import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { 
  Project, 
  ProjectWithTasksAndSubProjects,
  ProjectType 
} from '@/lib/types/project';
import { Task, TaskStatus, TaskPriority } from '@/lib/types/task';
import { useAmplify } from '@/provider/AmplifyProvider';

type AmplifyClient = ReturnType<typeof generateClient<Schema>>;

export function useProjects() {
  const { initialized } = useAmplify();
  const [projects, setProjects] = useState<ProjectWithTasksAndSubProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<AmplifyClient | null>(null);

  // Inicializar el cliente de datos de Amplify
  useEffect(() => {
    if (initialized) {
      try {
        const dataClient = generateClient<Schema>();
        setClient(dataClient);
      } catch (err) {
        console.error('Error initializing data client:', err);
        setError('Error al inicializar el cliente de datos');
      }
    }
  }, [initialized]);

  const fetchProjects = useCallback(async () => {
    if (!client || !initialized) {
      console.log('Cliente no disponible, esperando inicialización...');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo proyectos...');
      const result = await client.models.Project.list();
      
      if (!result.data) {
        setProjects([]);
        return;
      }

      // Convertir los proyectos a ProjectWithTasksAndSubProjects
      const allProjects = result.data.map((project: Schema['Project']['type']) => ({
        id: project.id,
        name: project.name || 'Sin nombre',
        description: project.description || '',
        parentProjectId: project.parentProjectId || null,
        type: 'type' in project ? (project as { type?: ProjectType }).type as ProjectType : ProjectType.MAIN,
        status: (project.status as 'ACTIVE' | 'ARCHIVED') || 'ACTIVE',
        owner: project.owner || '',
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: project.updatedAt || new Date().toISOString(),
        tasks: [],
        subProjects: []
      } as ProjectWithTasksAndSubProjects));
      
      // Ordenar los proyectos por jerarquía
      const rootProjects = allProjects.filter((p: Project) => !p.parentProjectId);
      const projectsWithHierarchy = rootProjects.map((project: ProjectWithTasksAndSubProjects) => {
        const subProjects = allProjects.filter(
          (p: Project) => p.parentProjectId === project.id
        );
        return {
          ...project,
          subProjects
        };
      });

      setProjects(projectsWithHierarchy);
      console.log('Proyectos obtenidos:', projectsWithHierarchy.length);
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, [client, initialized]);

  // Crear un nuevo proyecto
  const createProject = useCallback(async (projectData: {
    name: string;
    description?: string;
    parentProjectId?: string;
  }) => {
    if (!client) {
      console.error('Error: Cliente de datos no inicializado');
      throw new Error('El cliente de datos no está inicializado');
    }

    try {
      console.log('Creando proyecto con datos:', projectData);
      
      // Solo incluimos los campos que están definidos en el esquema
      const projectInput = {
        name: projectData.name,
        status: 'ACTIVE' as const,
        type: (projectData.parentProjectId ? ProjectType.SUB : ProjectType.MAIN) as 'MAIN' | 'SUB',
        description: projectData.description || '',
        parentProjectId: projectData.parentProjectId || null,
      };

      console.log('Input del proyecto:', JSON.stringify(projectInput, null, 2));

      // Usamos el cliente directamente sin configurar authMode ya que eso ya está manejado por el proveedor
      const { data: newProject, errors } = await client.models.Project.create(projectInput as Parameters<typeof client.models.Project.create>[0]);

      console.log('Respuesta de la API:', { newProject, errors });

      if (errors && errors.length > 0) {
        const errorMessage = errors[0]?.message || 'Error desconocido al crear el proyecto';
        console.error('Error en la respuesta de la API:', errors);
        throw new Error(`Error al crear el proyecto: ${errorMessage}`);
      }

      if (!newProject) {
        throw new Error('No se recibió respuesta del servidor al crear el proyecto');
      }

      console.log('Proyecto creado exitosamente:', newProject);
      
      // Recargar la lista de proyectos
      await fetchProjects();
      return newProject;
      
    } catch (err) {
      console.error('Error en createProject:', {
        error: err,
        message: err instanceof Error ? err.message : 'Error desconocido',
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new Error(`Error al crear el proyecto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }, [client, fetchProjects]);

  const getProjectsWithTasks = useCallback(async (projectId: string) => {
    if (!client || !initialized) {
      throw new Error('Cliente no inicializado');
    }

    try {
      const projectResult = await client.models.Project.get({ id: projectId });
      if (!projectResult.data) return null;

      const tasksResult = await client.models.Task.list({
        filter: { projectId: { eq: projectId } }
      });

      // Get the actual data from the query results
      const projectData = projectResult.data;
      
      // Create a properly typed project object
      const formattedProject: ProjectWithTasksAndSubProjects = {
        id: projectData.id,
        name: projectData.name || 'Sin nombre',
        description: projectData.description || '',
        parentProjectId: projectData.parentProjectId || null,
        // Use type assertion with a fallback to MAIN
        type: ('type' in projectData ? (projectData as { type?: ProjectType }).type : ProjectType.MAIN) ?? ProjectType.MAIN,
        status: projectData.status as 'ACTIVE' | 'ARCHIVED' || 'ACTIVE',
        createdAt: projectData.createdAt || new Date().toISOString(),
        updatedAt: projectData.updatedAt || new Date().toISOString(),
        owner: projectData.owner || '',
        tasks: tasksResult.data?.map(taskData => {
          // Safely extract all task properties with proper types and fallbacks
          const task: Task = {
            id: taskData.id,
            title: taskData.title || 'Sin título',
            description: taskData.description || '',
            status: (taskData.status as TaskStatus) || 'PENDING',
            priority: (taskData.priority as TaskPriority) || TaskPriority.MEDIUM,
            dueDate: taskData.dueDate || null,
            projectId: taskData.projectId || null,
            owner: taskData.owner || '',
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: taskData.updatedAt || new Date().toISOString(),
            tags: Array.isArray(taskData.tags) 
              ? taskData.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null) 
              : [],
            completedAt: 'completedAt' in taskData ? (taskData as { completedAt?: string | null }).completedAt ?? null : null,
            estimatedHours: 'estimatedHours' in taskData ? (taskData as { estimatedHours?: number | null }).estimatedHours ?? null : null,
            actualHours: 'actualHours' in taskData ? (taskData as { actualHours?: number | null }).actualHours ?? null : null,
            assignedTo: 'assignedTo' in taskData ? (taskData as { assignedTo?: string | null }).assignedTo ?? null : null,
          };
          return task;
        }) || [],
        subProjects: [] // Initialize as empty, can be populated if needed
      };

      return formattedProject;
    } catch (err) {
      console.error('Error al obtener proyecto con tareas:', err);
      return null;
    }
  }, [client, initialized]);

  useEffect(() => {
    if (initialized && client) {
      fetchProjects();
    }
  }, [initialized, client, fetchProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!client || !initialized) {
      throw new Error('Cliente no inicializado');
    }

    try {
      // Primero, verificar si el proyecto tiene tareas asociadas
      const tasksResult = await client.models.Task.list({
        filter: { projectId: { eq: projectId } }
      });

      if (tasksResult.data && tasksResult.data.length > 0) {
        // Opción: Podríamos ofrecer la opción de eliminar las tareas también
        throw new Error('No se puede eliminar el proyecto porque tiene tareas asociadas');
      }

      // Si no hay tareas, proceder con la eliminación
      await client.models.Project.delete({
        id: projectId
      });

      // Actualizar la lista de proyectos
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      throw error;
    }
  }, [client, initialized, fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    deleteProject,
    getProjectsWithTasks
  };
}

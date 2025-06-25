'use client';

import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { 
  Project, 
  ProjectType, 
  ProjectWithTasksAndSubProjects 
} from '@/lib/types/project';
import { useAmplify } from '@/provider/AmplifyProvider';

export function useProjects() {
  const { initialized } = useAmplify();
  const [projects, setProjects] = useState<ProjectWithTasksAndSubProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);

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
      const allProjects = result.data.map((project: any) => ({
        ...project,
        tasks: [],
        subProjects: []
      }));
      
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
      const projectInput: Record<string, any> = {
        name: projectData.name,
      };

      // Agregamos campos opcionales solo si tienen valor
      if (projectData.description) {
        projectInput.description = projectData.description;
      }
      
      if (projectData.parentProjectId) {
        projectInput.parentProjectId = projectData.parentProjectId;
      }

      console.log('Input del proyecto:', JSON.stringify(projectInput, null, 2));

      // Usamos el cliente directamente sin configurar authMode ya que eso ya está manejado por el proveedor
      const { data: newProject, errors } = await client.models.Project.create(projectInput);

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

      return {
        ...projectResult.data,
        tasks: tasksResult.data || [],
        subProjects: []
      } as ProjectWithTasksAndSubProjects;
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

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    getProjectsWithTasks
  };
}

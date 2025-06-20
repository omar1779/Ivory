"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TaskStatus, TaskPriority, AmplifyTask } from '@/lib/types/task';
import { useAmplify } from '@/provider/AmplifyProvider';

export function useTasks(projectId?: string) {
  const { initialized } = useAmplify();
  const [tasks, setTasks] = useState<AmplifyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Solo crear el cliente cuando Amplify esté inicializado
  const client = useMemo(() => {
    if (!initialized) return null;
    try {
      return generateClient<Schema>();
    } catch (error) {
      console.error('Error generating client:', error);
      setError('Error de configuración de Amplify');
      return null;
    }
  }, [initialized]);

  const fetchTasks = useCallback(async () => {
    if (!client || !initialized) {
      console.log('Cliente no disponible, esperando inicialización...');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo tareas...');
      const result = projectId 
        ? await client.models.Task.list({
            filter: { projectId: { eq: projectId } }
          })
        : await client.models.Task.list();
      
      setTasks(result.data || []);
      console.log('Tareas obtenidas:', result.data?.length || 0);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, [client, initialized, projectId]);

  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    projectId?: string;
    tags?: string[];
  }) => {
    if (!client) {
      throw new Error('Cliente no disponible');
    }

    try {
      console.log('Creando tarea:', taskData);
      const result = await client.models.Task.create({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'TODO',
        priority: taskData.priority || 'MEDIUM',
        dueDate: taskData.dueDate?.toISOString(),
        projectId: taskData.projectId,
        tags: taskData.tags,
      });
      
      if (result.data) {
        setTasks(prev => [...prev, result.data as AmplifyTask]);
        console.log('Tarea creada exitosamente:', result.data);
        return result.data as AmplifyTask;
      }
    } catch (err) {
      console.error('Error al crear tarea:', err);
      setError(err instanceof Error ? err.message : 'Error al crear tarea');
      throw err;
    }
  }, [client]);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<AmplifyTask, 'id' | 'createdAt' | 'updatedAt' | 'owner'>>) => {
    if (!client) {
      throw new Error('Cliente no disponible');
    }

    try {
      console.log('Actualizando tarea:', id, updates);
      const result = await client.models.Task.update({
        id,
        ...updates,
      });
      
      if (result.data) {
        setTasks(prev => prev.map(task => 
          task.id === id ? (result.data as AmplifyTask) : task
        ));
        console.log('Tarea actualizada:', result.data);
        return result.data;
      }
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
      throw err;
    }
  }, [client]);

  const deleteTask = useCallback(async (id: string) => {
    if (!client) {
      throw new Error('Cliente no disponible');
    }

    try {
      console.log('Eliminando tarea:', id);
      await client.models.Task.delete({ id });
      setTasks(prev => prev.filter(task => task.id !== id));
      console.log('Tarea eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar tarea');
      throw err;
    }
  }, [client]);

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    // Actualización optimista inmediata
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status } : task
    ));
    
    try {
      await updateTask(id, { status });
    } catch (err) {
      // Revertir en caso de error
      console.error('Error al actualizar estado, revirtiendo:', err);
      await fetchTasks();
      throw err;
    }
  }, [updateTask, fetchTasks]);

  // Efecto para cargar tareas cuando Amplify esté inicializado
  useEffect(() => {
    if (initialized && client) {
      console.log('Amplify inicializado, cargando tareas...');
      fetchTasks();
    }
  }, [initialized, client, fetchTasks]);

  const memoizedReturn = useMemo(() => ({
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refetch: fetchTasks,
    initialized, // Agregar esto para debugging
  }), [tasks, loading, error, createTask, updateTask, deleteTask, updateTaskStatus, fetchTasks, initialized]);

  return memoizedReturn;
}
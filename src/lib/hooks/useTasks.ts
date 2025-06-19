"use client";

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TaskStatus, TaskPriority } from '@/lib/types/task';

type AmplifyTask = Schema['Task']['type'];

const client = generateClient<Schema>();

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<AmplifyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      let result;
      
      if (projectId) {
        result = await client.models.Task.list({
          filter: { projectId: { eq: projectId } }
        });
      } else {
        result = await client.models.Task.list();
      }
      
      setTasks(result.data || []);
      console.log('Tareas cargadas desde Amplify:', result.data);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createTask = async (taskData: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    projectId?: string;
    tags?: string[];
  }) => {
    try {
      console.log('Creando tarea en Amplify:', taskData);
      
      const result = await client.models.Task.create({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'TODO',
        priority: taskData.priority || 'MEDIUM',
        dueDate: taskData.dueDate?.toISOString(),
        projectId: taskData.projectId,
        tags: taskData.tags,
      });
      
      console.log('Tarea creada exitosamente:', result.data);
      
      if (result.data) {
        // Ensure result.data is always an array
        const newTasks = Array.isArray(result.data) ? result.data : [result.data];
        setTasks(prev => [...prev, ...newTasks]);
        return result.data;
      }
    } catch (err) {
      console.error('Error al crear tarea:', err);
      setError(err instanceof Error ? err.message : 'Error al crear tarea');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<AmplifyTask>) => {
    try {
      console.log('Actualizando tarea:', id, updates);
      
      const result = await client.models.Task.update({
        id,
        ...updates,
        dueDate: updates.dueDate?.toString(),
      });
      
      console.log('Tarea actualizada:', result.data);
      
      if (result.data) {
        setTasks(prev => prev.map(task => 
          task.id === id ? (result.data as AmplifyTask) : task
        ));
        return result.data;
      }
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
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
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    // Actualización optimista para UI más fluida
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status } : task
    ));
    
    try {
      await updateTask(id, { status });
    } catch (err) {
      // Revertir cambio optimista si falla
      await fetchTasks();
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refetch: fetchTasks,
  };
}
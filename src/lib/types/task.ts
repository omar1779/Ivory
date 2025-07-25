import type { Schema } from '../../../amplify/data/resource';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Tipo real que devuelve Amplify
export type AmplifyTask = Schema['Task']['type'];

// Tipo normalizado para usar en la UI
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
  owner: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  tags: string[];
  completedAt?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
}
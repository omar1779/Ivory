import type { Task, TaskPriority } from './task';

export enum ProjectType {
  MAIN = 'MAIN',
  SUB = 'SUB'
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  parentProjectId?: string | null;
  type: ProjectType;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  owner: string;
}

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export interface ProjectWithSubProjects extends Project {
  subProjects: ProjectWithTasksAndSubProjects[];
}

export interface ProjectWithTasksAndSubProjects extends Project {
  tasks: Task[];
  subProjects: ProjectWithTasksAndSubProjects[];
}

export interface Reminder {
  id: string;
  taskId: string;
  projectId?: string;
  date: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriorityGroup {
  priority: TaskPriority;
  tasks: Task[];
  count: number;
}

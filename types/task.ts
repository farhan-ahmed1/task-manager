// types/task.ts
// Task model and related types for the Task Manager app

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  project_id?: string; // Optional for now, can be null for personal tasks
  section_id?: string; // Optional section for organizing tasks
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date;
  project_id?: string; // Optional project association
  section_id?: string; // Optional section association
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date;
  section_id?: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Section {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  collapsed: boolean;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSectionDto {
  name: string;
  project_id?: string;
}

export interface UpdateSectionDto {
  name?: string;
  collapsed?: boolean;
  order_index?: number;
}

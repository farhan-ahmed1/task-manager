import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, Project } from '@/types/api';

interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTasks: () => void;
}

interface ProjectStore {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  setSelectedProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProjects: () => void;
}

export const useTaskStore = create<TaskStore>()(
  devtools(
    (set) => ({
      tasks: [],
      selectedTask: null,
      isLoading: false,
      error: null,

      setTasks: (tasks) => set({ tasks }, false, 'setTasks'),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] }), false, 'addTask'),
      updateTask: (taskId, updates) =>
        set(
          (state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
            selectedTask:
              state.selectedTask?.id === taskId
                ? { ...state.selectedTask, ...updates }
                : state.selectedTask,
          }),
          false,
          'updateTask'
        ),
      removeTask: (taskId) =>
        set(
          (state) => ({
            tasks: state.tasks.filter((task) => task.id !== taskId),
            selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
          }),
          false,
          'removeTask'
        ),
      setSelectedTask: (task) => set({ selectedTask: task }, false, 'setSelectedTask'),
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearTasks: () => set({ tasks: [], selectedTask: null }, false, 'clearTasks'),
    }),
    {
      name: 'task-store',
    }
  )
);

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set) => ({
      projects: [],
      selectedProject: null,
      isLoading: false,
      error: null,

      setProjects: (projects) => set({ projects }, false, 'setProjects'),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] }), false, 'addProject'),
      updateProject: (projectId, updates) =>
        set(
          (state) => ({
            projects: state.projects.map((project) =>
              project.id === projectId ? { ...project, ...updates } : project
            ),
            selectedProject:
              state.selectedProject?.id === projectId
                ? { ...state.selectedProject, ...updates }
                : state.selectedProject,
          }),
          false,
          'updateProject'
        ),
      removeProject: (projectId) =>
        set(
          (state) => ({
            projects: state.projects.filter((project) => project.id !== projectId),
            selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject,
          }),
          false,
          'removeProject'
        ),
      setSelectedProject: (project) => set({ selectedProject: project }, false, 'setSelectedProject'),
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearProjects: () => set({ projects: [], selectedProject: null }, false, 'clearProjects'),
    }),
    {
      name: 'project-store',
    }
  )
);
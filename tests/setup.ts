/**
 * Test setup file for Jest
 * Configures global test environment and utilities
 */

import type { CreateTaskDto, UpdateTaskDto } from '../types/task';
import type { UpdateProjectDto } from '../src/validation/project';

// Set test environment variables
process.env.NODE_ENV = 'test';
// Use a strong-looking 64-character test JWT secret (meets all validation requirements)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2';
process.env.JWT_EXPIRES = '1h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'taskmanager_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.PORT = '3000';

// Global test timeout
jest.setTimeout(30000);

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockPipeline = {
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn(() =>
      Promise.resolve([
        [null, 1],
        [null, 1],
      ]),
    ),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
    pipeline: jest.fn(() => mockPipeline),
    on: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    decr: jest.fn(),
    keys: jest.fn(() => Promise.resolve([])),
  };
  return jest.fn(() => mockRedis);
});

// Mock PostgreSQL pool for testing
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };

  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve(mockClient)),
    end: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mockPool),
    Client: jest.fn(() => mockClient),
  };
});

// In-memory data store for mocked database
interface MockUser {
  id: string;
  email: string;
  name?: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface MockTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

interface MockProject {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface MockTaskAssignment {
  task_id: string;
  user_id: string;
}

const mockUsers: MockUser[] = [];
const mockTasks: MockTask[] = [];
const mockProjects: MockProject[] = [];
const mockTaskAssignments: MockTaskAssignment[] = [];

// Helper function to generate proper UUID v4 strings
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock database repository functions
jest.mock('../src/db/repository', () => {
  return {
    // User functions
    createUser: jest.fn((email: string, passwordHash: string, name?: string) => {
      const user = {
        id: generateUUID(),
        email,
        name: name || undefined,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockUsers.push(user);
      return Promise.resolve({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }),

    getUserByEmail: jest.fn((email: string) => {
      const user = mockUsers.find((u) => u.email === email);
      return Promise.resolve(user || null);
    }),

    getUserById: jest.fn((id: string) => {
      const user = mockUsers.find((u) => u.id === id);
      return Promise.resolve(user || null);
    }),

    // Task functions
    createTask: jest.fn((userId: string, taskData: CreateTaskDto) => {
      const task = {
        id: generateUUID(),
        title: taskData.title,
        description: taskData.description || undefined,
        status: taskData.status || 'PENDING',
        priority: taskData.priority || 'MEDIUM',
        due_date: taskData.due_date ? taskData.due_date.toISOString() : undefined,
        project_id: taskData.project_id || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockTasks.push(task);
      mockTaskAssignments.push({ task_id: task.id, user_id: userId });
      return Promise.resolve(task);
    }),

    getTasks: jest.fn((userId: string) => {
      const userTaskIds = mockTaskAssignments
        .filter((ta) => ta.user_id === userId)
        .map((ta) => ta.task_id);
      const userTasks = mockTasks.filter((task) => userTaskIds.includes(task.id));
      return Promise.resolve(userTasks);
    }),

    getTaskById: jest.fn((userId: string, taskId: string) => {
      const assignment = mockTaskAssignments.find(
        (ta) => ta.user_id === userId && ta.task_id === taskId,
      );
      if (!assignment) return Promise.resolve(null);
      const task = mockTasks.find((t) => t.id === taskId);
      return Promise.resolve(task || null);
    }),

    updateTask: jest.fn((userId: string, taskId: string, updates: UpdateTaskDto) => {
      const assignment = mockTaskAssignments.find(
        (ta) => ta.user_id === userId && ta.task_id === taskId,
      );
      if (!assignment) return Promise.resolve(null);

      const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return Promise.resolve(null);

      const processedUpdates = {
        ...updates,
        due_date: updates.due_date ? updates.due_date.toISOString() : updates.due_date,
      };
      mockTasks[taskIndex] = {
        ...mockTasks[taskIndex],
        ...processedUpdates,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve(mockTasks[taskIndex]);
    }),

    deleteTask: jest.fn((userId: string, taskId: string) => {
      const assignmentIndex = mockTaskAssignments.findIndex(
        (ta) => ta.user_id === userId && ta.task_id === taskId,
      );
      if (assignmentIndex === -1) return Promise.resolve(false);

      mockTaskAssignments.splice(assignmentIndex, 1);
      const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1);
      }
      return Promise.resolve(true);
    }),

    // Project functions
    createProject: jest.fn((ownerId: string, name: string, description?: string) => {
      const project = {
        id: generateUUID(),
        name,
        description: description || undefined,
        owner_id: ownerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProjects.push(project);
      return Promise.resolve(project);
    }),

    getProjectsForOwner: jest.fn((ownerId: string) => {
      const userProjects = mockProjects.filter((p) => p.owner_id === ownerId);
      return Promise.resolve(userProjects);
    }),

    getProjectById: jest.fn((ownerId: string, projectId: string) => {
      const project = mockProjects.find((p) => p.id === projectId && p.owner_id === ownerId);
      return Promise.resolve(project || null);
    }),

    updateProject: jest.fn((ownerId: string, projectId: string, updates: UpdateProjectDto) => {
      const projectIndex = mockProjects.findIndex(
        (p) => p.id === projectId && p.owner_id === ownerId,
      );
      if (projectIndex === -1) return Promise.resolve(null);

      mockProjects[projectIndex] = {
        ...mockProjects[projectIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve(mockProjects[projectIndex]);
    }),

    deleteProject: jest.fn((ownerId: string, projectId: string) => {
      const projectIndex = mockProjects.findIndex(
        (p) => p.id === projectId && p.owner_id === ownerId,
      );
      if (projectIndex === -1) return Promise.resolve(false);

      mockProjects.splice(projectIndex, 1);
      return Promise.resolve(true);
    }),

    getTasksByProject: jest.fn((userId: string, projectId: string) => {
      const userTaskIds = mockTaskAssignments
        .filter((ta) => ta.user_id === userId)
        .map((ta) => ta.task_id);
      const projectTasks = mockTasks.filter(
        (task) => userTaskIds.includes(task.id) && task.project_id === projectId,
      );
      return Promise.resolve(projectTasks);
    }),

    getTasksByFilter: jest.fn((userId: string, projectId?: string, status?: string) => {
      const userTaskIds = mockTaskAssignments
        .filter((ta) => ta.user_id === userId)
        .map((ta) => ta.task_id);
      let userTasks = mockTasks.filter((task) => userTaskIds.includes(task.id));

      if (projectId) {
        userTasks = userTasks.filter((task) => task.project_id === projectId);
      }
      if (status) {
        userTasks = userTasks.filter((task) => task.status === status);
      }

      return Promise.resolve(userTasks);
    }),

    getProjectStats: jest.fn((ownerId: string, projectId: string) => {
      const projectTasks = mockTasks.filter((task) => {
        const assignment = mockTaskAssignments.find(
          (ta) => ta.user_id === ownerId && ta.task_id === task.id,
        );
        return assignment && task.project_id === projectId;
      });

      const stats = projectTasks.reduce((acc: Record<string, number>, task: MockTask) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      return Promise.resolve({
        PENDING: stats.PENDING || 0,
        IN_PROGRESS: stats.IN_PROGRESS || 0,
        COMPLETED: stats.COMPLETED || 0,
      });
    }),
  };
});

// Clear mock data at the start of each test file (not between individual tests)
// This allows sequential tests within the same file to share data while
// ensuring test files are isolated from each other
let lastTestFile = '';
beforeEach(() => {
  const currentTestFile = expect.getState().testPath || '';
  if (currentTestFile !== lastTestFile) {
    mockUsers.length = 0;
    mockTasks.length = 0;
    mockProjects.length = 0;
    mockTaskAssignments.length = 0;
    lastTestFile = currentTestFile;
  }
});

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
import jwt from 'jsonwebtoken';

export const testUtils = {
  createAuthToken: (userId: string): string => {
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
    return jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
  },
  createMockUser: () => ({
    id: 'user-' + Math.random().toString(36).substring(2, 15),
    email: `test${Math.random().toString(36).substring(2, 5)}@example.com`,
    name: 'Test User',
  }),
  createMockTask: () => ({
    id: 'task-' + Math.random().toString(36).substring(2, 15),
    title: 'Test Task ' + Math.random().toString(36).substring(2, 8),
    description: 'Test task description',
  }),
  createMockProject: () => ({
    id: 'project-' + Math.random().toString(36).substring(2, 15),
    name: 'Test Project ' + Math.random().toString(36).substring(2, 8),
    description: 'Test project description',
  }),
};

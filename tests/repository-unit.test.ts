/**
 * Repository unit tests using isolated pool mock
 * Tests the real repository.ts functions while mocking only the database layer
 *
 * This test bypasses the global mocks in setup.ts to test the actual repository logic
 */
import { CreateTaskDto, UpdateTaskDto } from '../types/task';

// Type definitions for mocking
type QueryResult<R = unknown> = {
  rows: R[];
  rowCount: number;
};

// Clear any existing repository mock from setup.ts
jest.unmock('../src/db/repository');

// Mock pool directly in the test with a factory function
const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

jest.doMock('../src/db/pool', () => mockPool);

// Dynamic import to ensure mocking happens first
let repo: typeof import('../src/db/repository');

// Helper types for database row structures
type TaskRow = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
};

type UserRow = {
  id: string;
  email: string;
  name?: string;
  password_hash?: string;
};

type ProjectRow = {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
};

// Helper function to create mock query results
function createQueryResult<R>(rows: R[], rowCount?: number): QueryResult<R> {
  return { rows, rowCount: rowCount ?? rows.length };
}

describe('Repository', () => {
  beforeAll(async () => {
    // Import the repository after the mock is set up
    repo = await import('../src/db/repository');
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('Task Operations', () => {
    describe('createTask', () => {
      it('should create a task with default values and assign to user', async () => {
        const mockTask: TaskRow = {
          id: 'task-1',
          project_id: null,
          title: 'Test Task',
          description: null,
          status: 'PENDING',
          priority: 'MEDIUM',
          due_date: null,
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        };

        // Mock the task creation query
        mockQuery
          .mockResolvedValueOnce(createQueryResult([mockTask]))
          // Mock the assignment query
          .mockResolvedValueOnce(createQueryResult([]));

        const taskData: CreateTaskDto = {
          title: 'Test Task',
        };

        const result = await repo.createTask('user-1', taskData);

        expect(mockQuery).toHaveBeenCalledTimes(2);
        // Verify task creation query
        const [insertSql, insertParams] = mockQuery.mock.calls[0];
        expect(String(insertSql)).toMatch(/INSERT INTO tasks/i);
        expect(insertParams).toEqual([
          null, // project_id (default)
          'Test Task', // title
          null, // description (default)
          'PENDING', // status (default)
          'MEDIUM', // priority (default)
          null, // due_date (default)
        ]);

        // Verify assignment query
        const [assignSql, assignParams] = mockQuery.mock.calls[1];
        expect(String(assignSql)).toMatch(/INSERT INTO task_assignments/i);
        expect(assignParams).toEqual(['task-1', 'user-1']);

        expect(result).toEqual(mockTask);
      });

      it('should create a task with custom values', async () => {
        const dueDate = new Date('2025-12-31');
        const mockTask: TaskRow = {
          id: 'task-2',
          project_id: 'project-1',
          title: 'Custom Task',
          description: 'Custom description',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          due_date: dueDate,
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        };

        mockQuery
          .mockResolvedValueOnce(createQueryResult([mockTask]))
          .mockResolvedValueOnce(createQueryResult([]));

        const taskData: CreateTaskDto = {
          title: 'Custom Task',
          description: 'Custom description',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          due_date: dueDate,
          project_id: 'project-1',
        };

        const result = await repo.createTask('user-1', taskData);

        const [, insertParams] = mockQuery.mock.calls[0];
        expect(insertParams).toEqual([
          'project-1',
          'Custom Task',
          'Custom description',
          'IN_PROGRESS',
          'HIGH',
          dueDate,
        ]);

        expect(result).toEqual(mockTask);
      });

      it('should propagate database errors', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

        const taskData: CreateTaskDto = {
          title: 'Test Task',
        };

        await expect(repo.createTask('user-1', taskData)).rejects.toThrow(
          'Database connection failed',
        );
      });
    });

    describe('getTasks', () => {
      it('should return tasks for a user', async () => {
        const mockTasks: TaskRow[] = [
          {
            id: 'task-1',
            project_id: null,
            title: 'Task 1',
            description: null,
            status: 'PENDING',
            priority: 'MEDIUM',
            due_date: null,
            created_at: new Date('2025-01-01T00:00:00Z'),
            updated_at: new Date('2025-01-01T00:00:00Z'),
          },
          {
            id: 'task-2',
            project_id: 'project-1',
            title: 'Task 2',
            description: 'Description',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            due_date: new Date('2025-12-31'),
            created_at: new Date('2025-01-02T00:00:00Z'),
            updated_at: new Date('2025-01-02T00:00:00Z'),
          },
        ];

        mockQuery.mockResolvedValueOnce(createQueryResult(mockTasks));

        const result = await repo.getTasks('user-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/SELECT t\.\* FROM tasks t/i);
        expect(String(sql)).toMatch(/JOIN task_assignments ta/i);
        expect(String(sql)).toMatch(/ORDER BY t\.created_at DESC/i);
        expect(params).toEqual(['user-1']);
        expect(result).toEqual(mockTasks);
      });

      it('should return empty array when user has no tasks', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getTasks('user-1');

        expect(result).toEqual([]);
      });
    });

    describe('getTaskById', () => {
      it('should return a task when found', async () => {
        const mockTask: TaskRow = {
          id: 'task-1',
          project_id: null,
          title: 'Test Task',
          description: null,
          status: 'PENDING',
          priority: 'MEDIUM',
          due_date: null,
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockTask]));

        const result = await repo.getTaskById('user-1', 'task-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/WHERE ta\.user_id = \$1 AND t\.id = \$2/i);
        expect(params).toEqual(['user-1', 'task-1']);
        expect(result).toEqual(mockTask);
      });

      it('should return null when task not found', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getTaskById('user-1', 'nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('updateTask', () => {
      it('should update task fields dynamically', async () => {
        const updatedTask: TaskRow = {
          id: 'task-1',
          project_id: null,
          title: 'Updated Task',
          description: 'Updated description',
          status: 'COMPLETED',
          priority: 'HIGH',
          due_date: null,
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-02T00:00:00Z'),
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([updatedTask]));

        const updates: UpdateTaskDto = {
          title: 'Updated Task',
          description: 'Updated description',
          status: 'COMPLETED',
          priority: 'HIGH',
        };

        const result = await repo.updateTask('user-1', 'task-1', updates);

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        // Verify SQL structure
        expect(String(sql)).toMatch(/UPDATE tasks SET/i);
        expect(String(sql)).toMatch(/title = \$1/i);
        expect(String(sql)).toMatch(/description = \$2/i);
        expect(String(sql)).toMatch(/status = \$3/i);
        expect(String(sql)).toMatch(/priority = \$4/i);
        expect(String(sql)).toMatch(/updated_at = \$5/i);
        expect(String(sql)).toMatch(/WHERE id = \$6/i);

        // Verify parameters (excluding the dynamic updated_at Date)
        expect(params?.[0]).toBe('Updated Task');
        expect(params?.[1]).toBe('Updated description');
        expect(params?.[2]).toBe('COMPLETED');
        expect(params?.[3]).toBe('HIGH');
        expect(params?.[4]).toBeInstanceOf(Date);
        expect(params?.[5]).toBe('task-1');
        expect(params?.[6]).toBe('user-1');

        expect(result).toEqual(updatedTask);
      });

      it('should return null when no fields to update', async () => {
        const result = await repo.updateTask('user-1', 'task-1', {});

        expect(mockQuery).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });

      it('should return null when task not found or not owned by user', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const updates: UpdateTaskDto = {
          title: 'Updated Task',
        };

        const result = await repo.updateTask('user-1', 'nonexistent', updates);

        expect(result).toBeNull();
      });
    });

    describe('deleteTask', () => {
      it('should delete task and return true when successful', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([{ id: 'task-1' }], 1));

        const result = await repo.deleteTask('user-1', 'task-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/DELETE FROM tasks/i);
        expect(String(sql)).toMatch(/RETURNING id/i);
        expect(params).toEqual(['task-1', 'user-1']);
        expect(result).toBe(true);
      });

      it('should return false when task not found or not owned by user', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([], 0));

        const result = await repo.deleteTask('user-1', 'nonexistent');

        expect(result).toBe(false);
      });
    });
  });

  describe('User Operations', () => {
    describe('createUser', () => {
      it('should create a user with required fields', async () => {
        const mockUser: UserRow = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

        const result = await repo.createUser('test@example.com', 'hashedpassword', 'Test User');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/INSERT INTO users/i);
        expect(params).toEqual(['test@example.com', 'hashedpassword', 'Test User']);
        expect(result).toEqual(mockUser);
      });

      it('should create a user without optional name', async () => {
        const mockUser: UserRow = {
          id: 'user-1',
          email: 'test@example.com',
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

        const result = await repo.createUser('test@example.com', 'hashedpassword');

        const [, params] = mockQuery.mock.calls[0];
        expect(params).toEqual(['test@example.com', 'hashedpassword', undefined]);
        expect(result).toEqual(mockUser);
      });
    });

    describe('getUserByEmail', () => {
      it('should return user with password hash when found', async () => {
        const mockUser: UserRow & { password_hash: string } = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          password_hash: 'hashedpassword',
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

        const result = await repo.getUserByEmail('test@example.com');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/SELECT id, email, name, password_hash/i);
        expect(params).toEqual(['test@example.com']);
        expect(result).toEqual(mockUser);
      });

      it('should return undefined when user not found', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getUserByEmail('nonexistent@example.com');

        expect(result).toBeUndefined();
      });
    });

    describe('getUserById', () => {
      it('should return user without password hash when found', async () => {
        const mockUser: UserRow = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

        const result = await repo.getUserById('user-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/SELECT id, email, name FROM users/i);
        expect(String(sql)).not.toMatch(/password_hash/i);
        expect(params).toEqual(['user-1']);
        expect(result).toEqual(mockUser);
      });

      it('should return undefined when user not found', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getUserById('nonexistent');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Project Operations', () => {
    describe('createProject', () => {
      it('should create a project with required fields', async () => {
        const mockProject: ProjectRow = {
          id: 'project-1',
          owner_id: 'user-1',
          name: 'Test Project',
          description: 'Test Description',
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockProject]));

        const result = await repo.createProject('user-1', 'Test Project', 'Test Description');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/INSERT INTO projects/i);
        expect(params).toEqual(['user-1', 'Test Project', 'Test Description']);
        expect(result).toEqual(mockProject);
      });

      it('should create a project without optional description', async () => {
        const mockProject: ProjectRow = {
          id: 'project-1',
          owner_id: 'user-1',
          name: 'Test Project',
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockProject]));

        const result = await repo.createProject('user-1', 'Test Project');

        const [, params] = mockQuery.mock.calls[0];
        expect(params).toEqual(['user-1', 'Test Project', undefined]);
        expect(result).toEqual(mockProject);
      });
    });

    describe('getProjectsForOwner', () => {
      it('should return projects for owner ordered by created_at DESC', async () => {
        const mockProjects: ProjectRow[] = [
          {
            id: 'project-2',
            owner_id: 'user-1',
            name: 'Project 2',
            created_at: new Date('2025-01-02T00:00:00Z'),
            updated_at: new Date('2025-01-02T00:00:00Z'),
          },
          {
            id: 'project-1',
            owner_id: 'user-1',
            name: 'Project 1',
            created_at: new Date('2025-01-01T00:00:00Z'),
            updated_at: new Date('2025-01-01T00:00:00Z'),
          },
        ];

        mockQuery.mockResolvedValueOnce(createQueryResult(mockProjects));

        const result = await repo.getProjectsForOwner('user-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/SELECT \* FROM projects WHERE owner_id = \$1/i);
        expect(String(sql)).toMatch(/ORDER BY created_at DESC/i);
        expect(params).toEqual(['user-1']);
        expect(result).toEqual(mockProjects);
      });

      it('should return empty array when owner has no projects', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getProjectsForOwner('user-1');

        expect(result).toEqual([]);
      });
    });

    describe('getProjectById', () => {
      it('should return project when found and owned by user', async () => {
        const mockProject: ProjectRow = {
          id: 'project-1',
          owner_id: 'user-1',
          name: 'Test Project',
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([mockProject]));

        const result = await repo.getProjectById('user-1', 'project-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/SELECT \* FROM projects WHERE id = \$1 AND owner_id = \$2/i);
        expect(params).toEqual(['project-1', 'user-1']);
        expect(result).toEqual(mockProject);
      });

      it('should return null when project not found or not owned by user', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getProjectById('user-1', 'nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('getProjectStats', () => {
      it('should return normalized stats with zero buckets', async () => {
        const mockStats = [
          { status: 'COMPLETED', count: '3' },
          { status: 'IN_PROGRESS', count: '1' },
        ];

        mockQuery.mockResolvedValueOnce(createQueryResult(mockStats));

        const result = await repo.getProjectStats('user-1', 'project-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/SELECT t\.status, COUNT\(\*\)::int AS count/i);
        expect(String(sql)).toMatch(/GROUP BY t\.status/i);
        expect(params).toEqual(['project-1', 'user-1']);

        expect(result).toEqual({
          PENDING: 0,
          IN_PROGRESS: 1,
          COMPLETED: 3,
        });
      });

      it('should return all zeros when no tasks exist', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const result = await repo.getProjectStats('user-1', 'project-1');

        expect(result).toEqual({
          PENDING: 0,
          IN_PROGRESS: 0,
          COMPLETED: 0,
        });
      });
    });

    describe('updateProject', () => {
      it('should update project fields dynamically', async () => {
        const updatedProject: ProjectRow = {
          id: 'project-1',
          owner_id: 'user-1',
          name: 'Updated Project',
          description: 'Updated description',
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-02T00:00:00Z'),
        };

        mockQuery.mockResolvedValueOnce(createQueryResult([updatedProject]));

        const updates = {
          name: 'Updated Project',
          description: 'Updated description',
        };

        const result = await repo.updateProject('user-1', 'project-1', updates);

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/UPDATE projects SET/i);
        expect(String(sql)).toMatch(/name = \$1/i);
        expect(String(sql)).toMatch(/description = \$2/i);
        expect(String(sql)).toMatch(/updated_at = \$3/i);

        expect(params?.[0]).toBe('Updated Project');
        expect(params?.[1]).toBe('Updated description');
        expect(params?.[2]).toBeInstanceOf(Date);
        expect(params?.[3]).toBe('project-1');
        expect(params?.[4]).toBe('user-1');

        expect(result).toEqual(updatedProject);
      });

      it('should return null when no fields to update', async () => {
        const result = await repo.updateProject('user-1', 'project-1', {});

        expect(mockQuery).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });

      it('should return null when project not found or not owned by user', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        const updates = {
          name: 'Updated Project',
        };

        const result = await repo.updateProject('user-1', 'nonexistent', updates);

        expect(result).toBeNull();
      });
    });

    describe('deleteProject', () => {
      it('should delete project and return true when successful', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([{ id: 'project-1' }], 1));

        const result = await repo.deleteProject('user-1', 'project-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/DELETE FROM projects/i);
        expect(params).toEqual(['project-1', 'user-1']);
        expect(result).toBe(true);
      });

      it('should return false when project not found or not owned by user', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([], 0));

        const result = await repo.deleteProject('user-1', 'nonexistent');

        expect(result).toBe(false);
      });
    });
  });

  describe('Dynamic Filtering', () => {
    describe('getTasksByFilter', () => {
      it('should filter by project ID only', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        await repo.getTasksByFilter('user-1', 'project-1');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        const sqlString = String(sql);

        expect(sqlString).toMatch(/ta\.user_id = \$1/i);
        expect(sqlString).toMatch(/t\.project_id = \$2/i);
        expect(sqlString).not.toMatch(/t\.status = \$/i);
        expect(params).toEqual(['user-1', 'project-1']);
      });

      it('should filter by status only', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        await repo.getTasksByFilter('user-1', undefined, 'PENDING');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        const sqlString = String(sql);

        expect(sqlString).toMatch(/ta\.user_id = \$1/i);
        expect(sqlString).toMatch(/t\.status = \$2/i);
        expect(sqlString).not.toMatch(/t\.project_id = \$/i);
        expect(params).toEqual(['user-1', 'PENDING']);
      });

      it('should filter by both project ID and status', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        await repo.getTasksByFilter('user-1', 'project-1', 'PENDING');

        expect(mockQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockQuery.mock.calls[0];
        const sqlString = String(sql);

        expect(sqlString).toMatch(/ta\.user_id = \$1/i);
        expect(sqlString).toMatch(/t\.project_id = \$2/i);
        expect(sqlString).toMatch(/t\.status = \$3/i);
        expect(params).toEqual(['user-1', 'project-1', 'PENDING']);
      });

      it('should work with only user filter when no additional filters provided', async () => {
        mockQuery.mockResolvedValueOnce(createQueryResult([]));

        await repo.getTasksByFilter('user-1');

        const [sql, params] = mockQuery.mock.calls[0];
        expect(String(sql)).toMatch(/WHERE ta\.user_id = \$1/i);
        expect(String(sql)).not.toMatch(/t\.project_id/i);
        expect(String(sql)).not.toMatch(/t\.status/i);
        expect(params).toEqual(['user-1']);
      });
    });
  });

  describe('Error Propagation', () => {
    it('should propagate database errors from createUser', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Unique constraint violation'));

      await expect(repo.createUser('duplicate@example.com', 'password')).rejects.toThrow(
        'Unique constraint violation',
      );
    });

    it('should propagate database errors from createProject', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Foreign key constraint violation'));

      await expect(repo.createProject('nonexistent-user', 'Project Name')).rejects.toThrow(
        'Foreign key constraint violation',
      );
    });

    it('should propagate database errors from updateTask', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(repo.updateTask('user-1', 'task-1', { title: 'New Title' })).rejects.toThrow(
        'Connection timeout',
      );
    });
  });
});

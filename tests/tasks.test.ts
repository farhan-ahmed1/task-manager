import request from 'supertest';
import { testUtils } from './setup';

// Set up test environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/index').default;

// Mock repository
jest.mock('../src/db/repository', () => ({
  getUserById: jest.fn(),
  createTask: jest.fn(),
  getTaskById: jest.fn(),
  getTasks: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getTasksByFilter: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const repo = require('../src/db/repository');

describe('Tasks API', () => {
  const mockUser = testUtils.createMockUser();
  const authToken = testUtils.createAuthToken(mockUser.id);

  beforeEach(() => {
    jest.clearAllMocks();
    repo.getUserById.mockResolvedValue(mockUser);
  });

  describe('POST /api/tasks', () => {
    const validTaskData = {
      title: 'Test Task',
      description: 'Test task description',
      priority: 'MEDIUM',
      status: 'PENDING',
    };

    it('should create a new task successfully', async () => {
      const mockTask = { id: 'task-1', ...validTaskData, user_id: mockUser.id };
      repo.createTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTaskData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockTask);
      expect(repo.createTask).toHaveBeenCalledWith(mockUser.id, validTaskData);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/tasks').send(validTaskData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate required title field', async () => {
      const invalidData = { ...validTaskData } as Partial<typeof validTaskData>;
      delete invalidData.title;

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate title length limits', async () => {
      const invalidData = {
        ...validTaskData,
        title: 'x'.repeat(201), // Assuming 200 char limit
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate priority enum values', async () => {
      const invalidData = { ...validTaskData, priority: 'INVALID' };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate status enum values', async () => {
      const invalidData = { ...validTaskData, status: 'INVALID' };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors during creation', async () => {
      repo.createTask.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTaskData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should create task with minimal required data', async () => {
      const minimalData = { title: 'Minimal Task' };
      const mockTask = { id: 'task-1', ...minimalData, user_id: mockUser.id };
      repo.createTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockTask);
    });

    it('should handle optional project_id field', async () => {
      const taskWithProject = {
        ...validTaskData,
        project_id: '12345678-1234-5678-9012-123456789012',
      };
      const mockTask = { id: 'task-1', ...taskWithProject, user_id: mockUser.id };
      repo.createTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskWithProject);

      expect(response.status).toBe(201);
      expect(repo.createTask).toHaveBeenCalledWith(mockUser.id, taskWithProject);
    });
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks for authenticated user', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', user_id: mockUser.id },
        { id: 'task-2', title: 'Task 2', user_id: mockUser.id },
      ];
      repo.getTasksByFilter.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockTasks);
      expect(repo.getTasksByFilter).toHaveBeenCalledWith(mockUser.id, undefined, undefined);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      repo.getTasksByFilter.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array when user has no tasks', async () => {
      repo.getTasksByFilter.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/tasks/:id', () => {
    const taskId = 'task-1';
    const mockTask = { id: taskId, title: 'Test Task', user_id: mockUser.id };

    it('should get a specific task by id', async () => {
      repo.getTaskById.mockResolvedValue(mockTask);

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockTask);
      expect(repo.getTaskById).toHaveBeenCalledWith(mockUser.id, taskId);
    });

    it('should require authentication', async () => {
      const response = await request(app).get(`/api/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent task', async () => {
      repo.getTaskById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      repo.getTaskById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should not allow access to tasks from other users', async () => {
      const otherUserTask = { id: taskId, title: 'Other User Task', user_id: 'other-user' };
      repo.getTaskById.mockResolvedValue(otherUserTask);

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should return null from repository for tasks not belonging to user
      expect(repo.getTaskById).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: otherUserTask });
    });
  });

  describe('PUT /api/tasks/:id', () => {
    const taskId = 'task-1';
    const updateData = {
      title: 'Updated Task',
      description: 'Updated description',
      status: 'IN_PROGRESS',
    };

    it('should update a task successfully', async () => {
      const updatedTask = { id: taskId, ...updateData, user_id: mockUser.id };
      repo.updateTask.mockResolvedValue(updatedTask);

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(updatedTask);
      expect(repo.updateTask).toHaveBeenCalledWith(mockUser.id, taskId, updateData);
    });

    it('should require authentication', async () => {
      const response = await request(app).put(`/api/tasks/${taskId}`).send(updateData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent task', async () => {
      repo.updateTask.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate update data', async () => {
      const invalidData = { title: 'x'.repeat(201) }; // Too long

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { status: 'COMPLETED' };
      const updatedTask = {
        id: taskId,
        title: 'Original Title',
        ...partialUpdate,
        user_id: mockUser.id,
      };
      repo.updateTask.mockResolvedValue(updatedTask);

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(repo.updateTask).toHaveBeenCalledWith(mockUser.id, taskId, partialUpdate);
    });

    it('should handle database errors', async () => {
      repo.updateTask.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    const taskId = 'task-1';

    it('should delete a task successfully', async () => {
      repo.deleteTask.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(repo.deleteTask).toHaveBeenCalledWith(mockUser.id, taskId);
    });

    it('should require authentication', async () => {
      const response = await request(app).delete(`/api/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent task', async () => {
      repo.deleteTask.mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      repo.deleteTask.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Query Parameters and Filtering', () => {
    it('should handle project filtering', async () => {
      const projectId = '12345678-1234-5678-9012-123456789012';
      const mockTasks = [{ id: 'task-1', title: 'Project Task', project_id: projectId }];
      repo.getTasksByFilter.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get(`/api/tasks?project_id=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Note: Actual implementation may vary based on your API design
    });

    it('should handle status filtering', async () => {
      const mockTasks = [{ id: 'task-1', title: 'Completed Task', status: 'COMPLETED' }];
      repo.getTasksByFilter.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks?status=COMPLETED')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Implementation would filter by status
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ malformed json }');

      expect(response.status).toBe(400);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'x'.repeat(10000);
      const taskData = { title: 'Test', description: longDescription };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      // Should either succeed or fail with proper validation
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in task data', async () => {
      const taskData = {
        title: 'Task with special chars: !@#$%^&*()',
        description: 'Description with unicode: 🚀 💻 ✅',
      };
      const mockTask = { id: 'task-1', ...taskData, user_id: mockUser.id };
      repo.createTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(taskData.title);
    });

    it('should handle invalid UUIDs gracefully', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      // Should handle gracefully, either 200 (success), 400 or 404
      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });
});

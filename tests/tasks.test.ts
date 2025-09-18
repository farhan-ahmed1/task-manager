// tests/tasks.test.ts
import request from 'supertest';
import app from '../src/index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
};

const testTask = {
  title: 'Test Task',
  description: 'This is a test task',
  priority: 'HIGH' as const,
  status: 'PENDING' as const,
};

describe('Task CRUD Operations', () => {
  let authToken: string;
  let taskId: string;

  beforeAll(async () => {
    // Register and login to get auth token
    await request(app).post('/auth/register').send(testUser);

    const loginResponse = await request(app).post('/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Close database connections to prevent Jest from hanging
    const pool = await import('../src/db/pool');
    await pool.default.end();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTask)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(testTask.title);
      expect(response.body.data.description).toBe(testTask.description);
      expect(response.body.data.priority).toBe(testTask.priority);
      expect(response.body.data.status).toBe(testTask.status);
      expect(response.body.message).toBe('Task created successfully');

      taskId = response.body.data.id;
    });

    it('should require authentication', async () => {
      await request(app).post('/api/tasks').send(testTask).expect(401);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Missing title' })
        .expect(400);
    });
  });

  describe('GET /api/tasks', () => {
    it('should list all user tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/tasks').expect(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a specific task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe(testTask.title);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const updates = {
        title: 'Updated Task Title',
        status: 'IN_PROGRESS' as const,
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.status).toBe(updates.status);
      expect(response.body.message).toBe('Task updated successfully');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Title' })
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

import request from 'supertest';
import app from '../src/index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface TaskResponse {
  id: string;
  title: string;
  project_id?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const user = { email: 'proj@example.com', password: 'password123', name: 'Proj User' };

describe('Projects API', () => {
  let token: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    await request(app).post('/auth/register').send(user);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: user.password });
    token = login.body.token;
  });

  afterAll(async () => {
    const pool = await import('../src/db/pool');
    await pool.default.end();
  });

  it('creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Project', description: 'Test project' })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    projectId = res.body.data.id;
  });

  it('lists projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.find((p: ProjectResponse) => p.id === projectId)).toBeTruthy();
  });

  it('creates a task under the project and filters by project', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Proj Task', project_id: projectId })
      .expect(201);

    taskId = taskRes.body.data.id;

    const listRes = await request(app)
      .get('/api/tasks')
      .query({ project_id: projectId })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some((t: TaskResponse) => t.id === taskId)).toBe(true);
  });

  it('returns project stats', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/stats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data).toHaveProperty('PENDING');
    expect(res.body.data).toHaveProperty('IN_PROGRESS');
    expect(res.body.data).toHaveProperty('COMPLETED');
    expect(res.body.data.PENDING).toBeGreaterThan(0);
  });

  it('updates a project', async () => {
    const updates = { name: 'Updated Project Name', description: 'Updated description' };
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updates)
      .expect(200);

    expect(res.body.data.name).toBe(updates.name);
    expect(res.body.data.description).toBe(updates.description);
    expect(res.body.message).toBe('Project updated successfully');
  });

  it('returns 404 for non-existent project operations', async () => {
    const fakeId = '123e4567-e89b-12d3-a456-426614174000';

    await request(app)
      .get(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    await request(app)
      .put(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(404);

    await request(app)
      .get(`/api/projects/${fakeId}/stats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('validates project creation', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' }) // Invalid: empty name
      .expect(400);
  });

  it('deletes a project', async () => {
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Verify project is deleted
    await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  describe('Error Handling', () => {
    beforeAll(() => {
      // Mock repository functions to test error scenarios
      jest.doMock('../src/db/repository', () => ({
        ...jest.requireActual('../src/db/repository'),
        getProjectsForOwner: jest.fn(),
        getProjectById: jest.fn(),
        getProjectStats: jest.fn(),
      }));
    });

    it('should handle database errors when listing projects', async () => {
      const repo = await import('../src/db/repository');
      const mockGetProjectsForOwner = repo.getProjectsForOwner as jest.Mock;

      mockGetProjectsForOwner.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      mockGetProjectsForOwner.mockRestore();
    });

    it('should handle database errors when getting project stats', async () => {
      const repo = await import('../src/db/repository');
      const mockGetProjectById = repo.getProjectById as jest.Mock;
      const mockGetProjectStats = repo.getProjectStats as jest.Mock;

      // Mock project exists but stats query fails
      mockGetProjectById.mockResolvedValueOnce({ id: 'test-id', name: 'Test' });
      mockGetProjectStats.mockRejectedValueOnce(new Error('Stats query failed'));

      const response = await request(app)
        .get('/api/projects/test-id/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      mockGetProjectById.mockRestore();
      mockGetProjectStats.mockRestore();
    });
  });
});
